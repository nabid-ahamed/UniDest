// Mock data for the Dashboard page.
// Docs: docs/superpowers/mock-data/adminpage.md. Replace with real API in Phase 2.

import { staff } from './staff'
import { ticketStatusCounts } from './supportTickets'
import { leads } from './leads'
import { students, studentState } from './students'
import { applications } from './applications'
import { nextScheduledFollowup } from './student/followups'
import { reminderMessageFor } from './reminderMessages'

export interface StatCardData {
  key: 'leads' | 'students' | 'applications' | 'support' | 'staff'
  label: string
  sublabel: string
  value: number
  color: 'blue' | 'emerald' | 'orange' | 'purple' | 'rose'
}

// ── Live counts ─────────────────────────────────────────────────────────────
// Every card reads its own module's live list, so the number on the dashboard
// always matches what you see after clicking through. "Open" excludes terminal
// statuses; "Total" excludes soft-deleted records.

// Live ticket counts so the dashboard always matches the Support Tickets module.
const _ticketCounts = ticketStatusCounts()

// Leads still in the pipeline — everything except the terminal Registered /
// Rejected states (which have left the working queue).
const _openLeads = leads.filter((l) => l.status !== 'Registered' && l.status !== 'Rejected').length

// Active students only (the default Students view; archived/deleted are excluded).
const _totalStudents = students.filter((s) => studentState(s) === 'active').length

// Applications not yet closed out — everything except Withdrawn.
const _openApplications = applications.filter((a) => a.status !== 'Withdrawn').length

export const dashboardStats: StatCardData[] = [
  { key: 'leads', label: 'Leads', sublabel: 'Open Leads', value: _openLeads, color: 'blue' },
  { key: 'students', label: 'Students', sublabel: 'Total Students', value: _totalStudents, color: 'emerald' },
  { key: 'applications', label: 'Applications', sublabel: 'Open Applications', value: _openApplications, color: 'orange' },
  // Live "Open" count from the Support Tickets module.
  { key: 'support', label: 'Support Tickets', sublabel: 'Open Support Tickets', value: _ticketCounts.Open, color: 'purple' },
  // Live count from the Staff module so it always matches that page.
  { key: 'staff', label: 'Staff', sublabel: 'Total Staff', value: staff.length, color: 'rose' },
]

export interface DailyPoint {
  date: string
  count: number
}

// Students — last 14 days
export const studentsDaily: DailyPoint[] = [
  { date: '06 Jul', count: 3 },
  { date: '07 Jul', count: 5 },
  { date: '08 Jul', count: 2 },
  { date: '09 Jul', count: 6 },
  { date: '10 Jul', count: 4 },
  { date: '11 Jul', count: 7 },
  { date: '12 Jul', count: 3 },
  { date: '13 Jul', count: 5 },
  { date: '14 Jul', count: 8 },
  { date: '15 Jul', count: 4 },
  { date: '16 Jul', count: 6 },
  { date: '17 Jul', count: 5 },
  { date: '18 Jul', count: 7 },
  { date: '19 Jul', count: 4 },
]

// Leads — last 7 days
export const leadsDaily: DailyPoint[] = [
  { date: '13', count: 2 },
  { date: '14', count: 4 },
  { date: '15', count: 1 },
  { date: '16', count: 3 },
  { date: '17', count: 5 },
  { date: '18', count: 2 },
  { date: '19', count: 3 },
]

// Applications — last 7 days
export const applicationsDaily: DailyPoint[] = [
  { date: '13', count: 1 },
  { date: '14', count: 2 },
  { date: '15', count: 3 },
  { date: '16', count: 1 },
  { date: '17', count: 2 },
  { date: '18', count: 4 },
  { date: '19', count: 2 },
]

// Students vs Leads — monthly trend for the smooth area chart.
export interface TrendPoint {
  month: string
  students: number
  leads: number
}

export const monthlyTrend: TrendPoint[] = [
  { month: 'Aug', students: 38, leads: 62 },
  { month: 'Sep', students: 45, leads: 70 },
  { month: 'Oct', students: 41, leads: 66 },
  { month: 'Nov', students: 52, leads: 78 },
  { month: 'Dec', students: 60, leads: 85 },
  { month: 'Jan', students: 58, leads: 90 },
  { month: 'Feb', students: 66, leads: 96 },
  { month: 'Mar', students: 74, leads: 104 },
  { month: 'Apr', students: 70, leads: 100 },
  { month: 'May', students: 82, leads: 112 },
  { month: 'Jun', students: 90, leads: 120 },
  { month: 'Jul', students: 96, leads: 128 },
]

// Per-branch share of the whole (also used to scale the stat datasets below).
// Declared here because the derived follow-up lists (which run at module load)
// consult it to decide whether a branch filter is active.
const BRANCH_SHARE: Record<string, number> = {
  Dhaka: 0.46,
  Chattogram: 0.24,
  Sylhet: 0.18,
  Khulna: 0.12,
}

export interface FollowUp {
  id: number
  name: string
  detail: string
  when: string
  /** Where clicking the row navigates (the lead/student detail page). */
  href?: string
}

export interface FollowUpBuckets {
  today: FollowUp[]
  due: FollowUp[]
  upcoming: FollowUp[]
}

// ── Follow-ups (derived, branch-aware) ───────────────────────────────────────
// Real follow-ups are read from the live Leads list (each lead's `nextFollowup`
// date) and from student follow-up records, then bucketed against "today":
//   date < today → Due (overdue) · date == today → Today · date > today → Upcoming
// Clicking a row opens that lead/student. Replaced by API aggregation in Phase 2.

// Demo "today". Seed follow-up dates cluster around late Jul 2026, so we anchor
// to the app's current date rather than the wall clock (which would dump every
// item into Due). One place to change when the demo data moves.
const FOLLOWUP_TODAY = new Date(2026, 6, 30) // 30 Jul 2026 (month is 0-based)

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

/** Parse a "DD Mon YYYY" (optionally "…, h:mm AM") date string → date-only Date, or null. */
function parseFollowupDate(raw: string | null | undefined): Date | null {
  if (!raw) return null
  const m = raw.match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/)
  if (!m) return null
  const day = Number(m[1])
  const month = MONTHS[m[2].slice(0, 3)]
  const year = Number(m[3])
  if (month === undefined) return null
  return new Date(year, month, day)
}

/** Whole-day difference (target − today); negative = overdue, 0 = today. */
function dayDelta(target: Date): number {
  const MS = 24 * 60 * 60 * 1000
  const a = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
  const b = Date.UTC(FOLLOWUP_TODAY.getFullYear(), FOLLOWUP_TODAY.getMonth(), FOLLOWUP_TODAY.getDate())
  return Math.round((a - b) / MS)
}

/** Human relative label for a day delta ("Today", "Yesterday", "In 3 days"…). */
function relativeWhen(delta: number): string {
  if (delta === 0) return 'Today'
  if (delta === 1) return 'Tomorrow'
  if (delta === -1) return 'Yesterday'
  if (delta < 0) return `${-delta} days ago`
  return `In ${delta} days`
}

type BucketKey = keyof FollowUpBuckets
function bucketFor(delta: number): BucketKey {
  if (delta < 0) return 'due'
  if (delta === 0) return 'today'
  return 'upcoming'
}

const matchesBranch = (branch: string, recordBranch: string) =>
  !BRANCH_SHARE[branch] || recordBranch === branch

/** Empty bucket set. */
const emptyBuckets = (): FollowUpBuckets => ({ today: [], due: [], upcoming: [] })

/**
 * Lead follow-ups for a branch. "All Branch" (or an unknown value) includes
 * every branch; a named branch keeps only its own leads. Rows are sorted so the
 * most-overdue appears first within each bucket.
 */
export function leadFollowupsFor(branch: string): FollowUpBuckets {
  const buckets = emptyBuckets()
  for (const l of leads) {
    const date = parseFollowupDate(l.nextFollowup)
    if (!date || !matchesBranch(branch, l.branch)) continue
    const delta = dayDelta(date)
    buckets[bucketFor(delta)].push({
      id: l.id,
      name: l.name,
      detail: `${l.countryInterested} — ${l.status}`,
      when: relativeWhen(delta),
      href: `/leads/${l.id}`,
    })
  }
  return buckets
}

/**
 * Student follow-ups for a branch, same bucketing as leads. These come straight
 * from the student follow-up store — the exact records created on a student's
 * page via "New Follow-up Record" (its "Next Follow-up" date). No follow-up
 * logged there → the student doesn't appear here. So the dashboard and the
 * student page always agree.
 */
export function studentFollowupsFor(branch: string): FollowUpBuckets {
  const buckets = emptyBuckets()
  for (const student of students) {
    if (studentState(student) !== 'active') continue
    if (!matchesBranch(branch, student.branch)) continue
    const record = nextScheduledFollowup(student.id)
    const date = parseFollowupDate(record?.next)
    if (!record || !date) continue
    const delta = dayDelta(date)
    buckets[bucketFor(delta)].push({
      id: student.id,
      name: student.name,
      detail: record.details || 'Follow-up',
      when: relativeWhen(delta),
      href: `/students/${student.id}`,
    })
  }
  return buckets
}

// "All Branch" defaults kept for any caller that imports them directly.
export const leadFollowups: FollowUpBuckets = leadFollowupsFor('All Branch')
export const studentFollowups: FollowUpBuckets = studentFollowupsFor('All Branch')

export interface Reminder {
  id: number
  name: string
  applicationNo: string
  deadline: string
  owner: string
  activity: string
  /** Days until the deadline (negative = overdue) — drives the Overdue badge. */
  daysLeft: number
  overdue: boolean
  branch: string
  /** Where clicking the row navigates (the application detail page). */
  href: string
}

// ── Reminders (derived from the live Applications list) ──────────────────────
// Each open application yields one reminder. The next action comes from the
// admin-editable status→message map (see mock/reminderMessages.ts — customised
// from the Application view), and the deadline from its intake (the month before
// intake — when paperwork must be in). Overdue rows (deadline < today) are
// flagged and float to the top. A status with no configured message (e.g.
// Withdrawn) produces no reminder. Replaced by real per-application deadlines
// in Phase 2.

/** Parse an intake "Month YYYY" (e.g. "July 2026") → first-of-month Date, or null. */
function parseMonthYear(raw: string): Date | null {
  const m = raw.match(/([A-Za-z]{3,})\s+(\d{4})/)
  if (!m) return null
  const month = MONTHS[m[1].slice(0, 3)]
  if (month === undefined) return null
  return new Date(Number(m[2]), month, 1)
}

/** "DD Mon YYYY" label for a Date (matches the reminder row format). */
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function formatDeadline(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')} ${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Reminders for a branch, newest-priority first: overdue rows lead, then by
 * soonest deadline. "All Branch" (or an unknown value) includes every branch.
 */
export function remindersFor(branch: string): Reminder[] {
  const rows: Reminder[] = []
  for (const app of applications) {
    const activity = reminderMessageFor(app.status)
    if (!activity) continue // no message configured for this status → skip
    if (!matchesBranch(branch, app.branch)) continue
    const intake = parseMonthYear(app.intake)
    if (!intake) continue
    // Deadline = the 15th of the month before intake (paperwork cut-off).
    const deadline = new Date(intake.getFullYear(), intake.getMonth() - 1, 15)
    const daysLeft = dayDelta(deadline)
    rows.push({
      id: app.id,
      name: app.student,
      applicationNo: String(app.id),
      deadline: formatDeadline(deadline),
      owner: app.assignedTo ?? 'Unassigned',
      activity,
      daysLeft,
      overdue: daysLeft < 0,
      branch: app.branch,
      href: `/applications/${app.id}`,
    })
  }
  // Overdue first, then soonest deadline.
  return rows.sort((a, b) => a.daysLeft - b.daysLeft)
}

/** "All Branch" reminders — the default list kept for direct importers. */
export const applicationReminders: Reminder[] = remindersFor('All Branch')

export const reminderCount = applicationReminders.length

export const branches: string[] = ['All Branch', 'Dhaka', 'Chattogram', 'Sylhet', 'Khulna']

// ── Breakdown sections (Students / Leads / Tickets / Your stats) ──

/**
 * Semantic status tone — maps to the `status.*` colour tokens in
 * tailwind.config.js. Components resolve a tone to a class; they never receive
 * a raw hex, so contrast stays guaranteed in one place.
 */
export type StatusTone =
  | 'pending'
  | 'progress'
  | 'review'
  | 'success'
  | 'danger'
  | 'neutral'
  | 'info'
  | 'total'

export interface Breakdown {
  label: string
  count: number
  tone: StatusTone
}

export interface SimpleStat {
  label: string
  value: number
}

// Live counts from the Support Tickets module.
export const ticketSummary: SimpleStat[] = [
  { label: 'Open', value: _ticketCounts.Open },
  { label: 'Pending', value: _ticketCounts.Pending },
  { label: 'Resolved', value: _ticketCounts.Resolved },
  { label: 'Closed', value: _ticketCounts.Closed },
]

export const ticketsByPriority: Breakdown[] = [
  { label: 'High', count: 23, tone: 'danger' },
  { label: 'Medium', count: 58, tone: 'pending' },
  { label: 'Low', count: 56, tone: 'success' },
]

export const yourStats: SimpleStat[] = [
  { label: 'My Leads', value: 12 },
  { label: 'My Students', value: 47 },
  { label: 'My Applications', value: 29 },
  { label: 'My Open Tasks', value: 8 },
]

// Study Abroad Stats — colored application-status tiles
export interface AppStatusStat {
  label: string
  count: number
  tone: StatusTone
}

// Tones group statuses by pipeline stage, so colour actually carries meaning
// (previously 11 of these 22 shared one identical blue).
export const applicationStatusStats: AppStatusStat[] = [
  { label: 'Pending', count: 87, tone: 'pending' },
  { label: 'Documents Ready', count: 19, tone: 'progress' },
  { label: 'Admission Criteria Met', count: 11, tone: 'progress' },
  { label: 'EMGS Issued', count: 3, tone: 'success' },
  { label: 'Application Fee', count: 6, tone: 'pending' },
  { label: 'Application Submitted', count: 14, tone: 'progress' },
  { label: 'Offer Letter Received', count: 16, tone: 'success' },
  { label: 'Conditional Offer Letter', count: 5, tone: 'review' },
  { label: 'Funds Under Assessment', count: 4, tone: 'review' },
  { label: 'COE Received', count: 3, tone: 'success' },
  { label: 'Payment Received', count: 7, tone: 'success' },
  { label: 'CAS Requested', count: 2, tone: 'progress' },
  { label: 'CAS Received', count: 3, tone: 'success' },
  { label: 'I-20 Initiated', count: 1, tone: 'progress' },
  { label: 'I-20 Received', count: 2, tone: 'success' },
  { label: 'AIP Received', count: 1, tone: 'success' },
  { label: 'GIC Account Created', count: 2, tone: 'progress' },
  { label: 'Visa In Process', count: 12, tone: 'review' },
  { label: 'Visa Received', count: 9, tone: 'success' },
  { label: 'Admission Complete', count: 10, tone: 'success' },
  { label: 'Rejected', count: 4, tone: 'danger' },
  { label: 'Total Applications', count: 234, tone: 'total' },
]

// Students section — status tiles
export const studentStatusStats: AppStatusStat[] = [
  { label: 'Pending for Registration', count: 1892, tone: 'pending' },
  { label: 'Course Preference Added', count: 53, tone: 'progress' },
  { label: 'Onboarding', count: 6, tone: 'info' },
  { label: 'Documents Uploaded', count: 14, tone: 'progress' },
  { label: 'Application Processing', count: 61, tone: 'review' },
  { label: 'Admission Complete', count: 18, tone: 'success' },
  { label: 'Total Students', count: 1876, tone: 'total' },
]

// Leads section — status tiles
export const leadStatusStats: AppStatusStat[] = [
  { label: 'New Lead', count: 27, tone: 'info' },
  { label: 'Attempted', count: 12, tone: 'neutral' },
  { label: 'Counseling', count: 9, tone: 'review' },
  { label: 'SL Final Counseling', count: 4, tone: 'review' },
  { label: 'Warm', count: 8, tone: 'pending' },
  { label: 'Long Term Nurture', count: 5, tone: 'neutral' },
  { label: 'Cold', count: 6, tone: 'neutral' },
  { label: 'Registered', count: 152, tone: 'success' },
  { label: 'Rejected', count: 11, tone: 'danger' },
  { label: 'Potential', count: 7, tone: 'progress' },
  { label: 'Financials Outstanding', count: 3, tone: 'pending' },
  { label: 'Non Responsive', count: 14, tone: 'neutral' },
  { label: 'Testing', count: 2, tone: 'neutral' },
  { label: 'Total Leads', count: 176, tone: 'total' },
]

// ── Branch filtering ───────────────────────────────────────────────────────
// The datasets above are the "All Branch" totals. Each branch holds a share of
// the whole; picking one scales every number by that share so the dashboard
// visibly re-renders. Shares (excluding "All Branch") sum to 1, so the parts
// add back up to the totals — a believable breakdown for the prototype.
// Replaced by real per-branch aggregation in Phase 2.
// (BRANCH_SHARE is declared near the top — the follow-up lists read it at load.)

/** Scale a count by the branch share; keep totals whole and never below 0. */
function scale(value: number, share: number): number {
  return Math.max(0, Math.round(value * share))
}

function scaleStats<T extends { count: number }>(items: T[], share: number): T[] {
  return items.map((s) => ({ ...s, count: scale(s.count, share) }))
}

export interface BranchDashboard {
  branch: string
  stats: StatCardData[]
  monthlyTrend: TrendPoint[]
  applicationsDaily: DailyPoint[]
  applicationStatusStats: AppStatusStat[]
  studentStatusStats: AppStatusStat[]
  leadStatusStats: AppStatusStat[]
  ticketSummary: SimpleStat[]
  ticketsByPriority: Breakdown[]
  yourStats: SimpleStat[]
  leadFollowups: FollowUpBuckets
  studentFollowups: FollowUpBuckets
  reminders: Reminder[]
}

/**
 * All dashboard datasets scoped to a branch. "All Branch" (or an unknown value)
 * returns the full totals unchanged; a named branch returns scaled copies.
 */
export function branchDashboard(branch: string): BranchDashboard {
  const share = BRANCH_SHARE[branch]
  if (!share) {
    return {
      branch,
      stats: dashboardStats,
      monthlyTrend,
      applicationsDaily,
      applicationStatusStats,
      studentStatusStats,
      leadStatusStats,
      ticketSummary,
      ticketsByPriority,
      yourStats,
      leadFollowups,
      studentFollowups,
      reminders: applicationReminders,
    }
  }
  return {
    branch,
    stats: dashboardStats.map((s) => ({ ...s, value: scale(s.value, share) })),
    monthlyTrend: monthlyTrend.map((p) => ({
      ...p,
      students: scale(p.students, share),
      leads: scale(p.leads, share),
    })),
    applicationsDaily: applicationsDaily.map((p) => ({ ...p, count: scale(p.count, share) })),
    applicationStatusStats: scaleStats(applicationStatusStats, share),
    studentStatusStats: scaleStats(studentStatusStats, share),
    leadStatusStats: scaleStats(leadStatusStats, share),
    ticketSummary: ticketSummary.map((s) => ({ ...s, value: scale(s.value, share) })),
    ticketsByPriority: scaleStats(ticketsByPriority, share),
    yourStats: yourStats.map((s) => ({ ...s, value: scale(s.value, share) })),
    // Follow-ups filter by branch (not scaled) — they're real per-record rows.
    leadFollowups: leadFollowupsFor(branch),
    studentFollowups: studentFollowupsFor(branch),
    reminders: remindersFor(branch),
  }
}
