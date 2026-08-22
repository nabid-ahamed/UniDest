import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useServiceRequests, useServiceStatuses } from '../../lib/api'

/**
 * Additional Services for an agent.
 *
 * The list is scoped server-side to students this agent referred, so there is
 * no owner filter here — the search and status controls only narrow what the
 * API already decided this agent may see.
 */
export default function AgentServicesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const { data: rows = [], isPending } = useServiceRequests()
  const { data: statuses = [] } = useServiceStatuses()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (status && r.status !== status) return false
      if (!q) return true
      return `${r.studentName} ${r.service} ${r.country} ${r.description}`.toLowerCase().includes(q)
    })
  }, [rows, search, status])

  return (
    <section className="mx-auto max-w-6xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h1 className="text-xl font-bold text-slate-900">Additional Services</h1>
      <p className="mt-1 text-sm text-slate-500">
        Service requests linked to your referred students.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, service or country..."
            className="input w-full pl-9"
            aria-label="Search service requests"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s.label}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  Loading service requests…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  {rows.length === 0
                    ? 'No additional service requests yet.'
                    : 'No requests match these filters.'}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 align-top text-sm">
                  <td className="px-4 py-4 font-semibold text-slate-800">
                    {r.studentName}
                    <p className="text-xs font-normal text-slate-500">{r.studentNo}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {r.service}
                    {r.description && (
                      <p className="text-xs text-slate-500 [overflow-wrap:anywhere]">
                        {r.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{r.country || '—'}</td>
                  <td className="px-4 py-4">
                    <span
                      className="inline-block rounded-md px-2 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: r.statusColor }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-600">{r.dateCreated}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
