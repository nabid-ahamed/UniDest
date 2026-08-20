import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ActivityService } from '../activity/activity.service'
import type {
  ConvertLeadDto,
  CreateStudentDto,
  ListStudentsDto,
  UpdateStudentDto,
} from './dto/student.dto'

const TENANT_ID = 1n

type StudentWithRelations = {
  id: bigint
  publicId: string
  studentNo: string
  name: string
  email: string | null
  phone: string | null
  phoneNote: string | null
  gender: string | null
  source: string | null
  studyLevel: string | null
  course: string | null
  intake: string | null
  university: string | null
  avatarUrl: string | null
  leadId: bigint | null
  archivedAt: Date | null
  deletedAt: Date | null
  createdAt: Date
  status: { label: string; color: string }
  branch: { name: string } | null
  assignedTo: { name: string } | null
  residenceCountry: { name: string } | null
  interestCountry: { name: string } | null
  _count?: { applications: number }
}

@Injectable()
export class StudentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ActivityService) private readonly activity: ActivityService,
  ) {}

  private get db() {
    return this.prisma.client
  }

  async list(query: ListStudentsDto) {
    // Coerced here rather than via @Type(() => Number): tsx/esbuild does not
    // emit decorator metadata, so query params arrive as strings.
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 50))

    const where: Record<string, unknown> = { tenantId: TENANT_ID }

    // The UI has three tabs; each is a different slice of the same table.
    if (query.view === 'deleted') where.deletedAt = { not: null }
    else if (query.view === 'archived') {
      where.deletedAt = null
      where.archivedAt = { not: null }
    } else {
      where.deletedAt = null
      where.archivedAt = null
    }

    if (query.status) where.status = { label: query.status }
    if (query.branch) where.branch = { name: query.branch }
    if (query.assignedTo) where.assignedTo = { name: query.assignedTo }
    if (query.search?.trim()) {
      const q = query.search.trim()
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { studentNo: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [rows, total] = await Promise.all([
      this.db.student.findMany({
        where,
        include: this.relations,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.student.count({ where }),
    ])

    return { data: rows.map((r) => this.toDto(r as StudentWithRelations)), total, page, limit }
  }

  async get(id: number) {
    const student = await this.db.student.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID },
      include: this.relations,
    })
    if (!student) throw new NotFoundException(`Student ${id} not found.`)
    return this.toDto(student as StudentWithRelations)
  }

  async create(dto: CreateStudentDto) {
    const links = await this.resolveLinks(dto)
    const statusId = links.statusId ?? (await this.defaultStatusId())

    const created = await this.db.student.create({
      data: {
        tenantId: TENANT_ID,
        // studentNo needs the generated id, so insert a placeholder and patch
        // it below. Unique-constrained, hence the email suffix.
        studentNo: `PENDING-${Date.now()}-${dto.email ?? dto.name}`,
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        phoneNote: dto.phoneNote ?? null,
        gender: dto.gender ?? null,
        source: dto.source ?? null,
        studyLevel: dto.studyLevel ?? null,
        course: dto.course ?? null,
        intake: dto.intake ?? null,
        university: dto.university ?? null,
        avatarUrl: dto.avatar ?? null,
        statusId,
        branchId: links.branchId,
        assignedToId: links.assignedToId,
        residenceCountryId: links.residenceId,
        interestCountryId: links.interestId,
      },
    })

    const student = await this.db.student.update({
      where: { id: created.id },
      data: { studentNo: `STU-${created.createdAt.getFullYear()}-${created.id}` },
      include: this.relations,
    })
    return this.toDto(student as StudentWithRelations)
  }

  async update(id: number, dto: UpdateStudentDto) {
    await this.get(id)
    const links = await this.resolveLinks(dto)

    // `state` drives the archive/trash lifecycle rather than being a column.
    const lifecycle: Record<string, unknown> = {}
    if (dto.state === 'archived') lifecycle.archivedAt = new Date()
    else if (dto.state === 'deleted') lifecycle.deletedAt = new Date()
    else if (dto.state === 'active') {
      lifecycle.archivedAt = null
      lifecycle.deletedAt = null
    }

    const student = await this.db.student.update({
      where: { id: BigInt(id) },
      data: {
        name: dto.name ?? undefined,
        email: dto.email ?? undefined,
        phone: dto.phone ?? undefined,
        phoneNote: dto.phoneNote ?? undefined,
        gender: dto.gender ?? undefined,
        source: dto.source ?? undefined,
        studyLevel: dto.studyLevel ?? undefined,
        course: dto.course ?? undefined,
        intake: dto.intake ?? undefined,
        university: dto.university ?? undefined,
        avatarUrl: dto.avatar ?? undefined,
        statusId: links.statusId ?? undefined,
        branchId: links.branchId ?? undefined,
        assignedToId: dto.assignedTo === '' ? null : (links.assignedToId ?? undefined),
        residenceCountryId: links.residenceId ?? undefined,
        interestCountryId: links.interestId ?? undefined,
        ...lifecycle,
      },
      include: this.relations,
    })
    return this.toDto(student as StudentWithRelations)
  }

  /** Soft delete (trash). `purge` removes the row for good. */
  async remove(id: number) {
    await this.get(id)
    await this.db.student.update({
      where: { id: BigInt(id) },
      data: { deletedAt: new Date() },
    })
    return { ok: true }
  }

  async purge(ids: number[]) {
    await this.db.student.deleteMany({
      where: { id: { in: ids.map((i) => BigInt(i)) }, tenantId: TENANT_ID },
    })
    return { ok: true, purged: ids.length }
  }

  /**
   * Convert a lead into a student.
   *
   * Both rows survive and point at each other (lead.convertedStudentId,
   * student.leadId). The mock frontend deleted the lead here, which destroyed
   * funnel lineage and made conversion-rate reporting impossible — see spec
   * §5.4. Wrapped in a transaction so a failure cannot leave a half-converted
   * pair behind.
   */
  async convertLead(leadId: number, dto: ConvertLeadDto, actorPublicId?: string) {
    const lead = await this.db.lead.findFirst({
      where: { id: BigInt(leadId), tenantId: TENANT_ID, deletedAt: null },
      include: { branch: true, assignedTo: true, primaryInterestCountry: true },
    })
    if (!lead) throw new NotFoundException(`Lead ${leadId} not found.`)
    if (lead.convertedStudentId) {
      throw new NotFoundException(`Lead ${leadId} has already been converted.`)
    }

    const [activeStatus, wonLeadStatus] = await Promise.all([
      this.db.studentStatus.findFirst({
        where: { tenantId: TENANT_ID, key: 'active' },
      }),
      this.db.leadStatus.findFirst({ where: { tenantId: TENANT_ID, isWon: true } }),
    ])

    const assignedToId = dto.assignedTo
      ? ((await this.db.user.findFirst({ where: { tenantId: TENANT_ID, name: dto.assignedTo } }))?.id ?? null)
      : lead.assignedToId

    return this.db.$transaction(async (tx) => {
      const created = await tx.student.create({
        data: {
          tenantId: TENANT_ID,
          studentNo: `PENDING-${Date.now()}-${leadId}`,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          phoneNote: lead.phoneNote,
          gender: lead.gender,
          source: 'Lead Convert',
          studyLevel: lead.studyLevel,
          course: dto.course ?? null,
          intake: dto.intake ?? null,
          university: dto.university ?? null,
          statusId: activeStatus?.id ?? (await this.defaultStatusId()),
          branchId: lead.branchId,
          assignedToId,
          interestCountryId: lead.primaryInterestCountryId,
          leadId: lead.id,
        },
      })

      const student = await tx.student.update({
        where: { id: created.id },
        data: { studentNo: `STU-${created.createdAt.getFullYear()}-${created.id}` },
        include: this.relations,
      })

      // The lead is KEPT — only linked and moved to the won status.
      await tx.lead.update({
        where: { id: lead.id },
        data: {
          convertedStudentId: created.id,
          statusId: wonLeadStatus?.id ?? lead.statusId,
        },
      })

      // Logged against both ends of the conversion: the funnel question
      // ("what became of this lead?") and the provenance question ("where did
      // this student come from?") are asked from opposite directions.
      const actorId = await this.resolveActorId(actorPublicId)
      await this.activity.recordWithActorId(
        {
          action: 'lead.converted',
          entity: 'lead',
          entityId: lead.id,
          meta: { studentId: Number(created.id), studentNo: student.studentNo },
        },
        actorId,
        tx,
      )
      await this.activity.recordWithActorId(
        {
          action: 'student.created',
          entity: 'student',
          entityId: created.id,
          meta: { from: 'lead_convert', leadId: Number(lead.id) },
        },
        actorId,
        tx,
      )

      return this.toDto(student as StudentWithRelations)
    })
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
    residenceCountry: true,
    interestCountry: true,
    // Counted rather than stored: the mock kept a denormalised `applications`
    // integer that drifted out of sync with the actual rows.
    _count: { select: { applications: { where: { deletedAt: null } } } },
  } as const

  private async resolveLinks(dto: CreateStudentDto | UpdateStudentDto) {
    const [status, branch, user, residence, interest] = await Promise.all([
      dto.status
        ? this.db.studentStatus.findFirst({ where: { tenantId: TENANT_ID, label: dto.status } })
        : null,
      dto.branch ? this.db.branch.findFirst({ where: { tenantId: TENANT_ID, name: dto.branch } }) : null,
      dto.assignedTo
        ? this.db.user.findFirst({ where: { tenantId: TENANT_ID, name: dto.assignedTo } })
        : null,
      dto.countryOfResidence
        ? this.db.country.findFirst({ where: { name: dto.countryOfResidence } })
        : null,
      dto.countryInterested
        ? this.db.country.findFirst({ where: { name: dto.countryInterested } })
        : null,
    ])
    return {
      statusId: status?.id ?? null,
      branchId: branch?.id ?? null,
      assignedToId: user?.id ?? null,
      residenceId: residence?.id ?? null,
      interestId: interest?.id ?? null,
    }
  }

  private async defaultStatusId() {
    const first = await this.db.studentStatus.findFirst({
      where: { tenantId: TENANT_ID },
      orderBy: { sortOrder: 'asc' },
    })
    if (!first) throw new NotFoundException('No student statuses are configured.')
    return first.id
  }

  /** Rebuild the flat shape src/mock/students.ts exposed, so the UI is unchanged. */
  private toDto(st: StudentWithRelations) {
    return {
      id: Number(st.id),
      publicId: st.publicId,
      studentNo: st.studentNo,
      name: st.name,
      email: st.email ?? '',
      emailDate: fmtShort(st.createdAt),
      phone: st.phone ?? '',
      phoneNote: st.phoneNote ?? '',
      branch: st.branch?.name ?? '',
      status: st.status.label,
      statusColor: st.status.color,
      assignedTo: st.assignedTo?.name ?? null,
      created: fmtLong(st.createdAt),
      countryOfResidence: st.residenceCountry?.name ?? '',
      countryInterested: st.interestCountry?.name ?? '',
      studyLevel: st.studyLevel ?? '',
      course: st.course ?? '',
      intake: st.intake ?? '',
      university: st.university,
      applications: st._count?.applications ?? 0,
      source: st.source ?? '',
      avatar: st.avatarUrl ?? undefined,
      state: st.deletedAt ? 'deleted' : st.archivedAt ? 'archived' : 'active',
      leadId: st.leadId ? Number(st.leadId) : null,
    }
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmtShort = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`
const fmtLong = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
