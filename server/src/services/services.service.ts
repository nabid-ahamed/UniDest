import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ActivityService } from '../activity/activity.service'
import type {
  CreateServiceDto,
  ListServicesDto,
  ReplyServiceDto,
  UpdateServiceDto,
} from './dto/service.dto'

const TENANT_ID = 1n

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "10-06-2026" — the format the services list renders. */
function fmtDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}-${month}-${d.getFullYear()}`
}

/** "28 Jul 2026 · 2:14 PM" — the format a message header renders. */
function fmtDateTime(d: Date): string {
  const h24 = d.getHours()
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  const mins = String(d.getMinutes()).padStart(2, '0')
  const day = `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  return `${day} · ${h12}:${mins} ${h24 < 12 ? 'AM' : 'PM'}`
}

type ServiceRow = {
  id: bigint
  publicId: string
  service: string
  country: string
  description: string
  notes: string
  createdAt: Date
  updatedAt: Date
  student: {
    id: bigint
    name: string
    studentNo: string
    email: string | null
    phone: string | null
    referredByAgentId: bigint | null
  }
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

const ROW_SELECT = {
  id: true,
  publicId: true,
  service: true,
  country: true,
  description: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  student: {
    select: {
      id: true,
      name: true,
      studentNo: true,
      email: true,
      phone: true,
      referredByAgentId: true,
    },
  },
  assignedTo: { select: { name: true } },
  status: { select: { label: true, color: true } },
} as const

@Injectable()
export class ServicesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ActivityService) private readonly activity: ActivityService,
  ) {}

  private get db() {
    return this.prisma.client
  }

  /**
   * List service requests.
   *
   * `studentId` / `agentId` are set by the controller from the caller's token,
   * never from the query string — a scoped caller cannot widen their own view
   * by passing a different value.
   */
  async list(query: ListServicesDto & { studentId?: bigint; agentId?: bigint }) {
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 50))

    const where: Record<string, unknown> = { tenantId: TENANT_ID, deletedAt: null }
    if (query.studentId) where.studentId = query.studentId
    // An agent sees requests raised for the students they referred.
    if (query.agentId) where.student = { referredByAgentId: query.agentId }
    if (query.status) where.status = { label: query.status }
    if (query.service) where.service = query.service
    if (query.country) where.country = query.country
    if (query.assignedTo) where.assignedTo = { name: query.assignedTo }
    if (query.studentNo && !query.studentId && !query.agentId) {
      where.student = { studentNo: query.studentNo }
    }

    const q = query.search?.trim()
    if (q) {
      where.OR = [
        { service: { contains: q, mode: 'insensitive' } },
        { country: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { student: { name: { contains: q, mode: 'insensitive' } } },
        { student: { email: { contains: q, mode: 'insensitive' } } },
      ]
    }

    const [rows, total] = await Promise.all([
      this.db.serviceRequest.findMany({
        where,
        select: ROW_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.serviceRequest.count({ where }),
    ])

    return { data: rows.map((r) => this.toDto(r as ServiceRow)), total, page, limit }
  }

  async get(id: number) {
    const row = await this.db.serviceRequest.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      select: {
        ...ROW_SELECT,
        messages: {
          select: {
            id: true,
            authorName: true,
            fromStaff: true,
            body: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    if (!row) throw new NotFoundException(`Service request ${id} not found.`)
    return this.toDto(row as ServiceRow)
  }

  /** The status vocabulary, in display order. */
  async statuses() {
    const rows = await this.db.serviceRequestStatus.findMany({
      where: { tenantId: TENANT_ID, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    })
    return rows.map((s) => ({ label: s.label, color: s.color, isClosed: s.isClosed }))
  }

  async create(dto: CreateServiceDto, actorPublicId?: string) {
    const student = await this.db.student.findFirst({
      where: { tenantId: TENANT_ID, studentNo: dto.studentNo, deletedAt: null },
      select: { id: true },
    })
    if (!student) throw new NotFoundException(`Student ${dto.studentNo} not found.`)

    const statusId = await this.statusIdFor(dto.status)
    const assignedToId = await this.userIdForName(dto.assignedTo)
    const actorId = await this.resolveActorId(actorPublicId)

    const created = await this.db.$transaction(async (tx) => {
      const row = await tx.serviceRequest.create({
        data: {
          tenantId: TENANT_ID,
          studentId: student.id,
          statusId,
          service: dto.service,
          country: dto.country ?? '',
          description: dto.description ?? '',
          notes: dto.notes ?? '',
          assignedToId,
        },
        select: { id: true },
      })

      await this.activity.recordWithActorId(
        {
          action: 'service.created',
          entity: 'service',
          entityId: row.id,
          meta: { service: dto.service, studentNo: dto.studentNo },
        },
        actorId,
        tx,
      )
      return row
    })

    return this.get(Number(created.id))
  }

  async update(id: number, dto: UpdateServiceDto, actorPublicId?: string) {
    const current = await this.db.serviceRequest.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      select: { id: true, statusId: true, status: { select: { label: true } } },
    })
    if (!current) throw new NotFoundException(`Service request ${id} not found.`)

    const data: Record<string, unknown> = {}
    if (dto.service !== undefined) data.service = dto.service
    if (dto.country !== undefined) data.country = dto.country
    if (dto.description !== undefined) data.description = dto.description
    if (dto.notes !== undefined) data.notes = dto.notes
    // '' clears the assignee; omitted leaves it alone.
    if (dto.assignedTo !== undefined) {
      data.assignedToId = dto.assignedTo ? await this.userIdForName(dto.assignedTo) : null
    }

    let statusId: bigint | null = null
    if (dto.status !== undefined) {
      statusId = await this.statusIdFor(dto.status)
      data.statusId = statusId
    }

    const actorId = await this.resolveActorId(actorPublicId)
    const statusChanged = statusId != null && statusId !== current.statusId

    await this.db.$transaction(async (tx) => {
      await tx.serviceRequest.update({ where: { id: current.id }, data })

      // A status move is the event people audit, so it is logged distinctly
      // from an ordinary field edit.
      await this.activity.recordWithActorId(
        {
          action: statusChanged ? 'service.status_changed' : 'service.updated',
          entity: 'service',
          entityId: current.id,
          // The previous status is part of what people audit — "changed to X"
          // alone does not say what it moved away from.
          meta: statusChanged
            ? { status: dto.status, previousStatus: current.status.label }
            : { fields: Object.keys(data) },
        },
        actorId,
        tx,
      )
    })

    return this.get(id)
  }

  async reply(id: number, dto: ReplyServiceDto, actorPublicId?: string, fromStaff = true) {
    const current = await this.db.serviceRequest.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      select: { id: true, student: { select: { name: true } } },
    })
    if (!current) throw new NotFoundException(`Service request ${id} not found.`)

    const actorId = await this.resolveActorId(actorPublicId)
    const author = actorId
      ? await this.db.user.findUnique({ where: { id: actorId }, select: { name: true } })
      : null

    await this.db.$transaction(async (tx) => {
      await tx.serviceRequestMessage.create({
        data: {
          tenantId: TENANT_ID,
          requestId: current.id,
          authorId: actorId,
          authorName: author?.name ?? current.student.name,
          fromStaff,
          body: dto.body.trim(),
        },
      })
      await this.activity.recordWithActorId(
        { action: 'service.replied', entity: 'service', entityId: current.id, meta: {} },
        actorId,
        tx,
      )
    })

    return this.get(id)
  }

  /** Soft delete, so the audit trail keeps pointing at a real row. */
  async remove(id: number, actorPublicId?: string) {
    const current = await this.db.serviceRequest.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      select: { id: true },
    })
    if (!current) throw new NotFoundException(`Service request ${id} not found.`)

    const actorId = await this.resolveActorId(actorPublicId)
    await this.db.$transaction(async (tx) => {
      await tx.serviceRequest.update({
        where: { id: current.id },
        data: { deletedAt: new Date() },
      })
      await this.activity.recordWithActorId(
        { action: 'service.deleted', entity: 'service', entityId: current.id, meta: {} },
        actorId,
        tx,
      )
    })
    return { ok: true }
  }

  /** The owning student's id — used to enforce portal ownership. */
  async studentIdFor(id: number): Promise<bigint> {
    const row = await this.db.serviceRequest.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      select: { studentId: true },
    })
    if (!row) throw new NotFoundException(`Service request ${id} not found.`)
    return row.studentId
  }

  /** The referring agent for the owning student, or null. */
  async agentIdFor(id: number): Promise<bigint | null> {
    const row = await this.db.serviceRequest.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      select: { student: { select: { referredByAgentId: true } } },
    })
    if (!row) throw new NotFoundException(`Service request ${id} not found.`)
    return row.student.referredByAgentId
  }

  private async statusIdFor(label?: string): Promise<bigint> {
    const rows = await this.db.serviceRequestStatus.findMany({
      where: { tenantId: TENANT_ID, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, label: true },
    })
    if (rows.length === 0) {
      throw new BadRequestException('No service statuses are configured.')
    }
    if (!label) return rows[0].id
    const match = rows.find((r) => r.label === label)
    if (!match) throw new BadRequestException(`Unknown service status "${label}".`)
    return match.id
  }

  private async userIdForName(name?: string): Promise<bigint | null> {
    if (!name) return null
    const user = await this.db.user.findFirst({
      where: { name, tenantId: TENANT_ID, deletedAt: null },
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

  /** Rebuild the flat shape src/mock/services.ts exposed. */
  private toDto(r: ServiceRow) {
    return {
      id: Number(r.id),
      publicId: r.publicId,
      dateCreated: fmtDate(r.createdAt),
      status: r.status.label,
      statusColor: r.status.color,
      studentId: Number(r.student.id),
      studentNo: r.student.studentNo,
      studentName: r.student.name,
      studentEmail: r.student.email ?? '',
      studentPhone: r.student.phone ?? '',
      service: r.service,
      country: r.country,
      description: r.description,
      notes: r.notes,
      assignedTo: r.assignedTo?.name ?? null,
      messages: (r.messages ?? []).map((m) => ({
        id: Number(m.id),
        text: m.body,
        by: m.authorName,
        fromStaff: m.fromStaff,
        at: fmtDateTime(m.createdAt),
      })),
    }
  }
}
