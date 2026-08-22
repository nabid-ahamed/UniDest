import { useEffect, useRef, useState } from 'react'
import {
  Tag,
  Plus,
  X,
  Mail,
  Phone,
  SquarePen,
  ChevronDown,
  UserPlus,
  UserRound,
  Eye,
  Settings,
  Pencil,
  GitBranch,
  Trash2,
} from 'lucide-react'
import { cn } from '../../../lib/cn'
import { pickTextColor } from '../../../lib/contrast'
import { HighlightMatch } from '../../../components/ui/HighlightMatch'
import { type Lead } from '../../../mock/leads'
import { leadStatuses } from '../../../lib/constants'

export function LeadRow({
  lead,
  status,
  nextFollowup,
  tags,
  assignedTo,
  selected,
  highlight = '',
  onToggle,
  onAction,
  onRemoveTag,
  onChangeStatus,
}: {
  lead: Lead
  status: string
  nextFollowup: string | null
  tags: string[]
  assignedTo: string | null
  selected: boolean
  /** The active table-search query; matches in the searched fields are marked. */
  highlight?: string
  onToggle: () => void
  onAction: (type: string) => void
  onRemoveTag: (tag: string) => void
  onChangeStatus: (next: string) => void
}) {
  // Colour follows the current status; the seeded hex is only the fallback.
  const statusColor = leadStatuses.find((s) => s.label === status)?.color ?? lead.statusColor
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
          aria-label={`Select ${lead.name}`}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
      </td>

      {/* ID */}
      <td className="px-3 py-3 text-sm font-medium tabular-nums text-slate-700">
        <HighlightMatch text={String(lead.id)} query={highlight} />
      </td>

      {/* Lead — 3 compact tiers: identity+actions / details / meta */}
      <td className="px-3 py-3">
        <button
          type="button"
          onClick={() => onAction('View')}
          className="text-sm font-bold text-slate-900 hover:text-brand-600 hover:underline"
        >
          <HighlightMatch text={lead.name} query={highlight} />
        </button>

        {/* Tags — removable chips, then the add button */}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
            >
              {t}
              <button
                type="button"
                onClick={() => onRemoveTag(t)}
                aria-label={`Remove tag ${t}`}
                title={`Remove ${t}`}
                className="text-slate-500 hover:text-rose-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onAction('Add tag')}
            aria-label="Add tag"
            title="Add tag"
            className="rounded p-0.5 text-brand-600 hover:bg-brand-50 hover:text-brand-700"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* overflow-wrap:anywhere lets long emails break when the sidebar
            squeezes the table, instead of forcing the row past the card. */}
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 [overflow-wrap:anywhere]">
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            {lead.emailDate}
          </span>
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            <HighlightMatch text={lead.phone} query={highlight} />
            <span className="text-slate-400">· <HighlightMatch text={lead.phoneNote} query={highlight} /></span>
          </span>
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
            Lead Age: {lead.leadAgeDays} Days
          </span>
          <span className="rounded-md border border-pink-200 bg-pink-50 px-1.5 py-0.5 text-xs font-medium text-pink-700">
            {lead.branch}
          </span>
        </div>
      </td>

      {/* Next Followup */}
      <td className="px-3 py-3 text-sm text-slate-500">{nextFollowup ?? '—'}</td>

      {/* Status */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className="rounded-md px-2 py-1 text-xs font-semibold"
            style={{
              backgroundColor: statusColor,
              color: pickTextColor(statusColor),
            }}
          >
            {status}
          </span>
          <StatusMenu current={status} onSelect={onChangeStatus} />
        </div>
      </td>

      {/* Assigned to — owner name (or "Unassigned") with a person icon beside it.
          Clicking still opens the re-assign dialog. */}
      <td className="px-3 py-3">
        {assignedTo ? (
          <button
            type="button"
            onClick={() => onAction('Assign')}
            title="Re-assign"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-brand-600"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <UserRound className="h-3.5 w-3.5" />
            </span>
            <span className="group-hover:underline">{assignedTo}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAction('Assign')}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <UserPlus className="h-3.5 w-3.5" />
            </span>
            <span className="group-hover:underline">Unassigned</span>
          </button>
        )}
      </td>

      {/* Created */}
      <td className="px-3 py-3 text-sm text-slate-500">{lead.created}</td>

      {/* Actions */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <ActionIcon
            icon={UserPlus}
            label="Assign"
            onClick={() => onAction('Assign')}
            className="border-brand-300 text-brand-600 hover:border-brand-600 hover:bg-brand-600 hover:text-white"
          />
          <ActionIcon
            icon={Eye}
            label="View"
            onClick={() => onAction('View')}
            className="border-emerald-300 text-emerald-600 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
          />
          <SettingsMenu onAction={onAction} />
        </div>
      </td>
    </tr>
  )
}

/**
 * "Change Status to" dropdown behind the edit icon next to the status badge,
 * matching the reference: light-blue square with a pencil + caret.
 */
function StatusMenu({
  current,
  onSelect,
}: {
  current: string
  onSelect: (next: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change status"
        aria-expanded={open}
        title="Change status"
        className={cn(
          'flex h-7 items-center gap-0.5 rounded-md px-1.5 transition-colors',
          open
            ? 'bg-brand-600 text-white'
            : 'bg-brand-100 text-brand-600 hover:bg-brand-200',
        )}
      >
        <SquarePen className="h-3.5 w-3.5" />
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <p className="border-b border-slate-100 px-4 pb-2 pt-1.5 text-sm font-bold text-slate-800">
            Change Status to
          </p>
          {leadStatuses.map((s) => (
            <button
              key={s.label}
              type="button"
              // Re-selecting the current status is allowed: for Counseling it
              // re-opens the dialog so the counsellor/slot can be modified.
              onClick={() => {
                setOpen(false)
                onSelect(s.label)
              }}
              className={cn(
                'flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm hover:bg-brand-50',
                s.label === current ? 'font-semibold text-brand-600' : 'text-slate-700',
              )}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * The gear (Settings) action opens a dropdown:
 * Edit · Transfer Branch · Delete. Each item fires a distinct
 * onAction so LeadsPage can route it (navigate, modal or confirm).
 * (Leads have no login, so there's no password action here.)
 */
function SettingsMenu({ onAction }: { onAction: (type: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const items: { label: string; action: string; icon: typeof Pencil; danger?: boolean }[] = [
    { label: 'Edit', action: 'Edit', icon: Pencil },
    { label: 'Transfer Branch', action: 'Transfer Branch', icon: GitBranch },
    { label: 'Delete', action: 'Delete', icon: Trash2, danger: true },
  ]

  return (
    <div ref={ref} className="group relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Settings"
        aria-expanded={open}
        className={cn(
          'flex h-7 items-center gap-0.5 rounded-md border px-1.5 transition-colors',
          open
            ? 'border-rose-600 bg-rose-600 text-white'
            : 'border-rose-300 text-rose-600 hover:border-rose-600 hover:bg-rose-600 hover:text-white',
        )}
      >
        <Settings className="h-3.5 w-3.5" />
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {!open && (
        <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-slate-700 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          Settings
        </span>
      )}

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {items.map((it) => (
            <button
              key={it.action}
              type="button"
              onClick={() => {
                setOpen(false)
                onAction(it.action)
              }}
              className={cn(
                'flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm hover:bg-slate-50',
                it.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700',
              )}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ActionIcon({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: typeof Eye
  label: string
  onClick: () => void
  className?: string
}) {
  // Instant CSS tooltip — the native title attribute takes ~1s to appear.
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
          className,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
      <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-slate-700 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </div>
  )
}
