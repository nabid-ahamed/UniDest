import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ActivityService } from '../activity/activity.service'
import type {
  CreateApplicationDto,
  ListApplicationsDto,
  UpdateApplicationDto,
} from './dto/application.dto'

const TENANT_ID = 1n

type ApplicationWithRelations = {
  id: bigint
  publicId: string
  appliedThrough: string
  agentName: string | null
  agent: { name: string } | null
  priority: string
  submittedAt: Date | null
  decisionAt: Date | null
  createdAt: Date
  status: { label: string; color: string }
  student: { name: string; studentNo: string; id: bigint }
  course:
    | { title: string; university: { name: string; country: { name: string } } }
    | null
  intake: { month: number; year: number | null } | null
  branch: { name: string } | null
  assignedTo: { name: string } | null
}

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

@Injectable()
export class ApplicationsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ActivityService) private readonly activity: ActivityService,
  ) {}

  private get db() {
    return this.prisma.client
  }

  async list(query: ListApplicationsDto) {
    // Coerced here rather than via @Type(() => Number): esbuild does not emit
    // decorator metadata, so query params arrive as strings.
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 50))

    const where: Record<string, unknown> = { tenantId: TENANT_ID, deletedAt: null }
    if (query.agentId) where.agentId = BigInt(query.agentId)
    if (query.status) where.status = { label: query.status }
    if (query.branch) where.branch = { name: query.branch }
    if (query.assignedTo) where.assignedTo = { name: query.assignedTo }
    if (query.studentId) where.studentId = BigInt(query.studentId)
    if (query.search?.trim()) {
      const q = query.search.trim()
      where.OR = [
        { student: { name: { contains: q, mode: 'insensitive' } } },
        { student: { studentNo: { contains: q, mode: 'insensitive' } } },
        { course: { title: { contains: q, mode: 'insensitive' } } },
      ]
    }

    const [rows, total] = await Promise.all([
      this.db.application.findMany({
        where,
        include: this.relations,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.application.count({ where }),
    ])

    return {
      data: rows.map((r) => this.toDto(r as ApplicationWithRelations)),
      total,
      page,
      limit,
    }
  }

  async get(id: number) {
    const app = await this.db.application.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      include: this.relations,
    })
    if (!app) throw new NotFoundException(`Application ${id} not found.`)
    return this.toDto(app as ApplicationWithRelations)
  }

  /** Timeline for the detail page, newest first. */
  async history(id: number) {
    await this.get(id)
    const rows = await this.db.applicationStatusHistory.findMany({
      where: { applicationId: BigInt(id), tenantId: TENANT_ID },
      include: { fromStatus: true, toStatus: true, changedBy: true },
      orderBy: { changedAt: 'desc' },
    })
    return rows.map((h) => ({
      id: Number(h.id),
      from: h.fromStatus?.label ?? null,
      to: h.toStatus.label,
      toColor: h.toStatus.color,
      note: h.note ?? '',
      changedBy: h.changedBy?.name ?? 'System',
      changedAt: h.changedAt.toISOString(),
    }))
  }

  /**
   * Create an application. This is genuinely new functionality — the mock had
   * no id generator, so applications could only be read, never created.
   */
  async create(dto: CreateApplicationDto, userPublicId?: string, agentId?: bigint) {
    const links = await this.resolveLinks(dto)
    if (!links.studentId) throw new NotFoundException('Student not found.')

    const statusId = links.statusId ?? (await this.defaultStatusId())
    const changedById = await this.resolveUserId(userPublicId)

    return this.db.$transaction(async (tx) => {
      const created = await tx.application.create({
        data: {
          tenantId: TENANT_ID,
          studentId: links.studentId!,
          courseId: links.courseId,
          intakeId: links.intakeId,
          statusId,
          branchId: links.branchId,
          assignedToId: links.assignedToId,
          appliedThrough: dto.appliedThrough ?? 'DIRECT',
          agentName: dto.agent ?? null,
          agentId: agentId ?? (await this.resolveAgentId(dto.agent)),
          priority: dto.priority ?? 'normal',
        },
        include: this.relations,
      })

      await tx.applicationStatusHistory.create({
        data: {
          tenantId: TENANT_ID,
          applicationId: created.id,
          toStatusId: statusId,
          note: 'Application created',
          changedById,
        },
      })

      await this.activity.recordWithActorId(
        {
          action: 'application.created',
          entity: 'application',
          entityId: created.id,
          meta: { studentNo: dto.studentNo },
        },
        changedById,
        tx,
      )

      return this.toDto(created as ApplicationWithRelations)
    })
  }

  /**
   * Update an application. A status change writes a history row inside the same
   * transaction, so the timeline can never drift from the current status.
   */
  async update(id: number, dto: UpdateApplicationDto, userPublicId?: string) {
    const current = await this.db.application.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
    })
    if (!current) throw new NotFoundException(`Application ${id} not found.`)

    const links = await this.resolveLinks(dto)
    const statusChanged = links.statusId != null && links.statusId !== current.statusId
    const changedById = await this.resolveUserId(userPublicId)

    return this.db.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id: BigInt(id) },
        data: {
          statusId: links.statusId ?? undefined,
          courseId: links.courseId ?? undefined,
          intakeId: links.intakeId ?? undefined,
          branchId: links.branchId ?? undefined,
          assignedToId: dto.assignedTo === '' ? null : (links.assignedToId ?? undefined),
          appliedThrough: dto.appliedThrough ?? undefined,
          agentName: dto.agent ?? undefined,
          agentId: dto.agent !== undefined ? await this.resolveAgentId(dto.agent) : undefined,
          priority: dto.priority ?? undefined,
        },
        include: this.relations,
      })

      if (statusChanged) {
        await tx.applicationStatusHistory.create({
          data: {
            tenantId: TENANT_ID,
            applicationId: BigInt(id),
            fromStatusId: current.statusId,
            toStatusId: links.statusId!,
            note: dto.note ?? null,
            changedById,
          },
        })
      }

      await this.activity.recordWithActorId(
        {
          action: statusChanged ? 'application.status_changed' : 'application.updated',
          entity: 'application',
          entityId: BigInt(id),
          meta: statusChanged ? { note: dto.note ?? null } : { fields: Object.keys(dto) },
        },
        changedById,
        tx,
      )

      return this.toDto(updated as ApplicationWithRelations)
    })
  }

  async remove(id: number) {
    await this.get(id)
    await this.db.application.update({
      where: { id: BigInt(id) },
      data: { deletedAt: new Date() },
    })
    return { ok: true }
  }

  /**
   * Agent name -> id, creating the agent if it is new.
   *
   * The UI still submits a name, so an unknown one is registered rather than
   * silently dropped — that is how the free-text column filled up in the first
   * place, and losing the association again would defeat the migration.
   */
  private async resolveAgentId(name?: string | null): Promise<bigint | null> {
    const trimmed = name?.trim()
    if (!trimmed) return null
    const existing = await this.db.agent.findFirst({
      where: { tenantId: TENANT_ID, name: trimmed },
      select: { id: true },
    })
    if (existing) return existing.id
    const created = await this.db.agent.create({
      data: { tenantId: TENANT_ID, name: trimmed, branchId: 1n },
      select: { id: true },
    })
    return created.id
  }

  private readonly relations = {
    status: true,
    student: true,
    branch: true,
    assignedTo: true,
    intake: true,
    agent: true,
    course: { include: { university: { include: { country: true } } } },
  } as const

  private async resolveLinks(dto: CreateApplicationDto | UpdateApplicationDto) {
    const [status, branch, user, student, course] = await Promise.all([
      dto.status
        ? this.db.applicationStatus.findFirst({ where: { tenantId: TENANT_ID, label: dto.status } })
        : null,
      dto.branch ? this.db.branch.findFirst({ where: { tenantId: TENANT_ID, name: dto.branch } }) : null,
      dto.assignedTo
        ? this.db.user.findFirst({ where: { tenantId: TENANT_ID, name: dto.assignedTo } })
        : null,
      'studentNo' in dto && dto.studentNo
        ? this.db.student.findFirst({ where: { tenantId: TENANT_ID, studentNo: dto.studentNo } })
        : null,
      dto.course
        ? this.db.course.findFirst({ where: { title: dto.course, deletedAt: null } })
        : null,
    ])

    // The UI sends an intake as "May 2026"; the schema stores (month, year).
    let intakeId: bigint | null = null
    if (dto.intake && course) {
      const [monthName, yearStr] = dto.intake.trim().split(/\s+/)
      const month = MONTHS.indexOf(monthName)
      if (month > 0) {
        const found = await this.db.intake.findFirst({
          where: {
            courseId: course.id,
            month,
            ...(yearStr ? { year: Number(yearStr) } : {}),
          },
        })
        intakeId = found?.id ?? null
      }
    }

    return {
      statusId: status?.id ?? null,
      branchId: branch?.id ?? null,
      assignedToId: user?.id ?? null,
      studentId: student?.id ?? null,
      courseId: course?.id ?? null,
      intakeId,
    }
  }

  /**
   * The JWT carries the user's publicId (UUID), never the sequential id, so the
   * numeric FK has to be looked up before it can be written to the history row.
   */
  private async resolveUserId(publicId?: string) {
    if (!publicId) return null
    const user = await this.db.user.findFirst({ where: { publicId }, select: { id: true } })
    return user?.id ?? null
  }

  private async defaultStatusId() {
    const first = await this.db.applicationStatus.findFirst({
      where: { tenantId: TENANT_ID },
      orderBy: { sortOrder: 'asc' },
    })
    if (!first) throw new NotFoundException('No application statuses are configured.')
    return first.id
  }

  /** Rebuild the flat shape src/mock/applications.ts exposed. */
  private toDto(a: ApplicationWithRelations) {
    const d = a.createdAt
    return {
      id: Number(a.id),
      publicId: a.publicId,
      dateCreated: `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`,
      student: a.student.name,
      studentNo: a.student.studentNo,
      country: a.course?.university.country.name ?? '',
      university: a.course?.university.name ?? '',
      course: a.course?.title ?? '',
      intake: a.intake
        ? `${MONTHS[a.intake.month]}${a.intake.year ? ` ${a.intake.year}` : ''}`
        : '',
      // Prefer the joined agent; agentName is the legacy free-text column kept
      // only until the backfill has shipped everywhere.
      agent: a.agent?.name ?? a.agentName,
      appliedThrough: a.appliedThrough,
      status: a.status.label,
      statusColor: a.status.color,
      assignedTo: a.assignedTo?.name ?? null,
      branch: a.branch?.name ?? '',
      priority: a.priority,
    }
  }
}
