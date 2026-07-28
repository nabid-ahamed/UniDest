import { Briefcase, PlusCircle, MapPin, Eye } from 'lucide-react'
import { pickTextColor } from '../../../lib/contrast'
import { serviceRequests } from '../../../mock/services'
import { serviceStatusColor } from '../../../mock/student/portal'
import type { Student } from '../../../mock/students'

/**
 * "Services" tab on the student detail page — the additional-service requests
 * raised for this student, read live from the shared `services` module (matched
 * by email/name, same rule the portal uses). Cards link to the existing service
 * detail page; "Create Service" jumps to the Additional Services module. No
 * duplicate service UI. Mirrors the reference: heading + Create + card list.
 */
export function StudentServicesTab({ student }: { student: Student }) {
  const rows = serviceRequests.filter(
    (r) => r.studentEmail === student.email || r.studentName === student.name,
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header>
          <h2 className="text-xl font-bold text-slate-800">Service Requests</h2>
          <p className="mt-1 text-sm text-slate-500">
            Select a service request below to view details, tracker, and actions.
          </p>
        </header>
        <a
          href="/services"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <PlusCircle className="h-4 w-4" /> Create Service
        </a>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 py-16 text-center">
          <Briefcase className="h-9 w-9 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No Service Requests Found</p>
          <p className="text-sm text-slate-400">
            Click <span className="font-medium text-slate-600">Create Service</span> to add a new
            service request for this student.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {rows.map((req) => (
            <a
              key={req.id}
              href={`/services/${req.id}`}
              className="group flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800 group-hover:text-brand-700">
                    {req.service}
                  </p>
                  <p className="text-xs tabular-nums text-slate-500">
                    Request #{req.id} · {req.dateCreated}
                  </p>
                </div>
                {req.status ? (
                  <span
                    className="shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: serviceStatusColor(req.status),
                      color: pickTextColor(serviceStatusColor(req.status)),
                    }}
                  >
                    {req.status}
                  </span>
                ) : (
                  <span className="shrink-0 whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                    No Status
                  </span>
                )}
              </div>

              <p className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {req.country}
              </p>
              {req.description && (
                <p className="line-clamp-2 text-xs text-slate-500">{req.description}</p>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-500">Assigned: {req.assignedTo ?? 'Unassigned'}</span>
                <span className="inline-flex items-center gap-1 font-semibold text-brand-600 group-hover:text-brand-700">
                  <Eye className="h-3.5 w-3.5" /> View
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
