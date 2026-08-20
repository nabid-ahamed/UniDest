import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ActivityService } from '../activity/activity.service'
import type { CreateLeadDto, ListLeadsDto, UpdateLeadDto } from './dto/lead.dto'

const TENANT_ID = 1n

/** Prisma row shape the mapper needs (lead plus its joined lookups). */
type LeadWithRelations = {
  id: bigint
  publicId: string
  name: string
  email: string | null
  phone: string | null
  phoneNote: string | null
  whatsapp: boolean
  gender: string | null
  source: string | null
  studyLevel: string | null
  qualification: string | null
  tags: string[]
  nextFollowUpAt: Date | null
  convertedStudentId: bigint | null
  createdAt: Date
  status: { label: string; color: string }
  branch: { name: string } | null
  assignedTo: { name: string } | null
  primaryInterestCountry: { name: string } | null
}

@Injectable()
export class LeadsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ActivityService) private readonly activity: ActivityService,
  ) {}

  private get db() {
    return this.prisma.client
  }

  async list(query: ListLeadsDto) {
    // Coerced here rather than trusting @Type(() => Number): tsx/esbuild does
    // not emit decorator metadata, so class-transformer cannot see the target
    // type and query params arrive as strings.
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 50))

    const where: Record<string, unknown> = { tenantId: TENANT_ID, deletedAt: null }

    if (query.includeConverted !== 'true') where.convertedStudentId = null
    if (query.status) where.status = { label: query.status }
    if (query.branch) where.branch = { name: query.branch }
    if (query.assignedTo) where.assignedTo = { name: query.assignedTo }
    if (query.search?.trim()) {
      const q = query.search.trim()
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ]
    }

    const [rows, total] = await Promise.all([
      this.db.lead.findMany({
        where,
        include: this.relations,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.lead.count({ where }),
    ])

    return { data: rows.map((r) => this.toDto(r as LeadWithRelations)), total, page, limit }
  }

  async get(id: number) {
    const lead = await this.db.lead.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      include: this.relations,
    })
    if (!lead) throw new NotFoundException(`Lead ${id} not found.`)
    return this.toDto(lead as LeadWithRelations)
  }

  async create(dto: CreateLeadDto, actorPublicId?: string) {
    const links = await this.resolveLinks(dto)
    // Every lead needs a status; new ones start at the first pipeline stage.
    const statusId = links.statusId ?? (await this.defaultStatusId())

    const actorId = await this.resolveActorId(actorPublicId)

    // Wrapped so the audit row commits with the lead, never on its own.
    const lead = await this.db.$transaction(async (tx) => {
      const created = await tx.lead.create({
      data: {
        tenantId: TENANT_ID,
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        phoneNote: dto.phoneNote ?? null,
        whatsapp: dto.whatsapp ?? false,
        gender: dto.gender ?? null,
        source: dto.source ?? null,
        studyLevel: dto.studyLevel ?? null,
        qualification: dto.qualification ?? null,
        tags: dto.tags ?? [],
        nextFollowUpAt: dto.nextFollowup ? new Date(dto.nextFollowup) : null,
        statusId,
        branchId: links.branchId,
        assignedToId: links.assignedToId,
        primaryInterestCountryId: links.countryId,
      },
      include: this.relations,
      })

      await this.activity.recordWithActorId(
        { action: 'lead.created', entity: 'lead', entityId: created.id, meta: { name: dto.name } },
        actorId,
        tx,
      )
      return created
    })
    return this.toDto(lead as LeadWithRelations)
  }

  async update(id: number, dto: UpdateLeadDto, actorPublicId?: string) {
    await this.get(id) // 404s if missing or already deleted
    const links = await this.resolveLinks(dto)

    const actorId = await this.resolveActorId(actorPublicId)

    const lead = await this.db.$transaction(async (tx) => {
      const changed = await tx.lead.update({
      where: { id: BigInt(id) },
      data: {
        // `undefined` tells Prisma to leave a column alone, so a PATCH only
        // touches the fields actually sent.
        name: dto.name ?? undefined,
        email: dto.email ?? undefined,
        phone: dto.phone ?? undefined,
        phoneNote: dto.phoneNote ?? undefined,
        whatsapp: dto.whatsapp ?? undefined,
        gender: dto.gender ?? undefined,
        source: dto.source ?? undefined,
        studyLevel: dto.studyLevel ?? undefined,
        qualification: dto.qualification ?? undefined,
        tags: dto.tags ?? undefined,
        nextFollowUpAt: dto.nextFollowup ? new Date(dto.nextFollowup) : undefined,
        statusId: links.statusId ?? undefined,
        branchId: links.branchId ?? undefined,
        assignedToId: dto.assignedTo === '' ? null : (links.assignedToId ?? undefined),
        primaryInterestCountryId: links.countryId ?? undefined,
      },
      include: this.relations,
      })

      await this.activity.recordWithActorId(
        {
          action: 'lead.updated',
          entity: 'lead',
          entityId: BigInt(id),
          // Field names only — the values can hold personal data, and an audit
          // trail should not become a second copy of the record.
          meta: { fields: Object.keys(dto) },
        },
        actorId,
        tx,
      )
      return changed
    })
    return this.toDto(lead as LeadWithRelations)
  }

  /** Soft delete: the row stays for audit, every query filters `deletedAt: null`. */
  async remove(id: number, actorPublicId?: string) {
    await this.get(id)
    const actorId = await this.resolveActorId(actorPublicId)

    await this.db.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id: BigInt(id) },
        data: { deletedAt: new Date() },
      })
      await this.activity.recordWithActorId(
        { action: 'lead.deleted', entity: 'lead', entityId: BigInt(id) },
        actorId,
        tx,
      )
    })
    return { ok: true }
  }

  /** JWT subject (users.publicId) -> numeric id, or null for system actions. */
  private async resolveActorId(publicId?: string): Promise<bigint | null> {
    if (!publicId) return null
    const user = await this.db.user.findFirst({
      where: { publicId, tenantId: TENANT_ID },
      select: { id: true },
    })
    return user?.id ?? null
  }

  private readonly relations = {
    status: true,
    branch: true,
    assignedTo: true,
    primaryInterestCountry: true,
  } as const

  /** Translate the UI's human labels into foreign keys. */
  private async resolveLinks(dto: CreateLeadDto | UpdateLeadDto) {
    const [status, branch, user, country] = await Promise.all([
      dto.status
        ? this.db.leadStatus.findFirst({ where: { tenantId: TENANT_ID, label: dto.status } })
        : null,
      dto.branch
        ? this.db.branch.findFirst({ where: { tenantId: TENANT_ID, name: dto.branch } })
        : null,
      dto.assignedTo
        ? this.db.user.findFirst({ where: { tenantId: TENANT_ID, name: dto.assignedTo } })
        : null,
      dto.countryInterested
        ? this.db.country.findFirst({ where: { name: dto.countryInterested } })
        : null,
    ])
    return {
      statusId: status?.id ?? null,
      branchId: branch?.id ?? null,
      assignedToId: user?.id ?? null,
      countryId: country?.id ?? null,
    }
  }

  private async defaultStatusId() {
    const first = await this.db.leadStatus.findFirst({
      where: { tenantId: TENANT_ID },
      orderBy: { sortOrder: 'asc' },
    })
    if (!first) throw new NotFoundException('No lead statuses are configured.')
    return first.id
  }

  /**
   * Rebuild the flat shape `src/mock/leads.ts` exposed, so the existing UI
   * renders unchanged after the swap.
   *
   * Three fields are computed rather than stored:
   *   leadAgeDays  — derived from createdAt
   *   statusColor  — joined from lead_statuses (the column was dropped as a
   *                  denormalised copy)
   *   assignedTo / branch — joined names, since the DB holds ids
   */
  private toDto(lead: LeadWithRelations) {
    const created = lead.createdAt
    const ageMs = Date.now() - created.getTime()

    return {
      id: Number(lead.id),
      publicId: lead.publicId,
      name: lead.name,
      email: lead.email ?? '',
      emailDate: fmtShort(created),
      phone: lead.phone ?? '',
      phoneNote: lead.phoneNote ?? '',
      whatsapp: lead.whatsapp,
      leadAgeDays: Math.max(0, Math.floor(ageMs / 86_400_000)),
      branch: lead.branch?.name ?? '',
      status: lead.status.label,
      statusColor: lead.status.color,
      assignedTo: lead.assignedTo?.name ?? null,
      created: fmtLong(created),
      nextFollowup: lead.nextFollowUpAt ? fmtLong(lead.nextFollowUpAt) : null,
      countryInterested: lead.primaryInterestCountry?.name ?? '',
      tags: lead.tags,
      gender: lead.gender ?? undefined,
      studyLevel: lead.studyLevel ?? undefined,
      qualification: lead.qualification ?? undefined,
      source: lead.source ?? undefined,
      convertedStudentId: lead.convertedStudentId ? Number(lead.convertedStudentId) : null,
    }
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "18 Jul" — matches Lead.emailDate in the mock. */
const fmtShort = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`

/** "19 Jul 2026" — matches Lead.created / nextFollowup in the mock. */
const fmtLong = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
