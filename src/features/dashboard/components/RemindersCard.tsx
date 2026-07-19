import { AlertCircle } from 'lucide-react'
import { applicationReminders, reminderCount } from '../../../mock/dashboard'

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function RemindersCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">
          University/Visa Application Reminders
        </h3>
        <span className="text-xs font-medium text-slate-400">{reminderCount} Reminder(s)</span>
      </div>

      <ul className="max-h-64 snap-y snap-mandatory divide-y divide-slate-100 overflow-y-auto">
        {applicationReminders.map((r) => (
          <li key={r.id} className="flex snap-start gap-3 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
              {initials(r.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {r.name} — University Application #{r.applicationNo}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-xs text-slate-500">
                <span>Deadline: {r.deadline}</span>
                <AlertCircle className="h-3 w-3 text-amber-500" />
                <span>- {r.owner} -</span>
                <span className="font-medium text-slate-600">Activity: {r.activity}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
