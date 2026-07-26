import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { StatusPill } from './components/StatusPill'
import { myApplications } from '../../mock/student/portal'

/**
 * "My University Applications" — the student's own applications, derived live
 * from the admin `applications` module (filtered to the signed-in student via
 * `myApplications()`). Matches demo.eductrl.com/cn4/applications.
 */
export default function StudentApplicationsPage() {
  const navigate = useNavigate()
  const apps = myApplications()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">My University Applications</h1>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-brand-600 px-6 py-4 text-lg font-bold text-white">University Applications</div>

        {apps.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">
            You have no university applications yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm font-semibold text-slate-600">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Country</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 text-sm odd:bg-slate-50/60">
                    <td className="px-6 py-5 align-top font-semibold tabular-nums text-slate-700">{a.id}</td>
                    <td className="px-6 py-5 align-top text-slate-700">{a.country}</td>
                    <td className="px-6 py-5 align-top text-slate-600 [overflow-wrap:anywhere]">
                      <p><span className="font-semibold text-slate-700">University:</span> {a.university}</p>
                      <p><span className="font-semibold text-slate-700">Course:</span> {a.course}</p>
                      <p><span className="font-semibold text-slate-700">Intake:</span> {a.intake}</p>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <StatusPill label={a.status} color={a.statusColor} />
                    </td>
                    <td className="px-6 py-5 align-top">
                      <button
                        type="button"
                        onClick={() => navigate(`/portal/applications/${a.id}`)}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                      >
                        Details <ArrowRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
