import type { ReactNode } from 'react'
import { useState } from 'react'
import { BookOpen, ClipboardList } from 'lucide-react'
import { PortalCard, PortalListHead, PortalEmpty } from './components/PortalCard'
import { StatusPill } from './components/StatusPill'
import { initials, avatarColor } from '../../mock/staff'
import { pickTextColor } from '../../lib/contrast'
import {
  currentStudent,
  myApplications,
  documentRequests,
  documentStatusColor,
} from '../../mock/student/portal'
import { useInvoices, useServiceRequests, formatMoney } from '../../lib/api'

/**
 * Pill colour per invoice status. Mirrors StudentFeesPage rather than the
 * portal mock's map, which covered only the two states the fake invoices had —
 * the API also reports "Partially Paid".
 */
const INVOICE_STATUS_COLORS: Record<string, string> = {
  Paid: '#15803d',
  'Partially Paid': '#a16207',
  Due: '#b91c1c',
}
const invoiceStatusColor = (s: string) => INVOICE_STATUS_COLORS[s] ?? '#475569'
import { ensureCourseSuggestionsSeed, loadCfSuggestions } from '../../mock/courseSuggestions'

/** Small circular icon tile in a brand tint. */
function IconTile({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
      {children}
    </span>
  )
}

export default function StudentDashboardPage() {
  const applications = myApplications()
  // Both scoped to this student by the API, same as the pages they link to.
  const { data: invoices = [] } = useInvoices('student')
  const { data: services = [] } = useServiceRequests()
  // Course suggestions share the admin store, so they match the Course
  // Suggestions page (seeded once, idempotently).
  const [courseSuggestions] = useState(() => {
    const personId = currentStudent().id
    ensureCourseSuggestionsSeed(personId)
    return loadCfSuggestions(personId)
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">Student Dashboard</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Course Suggestions */}
        <PortalCard title="Course Suggestions" subtitle="My Course Suggestions" viewAllTo="/portal/course-suggestions">
          {courseSuggestions.length === 0 ? (
            <PortalEmpty text="No course suggestions yet." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {courseSuggestions.map((c, i) => (
                <li key={`${c.course}-${i}`} className="flex items-center gap-3 py-3">
                  <IconTile>
                    <BookOpen className="h-5 w-5" />
                  </IconTile>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{c.course}</p>
                    <p className="truncate text-xs text-slate-500">{c.university}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{c.date}</span>
                </li>
              ))}
            </ul>
          )}
        </PortalCard>

        {/* Document Requests */}
        <PortalCard title="Document Requests" subtitle="Latest Document Requested">
          <PortalListHead left="Document" right="Status" />
          {documentRequests.length === 0 ? (
            <PortalEmpty text="No documents requested." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {documentRequests.map((d) => (
                <li key={d.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{d.document}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{d.applicationRef}</p>
                    <p className="text-xs text-slate-400">Date Requested: {d.requestedAt}</p>
                  </div>
                  <StatusPill label={d.status} color={documentStatusColor(d.status)} />
                </li>
              ))}
            </ul>
          )}
        </PortalCard>

        {/* My Applications */}
        <PortalCard title="My Applications" subtitle="University Application" viewAllTo="/portal/applications">
          <PortalListHead left="Application" right="Status" />
          {applications.length === 0 ? (
            <PortalEmpty text="No applications yet." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {applications.map((a) => {
                const bg = avatarColor(a.university)
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{ backgroundColor: bg, color: pickTextColor(bg) }}
                      >
                        {initials(a.university)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{a.university}</p>
                        <p className="truncate text-xs text-slate-500">{a.course}</p>
                      </div>
                    </div>
                    <StatusPill label={a.status} color={a.statusColor} />
                  </li>
                )
              })}
            </ul>
          )}
        </PortalCard>

        {/* Fees / My Invoices */}
        <PortalCard title="Fees" subtitle="My Invoices" viewAllTo="/portal/fees">
          <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 border-b border-slate-200 pb-2 text-sm font-bold text-slate-600">
            <span>Invoice #</span>
            <span>Amount</span>
            <span className="justify-self-end">Status</span>
          </div>
          {invoices.length === 0 ? (
            <PortalEmpty text="No invoices yet." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <li key={inv.id} className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 py-3">
                  <span className="text-sm font-semibold text-slate-800">{inv.invoiceNo}</span>
                  <span className="text-sm text-slate-600">
                    {formatMoney(inv.currency, inv.grandTotal)}
                  </span>
                  <span className="justify-self-end">
                    <StatusPill label={inv.status} color={invoiceStatusColor(inv.status)} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PortalCard>

        {/* Additional Services */}
        <PortalCard title="Additional Services" subtitle="Additional Services" viewAllTo="/portal/services">
          <PortalListHead left="Application" right="Status" />
          {services.length === 0 ? (
            <PortalEmpty text="No service requests yet." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {services.map((sv) => (
                <li key={sv.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <IconTile>
                      <ClipboardList className="h-5 w-5" />
                    </IconTile>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{sv.service}</p>
                      <p className="truncate text-xs text-slate-500">{sv.country}</p>
                    </div>
                  </div>
                  <StatusPill label={sv.status} color={sv.statusColor} />
                </li>
              ))}
            </ul>
          )}
        </PortalCard>
      </div>
    </div>
  )
}
