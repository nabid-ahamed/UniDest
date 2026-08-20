import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ActivityService } from '../activity/activity.service'
import type {
  CreateAgentDto,
  CreateCommissionDto,
  ListAgentsDto,
  ListCommissionsDto,
  UpdateAgentDto,
  UpdateCommissionDto,
} from './dto/agent.dto'

const TENANT_ID = 1n

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
  ) {}

  private get db() {
    return this.prisma.client
  }

  async list(query: ListAgentsDto) {
    const where: Record<string, unknown> = { tenantId: TENANT_ID, deletedAt: null }
    if (query.status) where.status = query.status === 'Active' ? 'active' : 'inactive'
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

  async create(dto: CreateAgentDto, actorPublicId?: string) {
    const existing = await this.db.agent.findFirst({
      where: { tenantId: TENANT_ID, name: dto.name.trim() },
    })
    if (existing) throw new BadRequestException(`An agent named "${dto.name}" already exists.`)

    const actorId = await this.resolveActorId(actorPublicId)
    const created = await this.db.$transaction(async (tx) => {
      const agent = await tx.agent.create({
        data: {
          tenantId: TENANT_ID,
          name: dto.name.trim(),
          company: dto.company ?? null,
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          commissionRateBps: toBps(dto.commissionRate ?? 0),
          status: dto.status === 'Inactive' ? 'inactive' : 'active',
        },
        include: this.relations,
      })
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
      const agent = await tx.agent.update({
        where: { id: BigInt(id) },
        data: {
          name: dto.name?.trim() ?? undefined,
          company: dto.company ?? undefined,
          email: dto.email ?? undefined,
          phone: dto.phone ?? undefined,
          commissionRateBps: dto.commissionRate != null ? toBps(dto.commissionRate) : undefined,
          status: dto.status ? (dto.status === 'Inactive' ? 'inactive' : 'active') : undefined,
        },
        include: this.relations,
      })
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

    const rows = await this.db.commission.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true } },
        application: { select: { id: true, student: { select: { name: true, studentNo: true } } } },
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
        application: { select: { id: true, student: { select: { name: true, studentNo: true } } } },
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
        application: { select: { id: true, student: { select: { name: true, studentNo: true } } } },
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

  private async resolveActorId(publicId?: string): Promise<bigint | null> {
    if (!publicId) return null
    const user = await this.db.user.findFirst({
      where: { publicId, tenantId: TENANT_ID },
      select: { id: true },
    })
    return user?.id ?? null
  }

  private readonly relations = {
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
    company: string | null
    email: string | null
    phone: string | null
    commissionRateBps: number
    status: string
    createdAt: Date
    _count?: { applications: number; commissions: number }
  }) {
    return {
      id: Number(a.id),
      publicId: a.publicId,
      name: a.name,
      company: a.company ?? '',
      email: a.email ?? '',
      phone: a.phone ?? '',
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
    application: { id: bigint; student: { name: string; studentNo: string } }
    status: { label: string; color: string; isPaid: boolean }
  }) {
    return {
      id: Number(c.id),
      agentId: Number(c.agent.id),
      agent: c.agent.name,
      applicationId: Number(c.application.id),
      student: c.application.student.name,
      studentNo: c.application.student.studentNo,
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
