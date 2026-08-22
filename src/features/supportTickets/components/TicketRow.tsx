import { useEffect, useRef, useState } from 'react'
import {
  Pencil,
  UserPlus,
  Eye,
  EllipsisVertical,
  ChevronDown,
  Trash2,
  MessageSquare,
} from 'lucide-react'
import { cn } from '../../../lib/cn'
import {
  ticketStatuses,
  ticketPriorities,
  type Ticket,
  type TicketStatus,
  type TicketPriority,
} from '../../../mock/supportTickets'
import { HighlightMatch } from '../../../components/ui/HighlightMatch'
import { StatusBadge, PriorityBadge } from './TicketBadges'

export function TicketRow({
  ticket,
  selected,
  highlight = '',
  onToggle,
  onAction,
}: {
  ticket: Ticket
  selected: boolean
  /** The active table-search query; matches in the searched fields are marked. */
  highlight?: string
  onToggle: () => void
  onAction: (type: string, payload?: string) => void
}) {
  const lastMsg = ticket.messages[ticket.messages.length - 1]

  return (
    <tr
      className={cn(
        'border-b border-slate-100 align-top transition-colors',
        selected ? 'bg-brand-50' : 'hover:bg-slate-50/70',
      )}
    >
      {/* Select */}
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
          aria-label={`Select ticket ${ticket.id}`}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
      </td>

      {/* ID */}
      <td className="px-3 py-3 text-sm font-medium tabular-nums text-slate-700">#<HighlightMatch text={String(ticket.id)} query={highlight} /></td>

      {/* Subject + category + last message */}
      <td className="px-3 py-3">
        <button
          type="button"
          onClick={() => onAction('View')}
          className="text-left text-sm font-bold text-slate-900 hover:text-brand-600 hover:underline"
        >
          <HighlightMatch text={ticket.subject} query={highlight} />
        </button>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
            <HighlightMatch text={ticket.category} query={highlight} />
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {ticket.messages.length}
          </span>
        </p>
        {lastMsg && (
          <p className="mt-1 line-clamp-1 max-w-[22rem] text-xs text-slate-400">{lastMsg.body}</p>
        )}
      </td>

      {/* Requester */}
      <td className="px-3 py-3">
        <p className="text-sm font-semibold text-slate-800">
          <HighlightMatch text={ticket.requester} query={highlight} />
        </p>
        <p className="text-xs tabular-nums text-slate-500">
          <HighlightMatch text={ticket.requesterNo} query={highlight} />
        </p>
        <span
          className={cn(
            'mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
            ticket.requesterKind === 'Student'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-blue-50 text-blue-700',
          )}
        >
          {ticket.requesterKind}
        </span>
      </td>

      {/* Priority */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <PriorityBadge priority={ticket.priority} />
          <PickerMenu
            label="Change priority"
            title="Change Priority to"
            options={ticketPriorities}
            current={ticket.priority}
            onPick={(p) => onAction('SetPriority', p as TicketPriority)}
          />
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <StatusBadge status={ticket.status} />
          <PickerMenu
            label="Change status"
            title="Change Status to"
            options={ticketStatuses}
            current={ticket.status}
            onPick={(s) => onAction('SetStatus', s as TicketStatus)}
          />
        </div>
      </td>

      {/* Assigned to */}
      <td className="px-3 py-3">
        {ticket.assignedTo ? (
          <button
            type="button"
            onClick={() => onAction('Assign')}
            title="Re-assign"
            className="text-sm font-medium text-slate-700 hover:text-brand-600 hover:underline"
          >
            {ticket.assignedTo}
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
        <p className="mt-1 text-xs tabular-nums text-slate-400">Updated {ticket.updated}</p>
      </td>

      {/* Actions */}
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

/** Red-accented 3-dot trigger opening secondary row actions. */
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

/** Pencil trigger + a "Change X to" dropdown (same pattern as the Applications row). */
function PickerMenu({
  label,
  title,
  options,
  current,
  onPick,
}: {
  label: string
  title: string
  options: readonly string[]
  current: string
  onPick: (value: string) => void
}) {
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
        aria-label={label}
        title={label}
        className="text-brand-600 hover:text-brand-700"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-52 rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg">
          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                setOpen(false)
                if (opt !== current) onPick(opt)
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50',
                opt === current ? 'font-semibold text-brand-700' : 'text-slate-700',
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
