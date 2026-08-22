import { useEffect, useRef, useState } from 'react'
import {
  Pencil,
  UserPlus,
  Eye,
  User,
  EllipsisVertical,
  ChevronDown,
  Trash2,
} from 'lucide-react'
import { cn } from '../../../lib/cn'
import { pickTextColor } from '../../../lib/contrast'
import { HighlightMatch } from '../../../components/ui/HighlightMatch'
import { applicationStatuses, type Application } from '../../../mock/applications'

export function ApplicationRow({
  app,
  assignedTo,
  selected,
  highlight = '',
  onToggle,
  onAction,
}: {
  app: Application
  assignedTo: string | null
  selected: boolean
  /** The active table-search query; matches in the searched fields are marked. */
  highlight?: string
  onToggle: () => void
  onAction: (type: string, payload?: string) => void
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
      <td className="px-3 py-3 text-sm font-medium tabular-nums text-slate-700">
        <HighlightMatch text={String(app.id)} query={highlight} />
      </td>

      {/* Date Created */}
      <td className="px-3 py-3 text-sm tabular-nums text-slate-500">{app.dateCreated}</td>

      {/* Student */}
      <td className="px-3 py-3">
        <button
          type="button"
          onClick={() => onAction('View')}
          className="text-left text-sm font-bold text-slate-900 hover:text-brand-600 hover:underline"
        >
          <HighlightMatch text={app.student} query={highlight} />
        </button>
        <p className="text-xs tabular-nums text-slate-500">
          <HighlightMatch text={app.studentNo} query={highlight} />
        </p>
      </td>

      {/* Country */}
      <td className="px-3 py-3 text-sm text-slate-700">
        <HighlightMatch text={app.country} query={highlight} />
      </td>

      {/* Details — University / Course / Intake / agent / channel */}
      <td className="px-3 py-3">
        <div className="space-y-0.5 text-xs">
          <p>
            <span className="text-slate-500">University:</span>{' '}
            <span className="font-medium text-slate-700">
              <HighlightMatch text={app.university} query={highlight} />
            </span>
          </p>
          <p>
            <span className="text-slate-500">Course:</span>{' '}
            <span className="text-slate-700">
              <HighlightMatch text={app.course} query={highlight} />
            </span>
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

      {/* Status — uniform pill: single line, centered, shared min-width so the
          column reads consistently regardless of label length. The pencil opens
          an inline "Change Status to" menu. */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex min-w-[7.5rem] items-center justify-center whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold leading-5"
            style={{ backgroundColor: app.statusColor, color: pickTextColor(app.statusColor) }}
          >
            {app.status}
          </span>
          <StatusMenu current={app.status} onPick={(label) => onAction('SetStatus', label)} />
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

      {/* Actions — a labelled View button and a 3-dot menu (assign lives in the
          Assigned To column and the 3-dot menu, so no separate assign icon here) */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onAction('View')}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </button>
          <MoreMenu onAction={onAction} />
        </div>
      </td>
    </tr>
  )
}

/** Red-accented 3-dot trigger opening the secondary row actions. */
function MoreMenu({ onAction }: { onAction: (type: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const ITEMS = [
    { label: 'Assign Staff', icon: UserPlus, type: 'Assign' },
    { label: 'Delete', icon: Trash2, type: 'Delete', danger: true },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        aria-expanded={open}
        className={cn(
          'flex h-7 items-center justify-center gap-0.5 rounded-md border border-rose-300 px-1.5 transition-colors',
          open ? 'bg-rose-50' : 'hover:bg-rose-50',
        )}
      >
        <EllipsisVertical className="h-3.5 w-3.5 text-slate-700" />
        <ChevronDown className="h-3 w-3 text-rose-600" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-40 rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg">
          {ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setOpen(false)
                onAction(item.type)
              }}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium transition-colors',
                item.danger
                  ? 'text-rose-600 hover:bg-rose-50'
                  : 'text-slate-700 hover:bg-brand-50 hover:text-brand-700',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Pencil trigger + "Change Status to" dropdown (same pattern as Students). */
function StatusMenu({ current, onPick }: { current: string; onPick: (status: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Edit status"
        title="Edit status"
        className="text-brand-600 hover:text-brand-700"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-60 rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg">
          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Change Status to
          </p>
          {applicationStatuses.map((st) => (
            <button
              key={st.label}
              type="button"
              onClick={() => {
                setOpen(false)
                if (st.label !== current) onPick(st.label)
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50',
                st.label === current ? 'font-semibold text-brand-700' : 'text-slate-700',
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: st.color }} />
              {st.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
