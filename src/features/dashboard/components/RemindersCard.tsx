import { AlertCircle, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Reminder } from '../../../mock/dashboard'
import { cn } from '../../../lib/cn'

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function RemindersCard({ reminders }: { reminders: Reminder[] }) {
  const navigate = useNavigate()

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">
          University/Visa Application Reminders
        </h3>
        <span className="text-xs font-medium text-slate-500">{reminders.length} Reminder(s)</span>
      </div>

      {reminders.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-slate-500">
          No application reminders for this branch.
        </p>
      ) : (
        <ul className="max-h-64 snap-y snap-mandatory divide-y divide-slate-100 overflow-y-auto">
          {reminders.map((r) => (
            <li key={r.id} className="snap-start">
              <button
                type="button"
                onClick={() => navigate(r.href)}
                className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                  {initials(r.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-semibold text-slate-800 group-hover:text-brand-700">
                    <span className="truncate">
                      {r.name} — University Application #{r.applicationNo}
                    </span>
                    {r.overdue && (
                      <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                        Overdue
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-xs text-slate-500">
                    <span className={cn('font-medium', r.overdue ? 'text-rose-600' : 'text-slate-500')}>
                      Deadline: {r.deadline}
                    </span>
                    <AlertCircle className={cn('h-3 w-3', r.overdue ? 'text-rose-500' : 'text-amber-500')} />
                    <span>- {r.owner} -</span>
                    <span className="font-medium text-slate-600">Activity: {r.activity}</span>
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-brand-500" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
