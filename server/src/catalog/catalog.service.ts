import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

/** Query params accepted by GET /courses — mirrors the Course Finder filters. */
export interface CourseFilters {
  search?: string
  country?: string
  university?: string
  studyLevel?: string
  studyArea?: string
  /** Show only courses a student with this IELTS score qualifies for. */
  maxIelts?: string
  page?: string
  limit?: string
}

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

@Injectable()
export class CatalogService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private get db() {
    return this.prisma.client
  }

  async countries() {
    const rows = await this.db.country.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    })
    return rows.map((c) => ({ id: Number(c.id), name: c.name, code: c.code }))
  }

  async universities(countryName?: string) {
    const rows = await this.db.university.findMany({
      where: {
        deletedAt: null,
        ...(countryName ? { country: { name: countryName } } : {}),
      },
      include: { country: true, _count: { select: { courses: true } } },
      orderBy: { name: 'asc' },
    })
    return rows.map((u) => ({
      id: Number(u.id),
      name: u.name,
      country: u.country.name,
      city: u.city ?? '',
      website: u.website ?? '',
      type: u.type ?? 'Public',
      established: u.established,
      ranking: u.ranking,
      showToAgent: u.showToAgent,
      status: u.status,
      courseCount: u._count.courses,
    }))
  }

  /** Two-level tree, shaped for the categories screen. */
  async categories() {
    const rows = await this.db.courseCategory.findMany({
      where: { deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    })
    return rows.map((c) => ({
      id: Number(c.id),
      name: c.name,
      parentId: c.parentId ? Number(c.parentId) : null,
      description: c.description ?? '',
      displayOrder: c.displayOrder,
      status: c.status,
    }))
  }

  async courses(filters: CourseFilters) {
    const page = Math.max(1, Number(filters.page) || 1)
    const limit = Math.min(200, Math.max(1, Number(filters.limit) || 50))

    const where: Record<string, unknown> = { deletedAt: null }
    if (filters.country) where.university = { country: { name: filters.country } }
    if (filters.university) where.university = { name: filters.university }
    if (filters.studyLevel) where.studyLevel = filters.studyLevel
    if (filters.studyArea) where.category = { parent: { name: filters.studyArea } }
    if (filters.search?.trim()) {
      where.title = { contains: filters.search.trim(), mode: 'insensitive' }
    }

    const [rows, total] = await Promise.all([
      this.db.course.findMany({
        where,
        include: {
          university: { include: { country: true } },
          category: { include: { parent: true } },
          intakes: { orderBy: { month: 'asc' } },
        },
        orderBy: { title: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.course.count({ where }),
    ])

    // IELTS is inside the requirements JSONB, which Postgres cannot index for a
    // numeric comparison — so this one filter runs in memory. Fine at catalog
    // scale; if it ever needs indexing, promote it to a real column.
    const maxIelts = filters.maxIelts ? Number(filters.maxIelts) : null
    const filtered =
      maxIelts === null
        ? rows
        : rows.filter((c) => {
            const req = c.requirements as { ielts?: number | null }
            return req?.ielts == null || req.ielts <= maxIelts
          })

    return {
      data: filtered.map((c) => this.toCourseDto(c)),
      total: maxIelts === null ? total : filtered.length,
      page,
      limit,
    }
  }

  async course(id: number) {
    const c = await this.db.course.findFirst({
      where: { id: BigInt(id), deletedAt: null },
      include: {
        university: { include: { country: true } },
        category: { include: { parent: true } },
        intakes: { orderBy: { month: 'asc' } },
      },
    })
    if (!c) throw new NotFoundException(`Course ${id} not found.`)
    return this.toCourseDto(c)
  }

  /**
   * Rebuild the flat shape src/mock/courseFinder.ts exposed, so the Course
   * Finder renders unchanged. Money is recombined into the "USD 100000" string
   * the UI expects, even though the DB stores amount and currency separately.
   */
  private toCourseDto(c: {
    id: bigint
    title: string
    studyLevel: string | null
    durationYears: number | null
    tuitionFee: unknown
    applicationFee: unknown
    currency: string | null
    commissionType: string | null
    commissionValue: string | null
    requirements: unknown
    university: { name: string; city: string | null; country: { name: string } }
    category: { name: string; parent: { name: string } | null } | null
    intakes: { month: number; year: number | null }[]
  }) {
    const req = (c.requirements ?? {}) as Record<string, number | null>
    const money = (v: unknown) =>
      v == null ? null : `${c.currency ?? ''} ${Number(v).toLocaleString('en-US')}`.trim()

    return {
      id: Number(c.id),
      title: c.title,
      university: c.university.name,
      city: c.university.city ?? '',
      country: c.university.country.name,
      studyLevel: c.studyLevel ?? '',
      studyArea: c.category?.parent?.name ?? c.category?.name ?? '',
      disciplineArea: c.category?.name ?? '',
      durationYears: c.durationYears,
      intakes: c.intakes.map((i) => MONTHS[i.month]).filter(Boolean),
      tuitionFee: money(c.tuitionFee),
      applicationFee: money(c.applicationFee),
      commission: c.commissionValue ?? '',
      ielts: req.ielts ?? null,
      ieltsNoBand: req.ieltsNoBand ?? null,
      toefl: req.toefl ?? null,
      pte: req.pte ?? null,
      gre: req.gre ?? null,
      gmat: req.gmat ?? null,
    }
  }
}
