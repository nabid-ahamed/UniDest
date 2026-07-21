import { Pencil, UserPlus, Eye, User } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { pickTextColor } from '../../../lib/contrast'
import type { Application } from '../../../mock/applications'

export function ApplicationRow({
  app,
  assignedTo,
  selected,
  onToggle,
  onAction,
}: {
  app: Application
  assignedTo: string | null
  selected: boolean
  onToggle: () => void
  onAction: (type: string) => void
}) {
  return (
    <tr
      className={cn(
        'border-b border-slate-100 align-top transition-colors',
        selected ? 'bg-brand-50' : 'hover:bg-slate-50/70',
      )}
    >
      {/* Select — carries the left accent bar for the selected state */}
      <td
        className={cn(
          'px-3 py-3',
          selected ? 'border-l-2 border-l-brand-600' : 'border-l-2 border-l-transparent',
        )}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select application ${app.id}`}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
      </td>

      {/* ID */}
      <td className="px-3 py-3 text-sm font-medium tabular-nums text-slate-700">{app.id}</td>

      {/* Date Created */}
      <td className="px-3 py-3 text-sm tabular-nums text-slate-500">{app.dateCreated}</td>

      {/* Student */}
      <td className="px-3 py-3">
        <button
          type="button"
          onClick={() => onAction('View')}
          className="text-left text-sm font-bold text-slate-900 hover:text-brand-600 hover:underline"
        >
          {app.student}
        </button>
        <p className="text-xs tabular-nums text-slate-500">{app.studentNo}</p>
      </td>

      {/* Country */}
      <td className="px-3 py-3 text-sm text-slate-700">{app.country}</td>

      {/* Details — University / Course / Intake / agent / channel */}
      <td className="px-3 py-3">
        <div className="space-y-0.5 text-xs">
          <p>
            <span className="text-slate-500">University:</span>{' '}
            <span className="font-medium text-slate-700">{app.university}</span>
          </p>
          <p>
            <span className="text-slate-500">Course:</span>{' '}
            <span className="text-slate-700">{app.course}</span>
          </p>
          <p>
            <span className="text-slate-500">Intake:</span>{' '}
            <span className="text-slate-700">{app.intake}</span>
          </p>
          {app.agent && (
            <p className="inline-flex items-center gap-1 text-slate-700">
              <User className="h-3.5 w-3.5 text-slate-400" />
              {app.agent}
            </p>
          )}
          <p>
            <span className="text-slate-500">Applied Through:</span>{' '}
            <span className="font-semibold text-slate-800">{app.appliedThrough}</span>
          </p>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className="rounded-md px-2 py-1 text-xs font-semibold"
            style={{ backgroundColor: app.statusColor, color: pickTextColor(app.statusColor) }}
          >
            {app.status}
          </span>
          <button
            type="button"
            onClick={() => onAction('Edit status')}
            aria-label="Edit status"
            title="Edit status"
            className="text-brand-600 hover:text-brand-700"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>

      {/* Assigned to */}
      <td className="px-3 py-3">
        {assignedTo ? (
          <button
            type="button"
            onClick={() => onAction('Assign')}
            title="Re-assign"
            className="text-sm font-medium text-slate-700 hover:text-brand-600 hover:underline"
          >
            {assignedTo}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAction('Assign')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700"
          >
            Unassigned
            <UserPlus className="h-4 w-4" />
          </button>
        )}
      </td>

      {/* Actions — assign icon + a labelled View button, per the reference */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onAction('Assign')}
            aria-label="Assign"
            title="Assign"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-brand-300 text-brand-600 transition-colors hover:bg-brand-50"
          >
            <UserPlus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onAction('View')}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </button>
        </div>
      </td>
    </tr>
  )
}
