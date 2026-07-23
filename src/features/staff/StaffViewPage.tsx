import { useParams } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Pencil, Users, Contact, ClipboardList, CalendarDays } from 'lucide-react'
import { cn } from '../../lib/cn'
import { pickTextColor } from '../../lib/contrast'
import {
  getStaff,
  avatarColor,
  initials,
  workload,
  assignedLeads,
  assignedStudents,
  assignedApplications,
} from '../../mock/staff'

export default function StaffViewPage() {
  const { id } = useParams()
  const member = getStaff(Number(id))

  if (!member) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Staff member not found.</p>
        <a href="/staff" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Staff
        </a>
      </div>
    )
  }

  const w = workload(member.name)
  const bg = avatarColor(member.name)
  const leads = assignedLeads(member.name)
  const students = assignedStudents(member.name)
  const applications = assignedApplications(member.name)

  const cards = [
    { label: 'Assigned Leads', value: w.leads, icon: Users, color: 'text-sky-600 bg-sky-50' },
    { label: 'Assigned Students', value: w.students, icon: Contact, color: 'text-violet-600 bg-violet-50' },
    { label: 'Assigned Applications', value: w.applications, icon: ClipboardList, color: 'text-emerald-600 bg-emerald-50' },
  ]

  return (
    <div className="space-y-5">
      {/* Identity header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold"
              style={{ backgroundColor: bg, color: pickTextColor(bg) }}
              aria-hidden="true"
            >
              {initials(member.name)}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{member.name}</h1>
                <span
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-semibold',
                    member.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                  )}
                >
                  {member.status}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-600">
                {member.role} · {member.branch}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
                <a href={`mailto:${member.email}`} className="inline-flex items-center gap-1.5 hover:text-brand-600">
                  <Mail className="h-4 w-4 text-slate-400" /> {member.email}
                </a>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-slate-400" /> {member.phone || '—'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-slate-400" /> Joined {member.joined}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/staff/${member.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Pencil className="h-4 w-4" /> Edit
            </a>
            <a
              href="/staff"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </a>
          </div>
        </div>

        {/* Workload cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="flex items-center gap-4 rounded-xl border border-slate-200 p-4">
              <span className={cn('flex h-11 w-11 items-center justify-center rounded-lg', c.color)}>
                <c.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-bold tabular-nums text-slate-900">{c.value}</p>
                <p className="text-sm text-slate-500">{c.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assigned records */}
      <RecordTable
        title="Assigned Leads"
        emptyLabel="No leads assigned."
        headers={['Name', 'Status', 'Country', 'Created']}
        rows={leads.map((l) => ({
          href: `/leads/${l.id}`,
          cells: [l.name, l.status, l.countryInterested, l.created],
        }))}
      />
      <RecordTable
        title="Assigned Students"
        emptyLabel="No students assigned."
        headers={['Name', 'Status', 'Country', 'Created']}
        rows={students.map((s) => ({
          href: `/students/${s.id}`,
          cells: [s.name, s.status, s.countryInterested, s.created],
        }))}
      />
      <RecordTable
        title="Assigned Applications"
        emptyLabel="No applications assigned."
        headers={['Student', 'University', 'Status', 'Created']}
        rows={applications.map((a) => ({
          href: undefined,
          cells: [a.student, a.university ?? '—', a.status, a.dateCreated],
        }))}
      />
    </div>
  )
}

function RecordTable({
  title,
  emptyLabel,
  headers,
  rows,
}: {
  title: string
  emptyLabel: string
  headers: string[]
  rows: { href?: string; cells: string[] }[]
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-bold text-slate-900">
        {title} <span className="ml-1 text-sm font-semibold text-slate-400">({rows.length})</span>
      </h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              {headers.map((h) => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-slate-100 text-sm text-slate-600">
                {r.cells.map((c, j) => (
                  <td key={j} className="px-4 py-3">
                    {j === 0 && r.href ? (
                      <a href={r.href} className="font-semibold text-slate-800 hover:text-brand-600 hover:underline">
                        {c}
                      </a>
                    ) : j === 0 ? (
                      <span className="font-semibold text-slate-800">{c}</span>
                    ) : (
                      c
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-4 py-8 text-center text-sm text-slate-500">
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
