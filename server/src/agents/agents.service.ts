import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ActivityService } from '../activity/activity.service'
import { StorageService } from '../documents/storage.service'
import argon2 from 'argon2'
import { randomBytes } from 'node:crypto'
import type {
  CreateAgentDto,
  CreateCommissionDto,
  ListAgentsDto,
  ListCommissionsDto,
  ListReferralsDto,
  UpdateAgentDto,
  UpdateCommissionDto,
  UpdateSubmissionSettingDto,
} from './dto/agent.dto'

const TENANT_ID = 1n

/** The three document slots an agent profile carries. */
export const AGENT_DOCUMENT_SLOTS = ['logo', 'idProof', 'incorporationCert'] as const
export type AgentDocumentSlot = (typeof AGENT_DOCUMENT_SLOTS)[number]

/** Slot -> the Agent column holding its storage key. */
const DOC_FIELD: Record<AgentDocumentSlot, string> = {
  logo: 'logoUrl',
  idProof: 'idProofUrl',
  incorporationCert: 'incorporationCertUrl',
}

/**
 * Commission rate crosses the API as a percent (12.5) and is stored in basis
 * points (1250), so the arithmetic stays in integers — the same reason invoice
 * amounts are minor units.
 */
const toBps = (percent: number): number => Math.round((Number(percent) || 0) * 100)
const fromBps = (bps: number): number => bps / 100

const toMinor = (amount: number): number => Math.round((Number(amount) || 0) * 100)
const fromMinor = (minor: number): number => minor / 100

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmtDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`

@Injectable()
export class AgentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ActivityService) private readonly activity: ActivityService,
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  private get db() {
    return this.prisma.client
  }

  async list(query: ListAgentsDto) {
    const where: Record<string, unknown> = { tenantId: TENANT_ID, deletedAt: null }
    if (query.status) where.status = query.status === 'Active' ? 'active' : 'inactive'
    if (query.category) where.category = query.category
    if (query.branch) where.branch = { name: query.branch }
    if (query.search?.trim()) {
      const q = query.search.trim()
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ]
    }

    const rows = await this.db.agent.findMany({
      where,
      include: this.relations,
      orderBy: { name: 'asc' },
    })
    return rows.map((r) => this.toDto(r))
  }

  async get(id: number) {
    const agent = await this.db.agent.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      include: this.relations,
    })
    if (!agent) throw new NotFoundException(`Agent ${id} not found.`)
    return this.toDto(agent)
  }

  async submissionSetting() {
    const setting = await this.db.appSetting.findUnique({
      where: { tenantId_key: { tenantId: TENANT_ID, key: 'agents.allowApplicationSubmission' } },
      select: { value: true },
    })
    return { enabled: setting?.value === true }
  }

  async updateSubmissionSetting(dto: UpdateSubmissionSettingDto, actorPublicId?: string) {
    const actorId = await this.resolveActorId(actorPublicId)
    const setting = await this.db.$transaction(async (tx) => {
      const updated = await tx.appSetting.upsert({
        where: { tenantId_key: { tenantId: TENANT_ID, key: 'agents.allowApplicationSubmission' } },
        update: { value: dto.enabled },
        create: { tenantId: TENANT_ID, key: 'agents.allowApplicationSubmission', value: dto.enabled },
      })
      await this.activity.recordWithActorId(
        { action: 'agent.submission_setting.updated', entity: 'agent', entityId: 0n, meta: { enabled: dto.enabled } },
        actorId,
        tx,
      )
      return updated
    })
    return { enabled: setting.value === true }
  }

  async listReferrals(query: ListReferralsDto) {
    const agentId = query.agentId ? BigInt(query.agentId) : undefined
    const search = query.search?.trim()
    const text = search
      ? { OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
        ] }
      : {}
    const [leads, students] = await Promise.all([
      this.db.lead.findMany({
        where: { ...text, tenantId: TENANT_ID, deletedAt: null, referredByAgentId: agentId },
        include: { status: true, referredByAgent: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.db.student.findMany({
        where: { ...text, tenantId: TENANT_ID, deletedAt: null, referredByAgentId: agentId },
        include: { status: true, referredByAgent: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ])
    return [...leads.map((row) => ({
      id: Number(row.id), type: 'Lead' as const, name: row.name, email: row.email ?? '', phone: row.phone ?? '',
      status: row.status.label, addedOn: fmtDate(row.createdAt), agent: row.referredByAgent,
    })), ...students.map((row) => ({
      id: Number(row.id), type: 'Student' as const, name: row.name, email: row.email ?? '', phone: row.phone ?? '',
      status: row.status.label, addedOn: fmtDate(row.createdAt), agent: row.referredByAgent,
    }))].sort((a, b) => b.addedOn.localeCompare(a.addedOn))
  }

  async create(dto: CreateAgentDto, actorPublicId?: string) {
    const existing = await this.db.agent.findFirst({
      where: { tenantId: TENANT_ID, name: dto.name.trim() },
    })
    if (existing) throw new BadRequestException(`An agent named "${dto.name}" already exists.`)

    // Check the email before the transaction rather than letting the users
    // unique constraint fail: a raw constraint error surfaces as a 500 and
    // tells the operator nothing about which field clashed.
    if (dto.email && dto.password) await this.assertEmailFree(dto.email)

    const actorId = await this.resolveActorId(actorPublicId)
    const created = await this.db.$transaction(async (tx) => {
      const agent = await tx.agent.create({
        data: {
          tenantId: TENANT_ID,
          name: dto.name.trim(),
          firstName: dto.firstName ?? null,
          lastName: dto.lastName ?? null,
          branchId: BigInt(dto.branchId ?? 1),
          pointOfContactId: dto.pointOfContactId != null ? BigInt(dto.pointOfContactId) : null,
          company: dto.company ?? null,
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          country: dto.country ?? null,
          state: dto.state ?? null,
          city: dto.city ?? null,
          address: dto.address ?? null,
          category: dto.category ?? null,
          logoUrl: dto.logoUrl ?? null,
          idProofUrl: dto.idProofUrl ?? null,
          incorporationCertUrl: dto.incorporationCertUrl ?? null,
          canSubmitApplications: dto.canSubmitApplications ?? false,
          autoConvertReferrals: dto.autoConvertReferrals ?? false,
          commissionRateBps: toBps(dto.commissionRate ?? 0),
          status: dto.status === 'Inactive' ? 'inactive' : 'active',
        },
        include: this.relations,
      })
      if (dto.email && dto.password) {
        const role = await tx.role.findFirst({ where: { tenantId: TENANT_ID, name: 'Agent', deletedAt: null } })
        if (!role) throw new NotFoundException('Agent role is not configured.')
        const user = await tx.user.create({
          data: { tenantId: TENANT_ID, name: dto.name.trim(), email: dto.email.toLowerCase().trim(), passwordHash: await argon2.hash(dto.password), roleId: role.id, branchId: BigInt(dto.branchId ?? 1) },
        })
        await tx.agent.update({ where: { id: agent.id }, data: { userId: user.id } })
      }
      await this.activity.recordWithActorId(
        { action: 'agent.created', entity: 'agent', entityId: agent.id, meta: { name: agent.name } },
        actorId,
        tx,
      )
      return agent
    })
    return this.toDto(created)
  }

  /**
   * Update an agent. Renaming is safe: applications point at the id, so every
   * record referring to this agent shows the new name immediately — which is
   * the whole reason `agentName` became a foreign key.
   */
  async update(id: number, dto: UpdateAgentDto, actorPublicId?: string) {
    await this.get(id)
    const actorId = await this.resolveActorId(actorPublicId)

    const updated = await this.db.$transaction(async (tx) => {
      const current = await tx.agent.findUnique({ where: { id: BigInt(id) }, select: { userId: true } })
      const agent = await tx.agent.update({
        where: { id: BigInt(id) },
        data: {
          name: dto.name?.trim() ?? undefined,
          firstName: dto.firstName ?? undefined,
          lastName: dto.lastName ?? undefined,
          country: dto.country ?? undefined,
          state: dto.state ?? undefined,
          city: dto.city ?? undefined,
          address: dto.address ?? undefined,
          category: dto.category ?? undefined,
          branchId: dto.branchId != null ? BigInt(dto.branchId) : undefined,
          // null clears the assignment, undefined leaves it untouched — the two
          // must stay distinguishable or the field can never be unset.
          pointOfContactId:
            dto.pointOfContactId === undefined
              ? undefined
              : dto.pointOfContactId === null
                ? null
                : BigInt(dto.pointOfContactId),
          logoUrl: dto.logoUrl ?? undefined,
          idProofUrl: dto.idProofUrl ?? undefined,
          incorporationCertUrl: dto.incorporationCertUrl ?? undefined,
          company: dto.company ?? undefined,
          email: dto.email ?? undefined,
          phone: dto.phone ?? undefined,
          canSubmitApplications: dto.canSubmitApplications ?? undefined,
          autoConvertReferrals: dto.autoConvertReferrals ?? undefined,
          commissionRateBps: dto.commissionRate != null ? toBps(dto.commissionRate) : undefined,
          status: dto.status ? (dto.status === 'Inactive' ? 'inactive' : 'active') : undefined,
        },
        include: this.relations,
      })
      if (current?.userId && (dto.password || dto.email)) {
        if (dto.email) await this.assertEmailFree(dto.email, current.userId)
        await tx.user.update({ where: { id: current.userId }, data: { email: dto.email?.toLowerCase().trim() ?? undefined, passwordHash: dto.password ? await argon2.hash(dto.password) : undefined } })
      }
      await this.activity.recordWithActorId(
        {
          action: 'agent.updated',
          entity: 'agent',
          entityId: BigInt(id),
          meta: { fields: Object.keys(dto) },
        },
        actorId,
        tx,
      )
      return agent
    })
    return this.toDto(updated)
  }

  /**
   * Soft delete. The row stays so historical applications and commissions still
   * resolve to a name — hard-deleting would leave them pointing at nothing.
   */
  async remove(id: number, actorPublicId?: string) {
    await this.get(id)
    const actorId = await this.resolveActorId(actorPublicId)
    await this.db.$transaction(async (tx) => {
      await tx.agent.update({
        where: { id: BigInt(id) },
        data: { deletedAt: new Date(), status: 'inactive' },
      })
      await this.activity.recordWithActorId(
        { action: 'agent.deleted', entity: 'agent', entityId: BigInt(id) },
        actorId,
        tx,
      )
    })
    return { ok: true }
  }

  // ---- Commissions ---------------------------------------------------------

  async listCommissions(query: ListCommissionsDto) {
    const where: Record<string, unknown> = { tenantId: TENANT_ID, deletedAt: null }
    if (query.agentId) where.agentId = BigInt(query.agentId)
    if (query.status) where.status = { label: query.status }
    if (query.from || query.to) where.createdAt = { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}) }

    const rows = await this.db.commission.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true } },
        application: { select: { id: true, student: { select: { name: true, studentNo: true } }, course: { select: { title: true, university: { select: { name: true } } } }, intake: { select: { month: true, year: true } } } },
        status: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map((c) => this.commissionDto(c))
  }

  /**
   * Record what an agent earned on one application.
   *
   * The amount may be given directly or derived from the agent's rate and a
   * base figure. Derived is preferred: it keeps the stored number consistent
   * with the rate on file rather than depending on whoever typed it.
   */
  async createCommission(dto: CreateCommissionDto, actorPublicId?: string) {
    const agent = await this.db.agent.findFirst({
      where: { id: BigInt(dto.agentId), tenantId: TENANT_ID, deletedAt: null },
    })
    if (!agent) throw new NotFoundException(`Agent ${dto.agentId} not found.`)

    const application = await this.db.application.findFirst({
      where: { id: BigInt(dto.applicationId), tenantId: TENANT_ID, deletedAt: null },
    })
    if (!application) throw new NotFoundException(`Application ${dto.applicationId} not found.`)

    const amountMinor =
      dto.amount != null
        ? toMinor(dto.amount)
        : Math.round((toMinor(dto.baseAmount ?? 0) * agent.commissionRateBps) / 10_000)
    if (amountMinor <= 0) {
      throw new BadRequestException(
        'A commission needs a positive amount — pass `amount`, or `baseAmount` with a rate on the agent.',
      )
    }

    const statusId = await this.commissionStatusId('pending')
    const actorId = await this.resolveActorId(actorPublicId)

    const created = await this.db.$transaction(async (tx) => {
      const commission = await tx.commission.create({
        data: {
          tenantId: TENANT_ID,
          agentId: agent.id,
          applicationId: application.id,
          amountMinor,
          currency: dto.currency ?? 'USD',
          statusId,
          note: dto.note ?? null,
        },
      })
      await this.activity.recordWithActorId(
        {
          action: 'commission.created',
          entity: 'commission',
          entityId: commission.id,
          meta: { agent: agent.name, amount: fromMinor(amountMinor) },
        },
        actorId,
        tx,
      )
      return commission
    })

    const full = await this.db.commission.findFirst({
      where: { id: created.id },
      include: {
        agent: { select: { id: true, name: true } },
        application: { select: { id: true, student: { select: { name: true, studentNo: true } }, course: { select: { title: true, university: { select: { name: true } } } }, intake: { select: { month: true, year: true } } } },
        status: true,
      },
    })
    return this.commissionDto(full!)
  }

  /** Mark a commission paid (or back to pending). */
  async updateCommission(id: number, dto: UpdateCommissionDto, actorPublicId?: string) {
    const current = await this.db.commission.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      include: { status: true },
    })
    if (!current) throw new NotFoundException(`Commission ${id} not found.`)

    const status = dto.status
      ? await this.db.commissionStatus.findFirst({
          where: { tenantId: TENANT_ID, label: dto.status, deletedAt: null },
        })
      : null
    if (dto.status && !status) throw new NotFoundException(`Commission status "${dto.status}" not found.`)

    const actorId = await this.resolveActorId(actorPublicId)

    await this.db.$transaction(async (tx) => {
      await tx.commission.update({
        where: { id: BigInt(id) },
        data: {
          statusId: status?.id ?? undefined,
          note: dto.note ?? undefined,
          // paidAt tracks the status rather than being set independently, so
          // "paid" and "has a payment date" can never disagree.
          paidAt: status ? (status.isPaid ? (dto.paidAt ? new Date(dto.paidAt) : new Date()) : null) : undefined,
        },
      })
      await this.activity.recordWithActorId(
        {
          action: 'commission.updated',
          entity: 'commission',
          entityId: BigInt(id),
          meta: { from: current.status.label, to: dto.status ?? current.status.label },
        },
        actorId,
        tx,
      )
    })

    const full = await this.db.commission.findFirst({
      where: { id: BigInt(id) },
      include: {
        agent: { select: { id: true, name: true } },
        application: { select: { id: true, student: { select: { name: true, studentNo: true } }, course: { select: { title: true, university: { select: { name: true } } } }, intake: { select: { month: true, year: true } } } },
        status: true,
      },
    })
    return this.commissionDto(full!)
  }

  async commissionStatuses() {
    const rows = await this.db.commissionStatus.findMany({
      where: { tenantId: TENANT_ID, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    })
    return rows.map((s) => ({ label: s.label, color: s.color, isPaid: s.isPaid }))
  }

  private async commissionStatusId(key: string): Promise<bigint> {
    const found = await this.db.commissionStatus.findFirst({
      where: { tenantId: TENANT_ID, key, deletedAt: null },
    })
    if (found) return found.id
    const first = await this.db.commissionStatus.findFirst({
      where: { tenantId: TENANT_ID, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    })
    if (!first) throw new NotFoundException('No commission statuses are configured.')
    return first.id
  }

  /**
   * Create or reset the agent's portal login.
   *
   * There is no mail transport in this project, so this cannot literally send
   * an email. It provisions the account and returns a one-time password for the
   * operator to pass on out of band; wiring a provider later means replacing
   * the return value with a send, not restructuring this.
   */
  async invite(id: number, actorPublicId?: string) {
    const agent = await this.db.agent.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      select: { id: true, name: true, email: true, branchId: true, userId: true },
    })
    if (!agent) throw new NotFoundException(`Agent ${id} not found.`)
    if (!agent.email) {
      throw new BadRequestException('Add an email address before inviting this agent.')
    }

    const actorId = await this.resolveActorId(actorPublicId)
    // Readable but not guessable — it is shown once and meant to be changed.
    const tempPassword = `Ag-${randomBytes(6).toString('base64url')}`
    const passwordHash = await argon2.hash(tempPassword)
    const reset = agent.userId != null

    if (!reset) await this.assertEmailFree(agent.email)

    await this.db.$transaction(async (tx) => {
      if (agent.userId != null) {
        await tx.user.update({
          where: { id: agent.userId },
          data: { email: agent.email!.toLowerCase().trim(), passwordHash },
        })
      } else {
        const role = await tx.role.findFirst({
          where: { tenantId: TENANT_ID, name: 'Agent', deletedAt: null },
        })
        if (!role) throw new NotFoundException('Agent role is not configured.')
        const user = await tx.user.create({
          data: {
            tenantId: TENANT_ID,
            name: agent.name,
            email: agent.email!.toLowerCase().trim(),
            passwordHash,
            roleId: role.id,
            branchId: agent.branchId,
          },
        })
        await tx.agent.update({ where: { id: agent.id }, data: { userId: user.id } })
      }
      await this.activity.recordWithActorId(
        {
          action: reset ? 'agent.invitation_resent' : 'agent.invited',
          entity: 'agent',
          entityId: agent.id,
          meta: { email: agent.email },
        },
        actorId,
        tx,
      )
    })

    return { ok: true, reset, email: agent.email, tempPassword }
  }

  /**
   * Attach a document to an agent.
   *
   * The three slots are fixed fields on the agent rather than a document table:
   * each is single-valued and replacing one should drop the old file, which a
   * generic list would not express.
   */
  async uploadDocument(
    id: number,
    slot: AgentDocumentSlot,
    file: Express.Multer.File,
    actorPublicId?: string,
  ) {
    if (!file?.buffer?.length) throw new BadRequestException('No file was uploaded.')
    const agent = await this.db.agent.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      select: { id: true, [DOC_FIELD[slot]]: true } as { id: true },
    })
    if (!agent) throw new NotFoundException(`Agent ${id} not found.`)

    const previous = (agent as Record<string, unknown>)[DOC_FIELD[slot]] as string | null
    const key = await this.storage.put(file.buffer, file.originalname)
    const actorId = await this.resolveActorId(actorPublicId)

    await this.db.$transaction(async (tx) => {
      await tx.agent.update({
        where: { id: BigInt(id) },
        data: { [DOC_FIELD[slot]]: key },
      })
      await this.activity.recordWithActorId(
        {
          action: 'agent.document_uploaded',
          entity: 'agent',
          entityId: BigInt(id),
          meta: { slot, fileName: file.originalname },
        },
        actorId,
        tx,
      )
    })

    // Replacing a document leaves the old blob orphaned otherwise.
    if (previous) await this.storage.remove(previous)
    return this.get(id)
  }

  /** A readable stream for one of an agent's documents. */
  async documentFile(id: number, slot: AgentDocumentSlot) {
    const agent = await this.db.agent.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
    })
    if (!agent) throw new NotFoundException(`Agent ${id} not found.`)
    const key = (agent as Record<string, unknown>)[DOC_FIELD[slot]] as string | null
    if (!key) throw new NotFoundException(`This agent has no ${slot} on file.`)
    const stream = this.storage.read(key)
    if (!stream) throw new NotFoundException('The stored file is no longer available.')
    return { stream, name: key }
  }

  /** Remove a document from an agent, deleting the stored blob. */
  async removeDocument(id: number, slot: AgentDocumentSlot, actorPublicId?: string) {
    const agent = await this.db.agent.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
    })
    if (!agent) throw new NotFoundException(`Agent ${id} not found.`)
    const key = (agent as Record<string, unknown>)[DOC_FIELD[slot]] as string | null

    const actorId = await this.resolveActorId(actorPublicId)
    await this.db.$transaction(async (tx) => {
      await tx.agent.update({ where: { id: BigInt(id) }, data: { [DOC_FIELD[slot]]: null } })
      await this.activity.recordWithActorId(
        { action: 'agent.document_removed', entity: 'agent', entityId: BigInt(id), meta: { slot } },
        actorId,
        tx,
      )
    })
    if (key) await this.storage.remove(key)
    return this.get(id)
  }

  /**
   * Refuse an email already used by another login.
   *
   * `exceptUserId` lets an agent keep their own address on update — otherwise
   * saving the form unchanged would report a clash with itself.
   */
  private async assertEmailFree(email: string, exceptUserId?: bigint): Promise<void> {
    const taken = await this.db.user.findFirst({
      where: {
        tenantId: TENANT_ID,
        email: email.toLowerCase().trim(),
        deletedAt: null,
        ...(exceptUserId ? { NOT: { id: exceptUserId } } : {}),
      },
      select: { id: true },
    })
    if (taken) throw new BadRequestException(`The email "${email}" is already in use.`)
  }

  private async resolveActorId(publicId?: string): Promise<bigint | null> {
    if (!publicId) return null
    const user = await this.db.user.findFirst({
      where: { publicId, tenantId: TENANT_ID },
      select: { id: true },
    })
    return user?.id ?? null
  }

  private readonly relations = {
    // Joined so the DTO can return names, not bare ids: a detail screen showing
    // "Branch ID 3" makes the reader do a lookup the server already can.
    branch: { select: { name: true } },
    pointOfContact: { select: { name: true } },
    _count: {
      select: {
        applications: { where: { deletedAt: null } },
        commissions: { where: { deletedAt: null } },
      },
    },
  } as const

  private toDto(a: {
    id: bigint
    publicId: string
    name: string
    firstName: string | null
    lastName: string | null
    company: string | null
    email: string | null
    phone: string | null
    country: string | null
    state: string | null
    city: string | null
    address: string | null
    category: string | null
    branchId: bigint
    pointOfContactId: bigint | null
    branch?: { name: string } | null
    pointOfContact?: { name: string } | null
    logoUrl: string | null
    idProofUrl: string | null
    incorporationCertUrl: string | null
    userId: bigint | null
    canSubmitApplications: boolean
    autoConvertReferrals: boolean
    commissionRateBps: number
    status: string
    createdAt: Date
    _count?: { applications: number; commissions: number }
  }) {
    return {
      id: Number(a.id),
      publicId: a.publicId,
      name: a.name,
      firstName: a.firstName ?? '',
      lastName: a.lastName ?? '',
      company: a.company ?? '',
      email: a.email ?? '',
      phone: a.phone ?? '',
      country: a.country ?? '',
      state: a.state ?? '',
      city: a.city ?? '',
      address: a.address ?? '',
      category: a.category ?? '',
      branchId: Number(a.branchId),
      branch: a.branch?.name ?? '',
      pointOfContactId: a.pointOfContactId == null ? null : Number(a.pointOfContactId),
      pointOfContact: a.pointOfContact?.name ?? null,
      logoUrl: a.logoUrl ?? '',
      idProofUrl: a.idProofUrl ?? '',
      incorporationCertUrl: a.incorporationCertUrl ?? '',
      userId: a.userId == null ? null : Number(a.userId),
      canSubmitApplications: a.canSubmitApplications,
      autoConvertReferrals: a.autoConvertReferrals,
      commissionRate: fromBps(a.commissionRateBps),
      status: a.status === 'active' ? 'Active' : 'Inactive',
      joined: fmtDate(a.createdAt),
      // Counted through foreign keys, not by matching names.
      applications: a._count?.applications ?? 0,
      commissions: a._count?.commissions ?? 0,
    }
  }

  private commissionDto(c: {
    id: bigint
    amountMinor: number
    currency: string
    paidAt: Date | null
    note: string | null
    createdAt: Date
    agent: { id: bigint; name: string }
    application: {
      id: bigint
      student: { name: string; studentNo: string }
      course: { title: string; university: { name: string } } | null
      intake: { month: number; year: number | null } | null
    }
    status: { label: string; color: string; isPaid: boolean }
  }) {
    return {
      id: Number(c.id),
      agentId: Number(c.agent.id),
      agent: c.agent.name,
      applicationId: Number(c.application.id),
      student: c.application.student.name,
      studentNo: c.application.student.studentNo,
      course: c.application.course?.title ?? '',
      university: c.application.course?.university.name ?? '',
      intake: c.application.intake ? `${c.application.intake.month}/${c.application.intake.year ?? ''}` : '',
      amount: fromMinor(c.amountMinor),
      currency: c.currency,
      status: c.status.label,
      statusColor: c.status.color,
      paidAt: c.paidAt ? fmtDate(c.paidAt) : null,
      note: c.note ?? '',
      created: fmtDate(c.createdAt),
    }
  }
}
