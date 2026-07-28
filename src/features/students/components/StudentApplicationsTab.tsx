import { FolderOpen, Building2, MapPin, Eye, GraduationCap } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { pickTextColor } from '../../../lib/contrast'
import { applications } from '../../../mock/applications'
import type { Student } from '../../../mock/students'

/**
 * "Applications" tab on the student detail page — the university applications
 * this student has, read live from the shared `applications` module (filtered
 * by studentNo). Each card links to the existing application detail page, so
 * there's no duplicate application UI. Mirrors the reference layout: a heading
 * + subtitle, then a card list (or an empty state).
 */
export function StudentApplicationsTab({ student }: { student: Student }) {
  const rows = applications.filter((a) => a.studentNo === student.studentNo)

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-slate-800">University Applications</h2>
        <p className="mt-1 text-sm text-slate-500">
          Select an application below to view details, tracker, and actions.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 py-16 text-center">
          <FolderOpen className="h-9 w-9 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No University Applications Found</p>
          <p className="text-sm text-slate-400">
            Go to the <span className="font-medium text-slate-600">Course Preferences</span> tab to
            create an application from an existing preference.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {rows.map((app) => (
            <a
              key={app.id}
              href={`/applications/${app.id}`}
              className="group flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800 group-hover:text-brand-700">
                    {app.university}
                  </p>
                  <p className="text-xs tabular-nums text-slate-500">
                    Application #{app.id} · {app.dateCreated}
                  </p>
                </div>
                <span
                  className="shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold"
                  style={{ backgroundColor: app.statusColor, color: pickTextColor(app.statusColor) }}
                >
                  {app.status}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <p className="inline-flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                  {app.course}
                </p>
                <p className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {app.country}
                </p>
                <p className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  Intake: {app.intake} · {app.appliedThrough}
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-500">
                  Assigned: {app.assignedTo ?? 'Unassigned'}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 font-semibold text-brand-600',
                    'group-hover:text-brand-700',
                  )}
                >
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
