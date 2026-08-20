import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { TicketsService } from '../tickets/tickets.service'

const TENANT_ID = 1n

/**
 * "All Branch" is a filter sentinel, not a row in the branches table — the
 * frontend renders it as a synthetic option. Treat it (and anything unknown)
 * as "no branch filter".
 */
const ALL_BRANCH = 'All Branch'

/** Matches StatCardData in src/mock/dashboard.ts. */
interface StatCard {
  key: 'leads' | 'students' | 'applications' | 'support' | 'staff'
  label: string
  sublabel: string
  value: number
  color: 'blue' | 'emerald' | 'orange' | 'purple' | 'rose'
}

type StatusTone = 'pending' | 'progress' | 'review' | 'success' | 'danger' | 'neutral' | 'info' | 'total'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Status label → the tone the UI paints the tile with. The DB deliberately has
 * no colour column (spec §5.3: tenants rename statuses, so colour cannot live
 * with the label), and the mock's tones are the vocabulary the tiles expect.
 * Anything unrecognised falls back to 'neutral' rather than breaking the grid.
 */
const TONES: Record<string, StatusTone> = {
  New: 'info',
  Warm: 'pending',
  Hot: 'danger',
  Cold: 'neutral',
  Counselling: 'progress',
  'Documents Pending': 'review',
  Registered: 'success',
  Rejected: 'danger',
  Active: 'success',
  Inactive: 'neutral',
  Applied: 'progress',
  'Payment Received': 'info',
  'Offer Received': 'review',
  'Visa Applied': 'progress',
  'Visa Granted': 'success',
  Enrolled: 'success',
  Withdrawn: 'danger',
}

const toneFor = (label: string): StatusTone => TONES[label] ?? 'neutral'

/** dd Mon yyyy — the format every dashboard list already renders. */
function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Midnight today, in server-local time — the reference point for follow-ups. */
function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

@Injectable()
export class DashboardService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TicketsService) private readonly tickets: TicketsService,
  ) {}

  private get db() {
    return this.prisma.client
  }

  /**
   * Everything the dashboard renders, in one response.
   *
   * One round trip rather than a dozen: every card shares the same branch
   * filter, so splitting them would multiply latency without giving any card
   * data sooner. Counts come from `groupBy`/`count` in the database — loading
   * rows to count them in JS is fine at 15 rows and ruinous at 50,000.
   */
  async overview(branchName?: string) {
    const branchId = await this.resolveBranch(branchName)
    const scope = branchId ? { branchId } : {}

    const [
      openLeads,
      totalStudents,
      openApplications,
      staffCount,
      leadStatusStats,
      studentStatusStats,
      applicationStatusStats,
      monthlyTrend,
      applicationsDaily,
      leadFollowups,
      reminders,
      ticketSummary,
      ticketsByPriority,
    ] = await Promise.all([
      this.countOpenLeads(scope),
      this.db.student.count({ where: { tenantId: TENANT_ID, deletedAt: null, archivedAt: null, ...scope } }),
      this.countOpenApplications(scope),
      this.db.user.count({ where: { tenantId: TENANT_ID, deletedAt: null, ...scope } }),
      this.leadStatusStats(scope),
      this.studentStatusStats(scope),
      this.applicationStatusStats(scope),
      this.monthlyTrend(scope),
      this.applicationsDaily(scope),
      this.leadFollowUps(scope),
      this.reminders(scope),
      this.tickets.statusCounts(branchId),
      this.tickets.priorityCounts(branchId),
    ])

    const stats: StatCard[] = [
      { key: 'leads', label: 'Leads', sublabel: 'Open Leads', value: openLeads, color: 'blue' },
      { key: 'students', label: 'Students', sublabel: 'Total Students', value: totalStudents, color: 'emerald' },
      {
        key: 'applications',
        label: 'Applications',
        sublabel: 'Open Applications',
        value: openApplications,
        color: 'orange',
      },
      {
        key: 'support',
        label: 'Support Tickets',
        sublabel: 'Open Support Tickets',
        // Sums the statuses flagged isOpen, so renaming "Pending" does not
        // change what the card counts.
        value: ticketSummary.filter((t) => t.isOpen).reduce((n, t) => n + t.value, 0),
        color: 'purple',
      },
      { key: 'staff', label: 'Staff', sublabel: 'Total Staff', value: staffCount, color: 'rose' },
    ]

    return {
      branch: branchName ?? ALL_BRANCH,
      stats,
      monthlyTrend,
      applicationsDaily,
      applicationStatusStats,
      studentStatusStats,
      leadStatusStats,
      // Real counts now that the tickets module exists.
      ticketSummary: ticketSummary.map(({ label, value }) => ({ label, value })),
      ticketsByPriority,
      yourStats: [],
      leadFollowups,
      // Students carry no follow-up date yet — see leadFollowUps().
      studentFollowups: { today: [], due: [], upcoming: [] },
      reminders,
    }
  }

  /** Branch name → id. Unknown names and the "All Branch" sentinel mean no filter. */
  private async resolveBranch(name?: string): Promise<bigint | null> {
    if (!name || name === ALL_BRANCH) return null
    const branch = await this.db.branch.findFirst({
      where: { tenantId: TENANT_ID, name, deletedAt: null },
      select: { id: true },
    })
    return branch?.id ?? null
  }

  /**
   * Open = still in the pipeline. LeadStatus carries isWon/isLost rather than
   * the isTerminal flag the other two lookups use, so "left the queue" means
   * either of those — matching the mock, which excluded Registered and
   * Rejected.
   */
  private async countOpenLeads(scope: Record<string, unknown>) {
    return this.db.lead.count({
      where: {
        tenantId: TENANT_ID,
        deletedAt: null,
        status: { isWon: false, isLost: false },
        ...scope,
      },
    })
  }

  private async countOpenApplications(scope: Record<string, unknown>) {
    return this.db.application.count({
      where: {
        tenantId: TENANT_ID,
        deletedAt: null,
        status: { isTerminal: false },
        ...scope,
      },
    })
  }

  private async leadStatusStats(scope: Record<string, unknown>) {
    const [grouped, statuses] = await Promise.all([
      this.db.lead.groupBy({
        by: ['statusId'],
        where: { tenantId: TENANT_ID, deletedAt: null, ...scope },
        _count: { _all: true },
      }),
      this.db.leadStatus.findMany({
        where: { tenantId: TENANT_ID, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      }),
    ])
    return this.joinStats(grouped, statuses)
  }

  private async studentStatusStats(scope: Record<string, unknown>) {
    const [grouped, statuses] = await Promise.all([
      this.db.student.groupBy({
        by: ['statusId'],
        where: { tenantId: TENANT_ID, deletedAt: null, ...scope },
        _count: { _all: true },
      }),
      this.db.studentStatus.findMany({
        where: { tenantId: TENANT_ID, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      }),
    ])
    return this.joinStats(grouped, statuses)
  }

  private async applicationStatusStats(scope: Record<string, unknown>) {
    const [grouped, statuses] = await Promise.all([
      this.db.application.groupBy({
        by: ['statusId'],
        where: { tenantId: TENANT_ID, deletedAt: null, ...scope },
        _count: { _all: true },
      }),
      this.db.applicationStatus.findMany({
        where: { tenantId: TENANT_ID, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      }),
    ])
    return this.joinStats(grouped, statuses)
  }

  /**
   * Every status appears, including the ones with no rows — a pipeline stage at
   * zero is information, and omitting it would make the grid jump around as
   * counts change.
   */
  private joinStats(
    grouped: Array<{ statusId: bigint; _count: { _all: number } }>,
    statuses: Array<{ id: bigint; label: string }>,
  ) {
    const counts = new Map(grouped.map((g) => [g.statusId.toString(), g._count._all]))
    return statuses.map((s) => ({
      label: s.label,
      count: counts.get(s.id.toString()) ?? 0,
      tone: toneFor(s.label),
    }))
  }

  /** Last 6 months of lead and student creation, oldest first. */
  private async monthlyTrend(scope: Record<string, unknown>) {
    const start = new Date()
    start.setMonth(start.getMonth() - 5)
    start.setDate(1)
    start.setHours(0, 0, 0, 0)

    const [leads, students] = await Promise.all([
      this.db.lead.findMany({
        where: { tenantId: TENANT_ID, deletedAt: null, createdAt: { gte: start }, ...scope },
        select: { createdAt: true },
      }),
      this.db.student.findMany({
        where: { tenantId: TENANT_ID, deletedAt: null, createdAt: { gte: start }, ...scope },
        select: { createdAt: true },
      }),
    ])

    // Six buckets is a fixed, tiny series, so bucketing in JS costs nothing and
    // avoids a raw date_trunc query per database dialect.
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(start)
      d.setMonth(start.getMonth() + i)
      return { key: `${d.getFullYear()}-${d.getMonth()}`, month: MONTHS[d.getMonth()], leads: 0, students: 0 }
    })
    const index = new Map(buckets.map((b) => [b.key, b]))

    for (const l of leads) {
      const b = index.get(`${l.createdAt.getFullYear()}-${l.createdAt.getMonth()}`)
      if (b) b.leads += 1
    }
    for (const s of students) {
      const b = index.get(`${s.createdAt.getFullYear()}-${s.createdAt.getMonth()}`)
      if (b) b.students += 1
    }

    return buckets.map(({ month, leads: l, students: s }) => ({ month, leads: l, students: s }))
  }

  /** Applications created per day over the last 14 days, oldest first. */
  private async applicationsDaily(scope: Record<string, unknown>) {
    const start = startOfToday()
    start.setDate(start.getDate() - 13)

    const rows = await this.db.application.findMany({
      where: { tenantId: TENANT_ID, deletedAt: null, createdAt: { gte: start }, ...scope },
      select: { createdAt: true },
    })

    const buckets = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return { key: d.toDateString(), date: `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`, count: 0 }
    })
    const index = new Map(buckets.map((b) => [b.key, b]))

    for (const r of rows) {
      const b = index.get(new Date(r.createdAt).toDateString())
      if (b) b.count += 1
    }

    return buckets.map(({ date, count }) => ({ date, count }))
  }

  /**
   * Lead follow-ups split into overdue / today / upcoming, from real
   * `nextFollowUpAt` dates. Leads with no date set simply do not appear.
   *
   * Only leads have this column — students are followed up through
   * applications, and adding the field to Student is a schema change that
   * belongs with the follow-ups module, not with the dashboard read model.
   * The student card therefore renders an empty state rather than fake rows.
   */
  private async leadFollowUps(scope: Record<string, unknown>) {
    const today = startOfToday()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const rows = await this.db.lead.findMany({
      where: { tenantId: TENANT_ID, deletedAt: null, nextFollowUpAt: { not: null }, ...scope },
      select: { id: true, name: true, phone: true, nextFollowUpAt: true },
      orderBy: { nextFollowUpAt: 'asc' },
    })

    const buckets: {
      today: Array<Record<string, unknown>>
      due: Array<Record<string, unknown>>
      upcoming: Array<Record<string, unknown>>
    } = { today: [], due: [], upcoming: [] }

    for (const r of rows) {
      const at = r.nextFollowUpAt as Date
      const entry = {
        id: Number(r.id),
        name: r.name,
        detail: r.phone ?? '',
        when: fmtDate(at),
        href: `/leads/${Number(r.id)}`,
      }
      if (at < today) buckets.due.push(entry)
      else if (at < tomorrow) buckets.today.push(entry)
      else buckets.upcoming.push(entry)
    }

    return buckets
  }

  /**
   * Applications still awaiting a decision, oldest submission first.
   *
   * The schema has no deadline column — the mock invented one, but nothing in
   * the funnel actually captures a due date yet. So "reminder" here means an
   * application that has been submitted and not yet decided, and `daysLeft`
   * reports how long it has been waiting (negative = days since submission),
   * which is what the Overdue badge keys off. A real deadline field is a Phase
   * 4 schema change, not something to fabricate here.
   */
  private async reminders(scope: Record<string, unknown>) {
    const today = startOfToday()

    const rows = await this.db.application.findMany({
      where: {
        tenantId: TENANT_ID,
        deletedAt: null,
        decisionAt: null,
        submittedAt: { not: null },
        ...scope,
      },
      select: {
        id: true,
        submittedAt: true,
        student: { select: { name: true, studentNo: true, branch: { select: { name: true } } } },
        assignedTo: { select: { name: true } },
        status: { select: { label: true } },
      },
      orderBy: { submittedAt: 'asc' },
      take: 20,
    })

    return rows.map((r) => {
      const submitted = r.submittedAt as Date
      // Negative once it is older than today, so the UI's `overdue` styling
      // lands on the applications that have waited longest.
      const daysLeft = daysBetween(today, submitted)
      return {
        id: Number(r.id),
        name: r.student.name,
        applicationNo: `APP-${Number(r.id)}`,
        deadline: fmtDate(submitted),
        owner: r.assignedTo?.name ?? 'Unassigned',
        activity: r.status.label,
        daysLeft,
        overdue: daysLeft < 0,
        branch: r.student.branch?.name ?? '',
        href: `/applications/${Number(r.id)}`,
      }
    })
  }

  /** Branch names for the dashboard filter, with the sentinel first. */
  async branches() {
    const rows = await this.db.branch.findMany({
      where: { tenantId: TENANT_ID, deletedAt: null },
      select: { name: true },
      orderBy: { name: 'asc' },
    })
    return [ALL_BRANCH, ...rows.map((b) => b.name)]
  }
}
