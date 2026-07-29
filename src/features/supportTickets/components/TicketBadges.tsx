import type { TicketPriority, TicketStatus } from '../../../mock/supportTickets'

/**
 * Soft status/priority pills. Colours are fixed class pairs (bg + text) so they
 * pass WCAG AA and match the badge styling used across the app — no raw hex, no
 * dynamically-built class names that Tailwind would purge.
 */
const STATUS_CLASS: Record<TicketStatus, string> = {
  Open: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Closed: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

const PRIORITY_CLASS: Record<TicketPriority, string> = {
  High: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Low: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex min-w-[5rem] items-center justify-center whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold leading-5 ring-1 ring-inset ${STATUS_CLASS[status]}`}
    >
      {status}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${PRIORITY_CLASS[priority]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {priority}
    </span>
  )
}
