import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Undo2, CalendarDays, MapPin, Mail, Phone, UsersRound } from 'lucide-react'
import { cn } from '../../lib/cn'
import { DotsLoader } from '../../components/DataTableUI'
import { webinars, webinarEnrollments } from '../../mock/webinars'

/** Enrolled-users list for one webinar (route /webinars/:id/enrolled). */
export default function WebinarEnrolledPage() {
  const { id } = useParams()
  const webinar = webinars.find((w) => w.id === Number(id))
  const [loading, setLoading] = useState(true)

  // Initial "fetch" preloader on mount.
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 700)
    return () => window.clearTimeout(t)
  }, [])

  if (!webinar) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-slate-500">Webinar not found.</p>
        <a
          href="/webinars"
          className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Back to Webinar &amp; Events
        </a>
      </div>
    )
  }

  const rows = webinarEnrollments(webinar)

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-4 py-5 sm:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900">Enrolled Users</h1>
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-600 px-2 text-xs font-bold text-white">
              {rows.length}
            </span>
          </div>
          <p className="mt-1 font-medium text-slate-700">{webinar.topic}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              {webinar.date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-400" />
              {webinar.venue}
            </span>
          </p>
        </div>
        <a
          href="/webinars"
          aria-label="Back to Webinar & Events"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700"
        >
          <Undo2 className="h-4 w-4" />
        </a>
      </div>

      {/* Table */}
      <div className="overflow-x-auto px-4 pb-5 sm:px-6 xl:overflow-x-visible">
        <table className="w-full min-w-[720px] border border-slate-200">
          <thead>
            <tr className="border-b border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">User Type</th>
              <th className="px-4 py-3">Enrolled On</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-16">
                  <DotsLoader />
                </td>
              </tr>
            ) : rows.length > 0 ? (
              rows.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-slate-100 text-sm odd:bg-slate-50/70 hover:bg-brand-50/40"
                >
                  <td className="px-4 py-3 tabular-nums text-slate-500">{u.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="inline-flex items-center gap-1.5 [overflow-wrap:anywhere]">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {u.email}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {u.phone}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-md border px-2 py-0.5 text-xs font-medium',
                        u.userType === 'Agent'
                          ? 'border-violet-200 bg-violet-50 text-violet-700'
                          : 'border-cyan-200 bg-cyan-50 text-cyan-800',
                      )}
                    >
                      {u.userType}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-600">
                    {u.enrolledOn}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center">
                  <UsersRound className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
                  <p className="mt-3 text-sm text-slate-500">No users have enrolled yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
