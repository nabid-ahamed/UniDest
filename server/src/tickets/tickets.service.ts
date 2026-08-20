import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ActivityService } from '../activity/activity.service'
import type { CreateTicketDto, ListTicketsDto, ReplyTicketDto, UpdateTicketDto } from './dto/ticket.dto'

const TENANT_ID = 1n

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "24 Jul 2026" — the format the ticket list renders. */
function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** "28 Jul 2026 · 2:14 PM" — the format a message header renders. */
function fmtDateTime(d: Date): string {
  const h24 = d.getHours()
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${fmtDate(d)} · ${h12}:${mins} ${h24 < 12 ? 'AM' : 'PM'}`
}

type TicketRow = {
  id: bigint
  publicId: string
  subject: string
  category: string
  priority: string
  createdAt: Date
  updatedAt: Date
  student: { id: bigint; name: string; studentNo: string } | null
  lead: { id: bigint; name: string } | null
  branch: { name: string } | null
  assignedTo: { name: string } | null
  status: { label: string; color: string }
  messages?: Array<{
    id: bigint
    authorName: string
    fromStaff: boolean
    body: string
    createdAt: Date
  }>
}

@Injectable()
export class TicketsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ActivityService) private readonly activity: ActivityService,
  ) {}

  private get db() {
    return this.prisma.client
  }

  async list(query: ListTicketsDto) {
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 50))

    const where: Record<string, unknown> = { tenantId: TENANT_ID, deletedAt: null }
    if (query.status) where.status = { label: query.status }
    if (query.priority) where.priority = query.priority
    if (query.category) where.category = query.category
    if (query.branch) where.branch = { name: query.branch }
    if (query.assignedTo) where.assignedTo = { name: query.assignedTo }
    if (query.search?.trim()) {
      const q = query.search.trim()
      where.OR = [
        { subject: { contains: q, mode: 'insensitive' } },
        { student: { name: { contains: q, mode: 'insensitive' } } },
        { lead: { name: { contains: q, mode: 'insensitive' } } },
      ]
    }

    const [rows, total] = await Promise.all([
      this.db.ticket.findMany({
        where,
        include: this.relations,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.ticket.count({ where }),
    ])

    return { data: rows.map((r) => this.toDto(r as TicketRow)), total, page, limit }
  }

  async get(id: number) {
    const ticket = await this.db.ticket.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      include: { ...this.relations, messages: { orderBy: { createdAt: 'asc' } } },
    })
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found.`)
    return this.toDto(ticket as TicketRow)
  }

  async create(dto: CreateTicketDto, actorPublicId?: string) {
    // Exactly one requester. Both would make "who raised this?" ambiguous;
    // neither would leave a ticket nobody can be replied to.
    const hasStudent = Boolean(dto.studentNo)
    const hasLead = Boolean(dto.leadId)
    if (hasStudent === hasLead) {
      throw new BadRequestException('A ticket needs exactly one requester: studentNo or leadId.')
    }

    const student = dto.studentNo
      ? await this.db.student.findFirst({
          where: { tenantId: TENANT_ID, studentNo: dto.studentNo, deletedAt: null },
        })
      : null
    if (dto.studentNo && !student) throw new NotFoundException(`Student ${dto.studentNo} not found.`)

    const lead = dto.leadId
      ? await this.db.lead.findFirst({
          where: { tenantId: TENANT_ID, id: BigInt(dto.leadId), deletedAt: null },
        })
      : null
    if (dto.leadId && !lead) throw new NotFoundException(`Lead ${dto.leadId} not found.`)

    const statusId = await this.statusId(dto.status)
    const assignedToId = dto.assignedTo ? await this.userIdByName(dto.assignedTo) : null
    const actorId = await this.resolveActorId(actorPublicId)

    const ticket = await this.db.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          tenantId: TENANT_ID,
          subject: dto.subject,
          category: dto.category ?? 'Other',
          studentId: student?.id ?? null,
          leadId: lead?.id ?? null,
          branchId: student?.branchId ?? lead?.branchId ?? null,
          assignedToId,
          statusId,
          priority: dto.priority ?? 'Medium',
        },
        include: { ...this.relations, messages: true },
      })

      if (dto.body?.trim()) {
        await tx.ticketMessage.create({
          data: {
            tenantId: TENANT_ID,
            ticketId: created.id,
            authorName: student?.name ?? lead?.name ?? 'Requester',
            fromStaff: false,
            body: dto.body.trim(),
          },
        })
      }

      await this.activity.recordWithActorId(
        {
          action: 'ticket.created',
          entity: 'ticket',
          entityId: created.id,
          meta: { subject: dto.subject, category: created.category },
        },
        actorId,
        tx,
      )
      return created
    })

    return this.get(Number(ticket.id))
  }

  async update(id: number, dto: UpdateTicketDto, actorPublicId?: string) {
    const current = await this.db.ticket.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      include: { status: true },
    })
    if (!current) throw new NotFoundException(`Ticket ${id} not found.`)

    const statusId = dto.status ? await this.statusId(dto.status) : undefined
    const assignedToId =
      dto.assignedTo === '' ? null : dto.assignedTo ? await this.userIdByName(dto.assignedTo) : undefined
    const actorId = await this.resolveActorId(actorPublicId)
    const statusChanged = statusId != null && statusId !== current.statusId

    await this.db.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: BigInt(id) },
        data: {
          subject: dto.subject ?? undefined,
          category: dto.category ?? undefined,
          priority: dto.priority ?? undefined,
          statusId: statusId ?? undefined,
          assignedToId,
        },
      })
      await this.activity.recordWithActorId(
        {
          action: statusChanged ? 'ticket.status_changed' : 'ticket.updated',
          entity: 'ticket',
          entityId: BigInt(id),
          meta: statusChanged
            ? { from: current.status.label, to: dto.status }
            : { fields: Object.keys(dto) },
        },
        actorId,
        tx,
      )
    })

    return this.get(id)
  }

  /** Add a message to the thread. */
  async reply(id: number, dto: ReplyTicketDto, actorPublicId?: string) {
    const ticket = await this.db.ticket.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      include: { student: true, lead: true },
    })
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found.`)
    if (!dto.body?.trim()) throw new BadRequestException('A reply needs a body.')

    const actorId = await this.resolveActorId(actorPublicId)
    const actor = actorId
      ? await this.db.user.findFirst({ where: { id: actorId }, select: { name: true } })
      : null

    await this.db.$transaction(async (tx) => {
      await tx.ticketMessage.create({
        data: {
          tenantId: TENANT_ID,
          ticketId: BigInt(id),
          authorId: actorId,
          authorName: actor?.name ?? ticket.student?.name ?? ticket.lead?.name ?? 'Requester',
          fromStaff: Boolean(actorId),
          body: dto.body.trim(),
        },
      })
      // Touch the ticket so it sorts to the top of the "recently updated" list.
      await tx.ticket.update({ where: { id: BigInt(id) }, data: { updatedAt: new Date() } })
      await this.activity.recordWithActorId(
        { action: 'ticket.replied', entity: 'ticket', entityId: BigInt(id) },
        actorId,
        tx,
      )
    })

    return this.get(id)
  }

  async remove(id: number, actorPublicId?: string) {
    await this.get(id)
    const actorId = await this.resolveActorId(actorPublicId)
    await this.db.$transaction(async (tx) => {
      await tx.ticket.update({ where: { id: BigInt(id) }, data: { deletedAt: new Date() } })
      await this.activity.recordWithActorId(
        { action: 'ticket.deleted', entity: 'ticket', entityId: BigInt(id) },
        actorId,
        tx,
      )
    })
    return { ok: true }
  }

  /** Status lookup rows, for the filter dropdowns. */
  async statuses() {
    const rows = await this.db.ticketStatus.findMany({
      where: { tenantId: TENANT_ID, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    })
    return rows.map((s) => ({ label: s.label, color: s.color, isOpen: s.isOpen }))
  }

  /**
   * Counts per status, for the dashboard cards.
   *
   * Grouped in the database rather than by loading tickets and counting in JS —
   * the difference does not matter at five rows and matters a great deal later.
   */
  async statusCounts(branchId?: bigint | null) {
    const [grouped, statuses] = await Promise.all([
      this.db.ticket.groupBy({
        by: ['statusId'],
        where: {
          tenantId: TENANT_ID,
          deletedAt: null,
          ...(branchId ? { branchId } : {}),
        },
        _count: { _all: true },
      }),
      this.db.ticketStatus.findMany({
        where: { tenantId: TENANT_ID, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      }),
    ])
    const counts = new Map(grouped.map((g) => [g.statusId.toString(), g._count._all]))
    return statuses.map((s) => ({
      label: s.label,
      value: counts.get(s.id.toString()) ?? 0,
      isOpen: s.isOpen,
    }))
  }

  /** Counts per priority, for the dashboard's "By Priority" breakdown. */
  async priorityCounts(branchId?: bigint | null) {
    const grouped = await this.db.ticket.groupBy({
      by: ['priority'],
      where: {
        tenantId: TENANT_ID,
        deletedAt: null,
        ...(branchId ? { branchId } : {}),
      },
      _count: { _all: true },
    })
    const tone: Record<string, string> = { High: 'danger', Medium: 'pending', Low: 'success' }
    const found = new Map(grouped.map((g) => [g.priority, g._count._all]))
    // Every priority appears, including empty ones — a zero is information, and
    // omitting it makes the breakdown jump around as counts change.
    return ['High', 'Medium', 'Low'].map((label) => ({
      label,
      count: found.get(label) ?? 0,
      tone: tone[label] ?? 'neutral',
    }))
  }

  private readonly relations = {
    student: { select: { id: true, name: true, studentNo: true } },
    lead: { select: { id: true, name: true } },
    branch: true,
    assignedTo: true,
    status: true,
  } as const

  private async statusId(label?: string): Promise<bigint> {
    if (label) {
      const found = await this.db.ticketStatus.findFirst({
        where: { tenantId: TENANT_ID, label, deletedAt: null },
      })
      if (found) return found.id
    }
    const first = await this.db.ticketStatus.findFirst({
      where: { tenantId: TENANT_ID, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    })
    if (!first) throw new NotFoundException('No ticket statuses are configured.')
    return first.id
  }

  private async userIdByName(name: string): Promise<bigint | null> {
    const user = await this.db.user.findFirst({
      where: { tenantId: TENANT_ID, name, deletedAt: null },
      select: { id: true },
    })
    return user?.id ?? null
  }

  private async resolveActorId(publicId?: string): Promise<bigint | null> {
    if (!publicId) return null
    const user = await this.db.user.findFirst({
      where: { publicId, tenantId: TENANT_ID },
      select: { id: true },
    })
    return user?.id ?? null
  }

  /** Rebuild the flat shape src/mock/supportTickets.ts exposed. */
  private toDto(t: TicketRow) {
    return {
      id: Number(t.id),
      publicId: t.publicId,
      subject: t.subject,
      category: t.category,
      requester: t.student?.name ?? t.lead?.name ?? 'Unknown',
      requesterKind: t.student ? 'Student' : 'Lead',
      // The mock invented "LEAD-2026-0442" strings; leads have no such business
      // key, so their id is rendered in the same shape rather than fabricating one.
      requesterNo: t.student?.studentNo ?? (t.lead ? `LEAD-${Number(t.lead.id)}` : ''),
      branch: t.branch?.name ?? '',
      status: t.status.label,
      statusColor: t.status.color,
      priority: t.priority,
      assignedTo: t.assignedTo?.name ?? null,
      created: fmtDate(t.createdAt),
      updated: fmtDate(t.updatedAt),
      messages: (t.messages ?? []).map((m) => ({
        id: Number(m.id),
        author: m.authorName,
        fromStaff: m.fromStaff,
        at: fmtDateTime(m.createdAt),
        body: m.body,
      })),
    }
  }
}
