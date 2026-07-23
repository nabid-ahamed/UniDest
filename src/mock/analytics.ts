// Analytics report layer. Instead of a separate dataset, every report is
// *computed* from the existing module mocks (leads, students, applications,
// invoices, referrals) so the numbers always match those pages.
// Docs: docs/superpowers/mock-data/adminpage.md.

import { leads, leadStatuses, leadBranches } from './leads'
import { students, studentStatuses, residenceCountries } from './students'
import { applications, applicationStatuses, applicationChannels } from './applications'
import { universityInvoices, formatMoney as formatUniMoney } from './invoices'
import {
  studentInvoices,
  invoiceStatus as siStatus,
  invoiceGrandTotal,
  invoiceDue,
  invoiceCurrency,
  formatMoney as formatSiMoney,
} from './studentInvoices'
import { referralSignups, formatCommission } from './referrals'

export const reportTypes = [
  'Leads Report',
  'Students Report',
  'Applications Report',
  'Student Referral Report',
  'University Invoices',
  'Sales Report',
] as const

export type ReportType = (typeof reportTypes)[number]

/** Branch filter options (shared lookup; "Branch-wise" behaves like All here). */
export const analyticsBranches = ['All Branches', ...leadBranches.filter((b) => b !== 'All Branch')]

export interface ReportTile {
  label: string
  value: string
}

export interface ChartSlice {
  name: string
  value: number
  color: string
}

export interface ReportResult {
  chartTitle: string
  chart: ChartSlice[]
  breakdownTitle: string
  headers: string[]
  rows: (string | number)[][]
  tiles: ReportTile[]
  empty: boolean
}

/** Tolerant date parser for the mixed formats across mocks ("dd-mm-yyyy" and "dd Mon yyyy"). */
function parseAny(dateStr: string): Date | null {
  const s = dateStr.trim()
  let m = s.match(/^(\d{2})-(\d{2})-(\d{4})/)
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/)
  if (m) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const mi = months.indexOf(m[2].toLowerCase())
    if (mi >= 0) return new Date(Number(m[3]), mi, Number(m[1]))
  }
  return null
}

export interface ReportFilters {
  branch: string // "All Branches" = no branch filter
  from: string // yyyy-mm-dd or ''
  to: string
}

function inRange(dateStr: string | undefined, from: string, to: string): boolean {
  if (!from && !to) return true
  if (!dateStr) return true
  const d = parseAny(dateStr)
  if (!d) return true
  if (from && d < new Date(from)) return false
  if (to && d > new Date(`${to}T23:59:59`)) return false
  return true
}

const branchOk = (branch: string, rowBranch?: string) =>
  branch === 'All Branches' || !rowBranch || rowBranch === branch

/** Group a list into { name, value, color } slices keyed by a field, using a colour map. */
function groupByStatus<T>(
  list: T[],
  keyOf: (x: T) => string,
  palette: { label: string; color: string }[],
): ChartSlice[] {
  const counts = new Map<string, number>()
  for (const item of list) {
    const k = keyOf(item)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return palette
    .map((p) => ({ name: p.label, value: counts.get(p.label) ?? 0, color: p.color }))
    .filter((s) => s.value > 0)
}

const FALLBACK_COLORS = ['#1d4ed8', '#0e7490', '#6d28d9', '#c2410c', '#15803d', '#a16207', '#b91c1c', '#475569']

function groupByField<T>(list: T[], keyOf: (x: T) => string): ChartSlice[] {
  const counts = new Map<string, number>()
  for (const item of list) {
    const k = keyOf(item)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value, color: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }))
}

export function computeReport(type: ReportType, f: ReportFilters): ReportResult {
  switch (type) {
    case 'Leads Report': {
      const rows = leads.filter((l) => branchOk(f.branch, l.branch) && inRange(l.created, f.from, f.to))
      const byCountry = groupByField(rows, (l) => l.countryInterested)
      return {
        chartTitle: 'Leads by Status',
        chart: groupByStatus(rows, (l) => l.status, leadStatuses),
        breakdownTitle: 'Leads by Country Interested',
        headers: ['Country', 'Leads'],
        rows: byCountry.map((c) => [c.name, c.value]),
        tiles: [
          { label: 'Total Leads', value: String(rows.length) },
          { label: 'With Follow-up', value: String(rows.filter((l) => l.nextFollowup).length) },
          { label: 'Registered', value: String(rows.filter((l) => l.status === 'Registered').length) },
          { label: 'Top Country', value: byCountry[0]?.name ?? '—' },
        ],
        empty: rows.length === 0,
      }
    }
    case 'Students Report': {
      const rows = students.filter((s) => branchOk(f.branch, s.branch) && inRange(s.created, f.from, f.to))
      return {
        chartTitle: 'Students by Status',
        chart: groupByStatus(rows, (s) => s.status, studentStatuses),
        breakdownTitle: 'Students by Country of Residence',
        headers: ['Country', 'Students'],
        rows: residenceCountries.map((c) => [c, rows.filter((s) => s.countryOfResidence === c).length]),
        tiles: [
          { label: 'Total Students', value: String(rows.length) },
          { label: 'Enrolled', value: String(rows.filter((s) => s.status === 'Enrolled').length) },
          { label: 'Docs Pending', value: String(rows.filter((s) => s.status === 'Docs Pending').length) },
          { label: 'Applications', value: String(rows.reduce((n, s) => n + s.applications, 0)) },
        ],
        empty: rows.length === 0,
      }
    }
    case 'Applications Report': {
      const rows = applications.filter((a) => branchOk(f.branch, a.branch) && inRange(a.dateCreated, f.from, f.to))
      return {
        chartTitle: 'Applications by Status',
        chart: groupByStatus(rows, (a) => a.status, applicationStatuses),
        breakdownTitle: 'Applications by Channel',
        headers: ['Channel', 'Applications'],
        rows: applicationChannels.map((c) => [c, rows.filter((a) => a.appliedThrough === c).length]),
        tiles: [
          { label: 'Total Applications', value: String(rows.length) },
          { label: 'Offer Received', value: String(rows.filter((a) => a.status === 'Offer Letter Received').length) },
          { label: 'Pending', value: String(rows.filter((a) => a.status === 'Pending').length) },
          { label: 'Universities', value: String(new Set(rows.map((a) => a.university)).size) },
        ],
        empty: rows.length === 0,
      }
    }
    case 'Student Referral Report': {
      const rows = referralSignups.filter((r) => inRange(r.date, f.from, f.to))
      const totalCommission = rows.reduce((n, r) => n + (r.commission ?? 0), 0)
      const byReferrer = new Map<string, number>()
      for (const r of rows) byReferrer.set(r.referrer ?? `ID ${r.referrerId}`, (byReferrer.get(r.referrer ?? `ID ${r.referrerId}`) ?? 0) + 1)
      return {
        chartTitle: 'Referrals by Referrer',
        chart: [...byReferrer.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([name, value], i) => ({ name, value, color: FALLBACK_COLORS[i % FALLBACK_COLORS.length] })),
        breakdownTitle: 'Referrals by Referrer',
        headers: ['Referrer', 'Signups'],
        rows: [...byReferrer.entries()].sort((a, b) => b[1] - a[1]),
        tiles: [
          { label: 'Total Signups', value: String(rows.length) },
          { label: 'With Commission', value: String(rows.filter((r) => r.commission != null).length) },
          { label: 'Referrers', value: String(byReferrer.size) },
          { label: 'Total Reward', value: formatCommission(totalCommission) },
        ],
        empty: rows.length === 0,
      }
    }
    case 'University Invoices': {
      const rows = universityInvoices.filter((i) => inRange(i.date, f.from, f.to))
      const paid = rows.filter((i) => i.status === 'Paid')
      const due = rows.filter((i) => i.status === 'Due')
      const byCurrency = new Map<string, number>()
      for (const i of rows) byCurrency.set(i.currency, (byCurrency.get(i.currency) ?? 0) + i.amount)
      return {
        chartTitle: 'Invoices: Paid vs Due',
        chart: [
          { name: 'Paid', value: paid.length, color: '#15803d' },
          { name: 'Due', value: due.length, color: '#b91c1c' },
        ].filter((s) => s.value > 0),
        breakdownTitle: 'Invoiced Amount by Currency',
        headers: ['Currency', 'Amount'],
        rows: [...byCurrency.entries()].map(([c, amt]) => [c, formatUniMoney(c, amt)]),
        tiles: [
          { label: 'Total Invoices', value: String(rows.length) },
          { label: 'Paid', value: String(paid.length) },
          { label: 'Due', value: String(due.length) },
          { label: 'Agent Requests', value: String(rows.filter((i) => i.agentInvoiceRequested).length) },
        ],
        empty: rows.length === 0,
      }
    }
    case 'Sales Report': {
      const rows = studentInvoices.filter((i) => inRange(i.date, f.from, f.to))
      const currency = rows.length ? invoiceCurrency(rows[0]) : 'USD'
      const invoiced = rows.reduce((n, i) => n + invoiceGrandTotal(i), 0)
      const dueTotal = rows.reduce((n, i) => n + invoiceDue(i), 0)
      const paidTotal = invoiced - dueTotal
      const paidCount = rows.filter((i) => siStatus(i) === 'Paid').length
      return {
        chartTitle: 'Invoices: Paid vs Due',
        chart: [
          { name: 'Paid', value: paidCount, color: '#15803d' },
          { name: 'Due', value: rows.length - paidCount, color: '#b91c1c' },
        ].filter((s) => s.value > 0),
        breakdownTitle: 'Sales Summary',
        headers: ['Metric', 'Amount'],
        rows: [
          ['Total Invoiced', formatSiMoney(currency, invoiced)],
          ['Collected (Paid)', formatSiMoney(currency, paidTotal)],
          ['Outstanding (Due)', formatSiMoney(currency, dueTotal)],
        ],
        tiles: [
          { label: 'Total Invoices', value: String(rows.length) },
          { label: 'Fully Paid', value: String(paidCount) },
          { label: 'Collected', value: formatSiMoney(currency, paidTotal) },
          { label: 'Outstanding', value: formatSiMoney(currency, dueTotal) },
        ],
        empty: rows.length === 0,
      }
    }
  }
}
