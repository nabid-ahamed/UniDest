import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { StatusPill } from './components/StatusPill'
import { useServiceRequests } from '../../lib/api'

/**
 * "Additional Services" — the student's own service/visa requests.
 *
 * The list is scoped server-side to the caller's student record, so no filter
 * is applied here: a client-side owner check against a shared list would not be
 * a guard at all. Matches demo.eductrl.com/cn4/service-and-visa/applications.
 */
export default function StudentServicesPage() {
  const navigate = useNavigate()
  const { data: services = [], isPending } = useServiceRequests()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">Additional Services</h1>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-brand-600 px-6 py-4 text-lg font-bold text-white">Additional Services</div>

        {isPending ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">Loading services…</div>
        ) : services.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">
            You have no service requests yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm font-semibold text-slate-600">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Country</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {services.map((sv) => (
                  <tr key={sv.id} className="border-b border-slate-100 text-sm odd:bg-slate-50/60">
                    <td className="px-6 py-5 align-top font-semibold tabular-nums text-slate-700">{sv.id}</td>
                    <td className="px-6 py-5 align-top text-slate-700">{sv.service}</td>
                    <td className="px-6 py-5 align-top text-slate-600">{sv.country || '--'}</td>
                    <td className="px-6 py-5 align-top text-slate-600">--</td>
                    <td className="px-6 py-5 align-top text-slate-600 [overflow-wrap:anywhere]">
                      {sv.description || '--'}
                    </td>
                    <td className="px-6 py-5 align-top">
                      <StatusPill label={sv.status} color={sv.statusColor} />
                    </td>
                    <td className="px-6 py-5 align-top">
                      <button
                        type="button"
                        onClick={() => navigate(`/portal/services/${sv.id}`)}
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
