import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { showSuccessDialog } from '../../store/successDialog'
import { createPortal } from 'react-dom'
import { ArrowLeft, Send, Trash2, User, Headset, Clock, Tag } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { AssignStaffDialog } from '../leads/components/AssignStaffDialog'
import { useAuth } from '../../store/auth'
import {
  getTicket,
  ticketStatuses,
  ticketPriorities,
  ticketStaff,
  setTicketStatus,
  setTicketPriority,
  setTicketAssignee,
  addTicketReply,
  deleteTicket,
  type TicketStatus,
  type TicketPriority,
} from '../../mock/supportTickets'
import { StatusBadge, PriorityBadge } from './components/TicketBadges'

/** "dd Mon yyyy · h:mm AM" — same display style as the seeded thread. */
function nowStamp() {
  const d = new Date()
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} · ${time}`
}

export default function SupportTicketViewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const admin = useAuth((s) => s.user)
  const ticket = getTicket(Number(id))

  const [reply, setReply] = useState('')
  const [assignOpen, setAssignOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [rev, setRev] = useState(0)
  const bump = () => setRev((n) => n + 1)

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2500)
  }

  // Read the (possibly mutated) thread whenever we bump.
  const messages = useMemo(() => ticket?.messages ?? [], [ticket, rev])

  if (!ticket) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-slate-500">Ticket not found.</p>
        <a
          href="/support-tickets"
          className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Back to Support Tickets
        </a>
      </div>
    )
  }

  const sendReply = () => {
    const body = reply.trim()
    if (!body) return
    addTicketReply(ticket.id, admin?.name || 'Admin', body, nowStamp())
    // Replying to an open/pending ticket moves it to Pending (awaiting requester).
    if (ticket.status === 'Open') setTicketStatus(ticket.id, 'Pending')
    setReply('')
    bump()
    showToast('Reply sent')
  }

  const changeStatus = (status: TicketStatus) => {
    setTicketStatus(ticket.id, status)
    bump()
    showToast(`Status → ${status}`)
  }

  const changePriority = (priority: TicketPriority) => {
    setTicketPriority(ticket.id, priority)
    bump()
    showToast(`Priority → ${priority}`)
  }

  const saveAssignee = (member: string) => {
    setTicketAssignee(ticket.id, member)
    bump()
    setAssignOpen(false)
    showToast(`Assigned to ${member}`)
  }

  const confirmDelete = () => {
    deleteTicket(ticket.id)
    setDeleteOpen(false)
    showSuccessDialog(`Ticket #${ticket.id} deleted successfully`)
    navigate('/support-tickets')
  }

  return (
    <div className="space-y-4">
      {/* Back */}
      <button
        onClick={() => navigate('/support-tickets')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Support Tickets
      </button>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Conversation */}
        <div className="space-y-4 lg:col-span-2">
          {/* Header card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Ticket #{ticket.id}
                </p>
                <h1 className="mt-1 text-xl font-bold text-slate-900">{ticket.subject}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" /> {ticket.category}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Created {ticket.created}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
            </div>
          </div>

          {/* Thread */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-sm font-bold text-slate-800">Conversation</h2>
            </div>
            <ul className="space-y-4 p-6">
              {messages.map((msg) => (
                <li
                  key={msg.id}
                  className={cn('flex gap-3', msg.fromStaff && 'flex-row-reverse text-right')}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      msg.fromStaff ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {msg.fromStaff ? <Headset className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </span>
                  <div className={cn('min-w-0 max-w-[85%]', msg.fromStaff && 'items-end')}>
                    <p className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-600">{msg.author}</span> · {msg.at}
                    </p>
                    <div
                      className={cn(
                        'mt-1 inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                        msg.fromStaff
                          ? 'rounded-tr-sm bg-brand-600 text-white'
                          : 'rounded-tl-sm bg-slate-100 text-slate-700',
                      )}
                    >
                      {msg.body}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Reply box */}
            <div className="border-t border-slate-100 p-4">
              {ticket.status === 'Closed' ? (
                <p className="rounded-lg bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
                  This ticket is closed.{' '}
                  <button
                    onClick={() => changeStatus('Open')}
                    className="font-semibold text-brand-600 hover:underline"
                  >
                    Re-open to reply
                  </button>
                </p>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={3}
                    placeholder="Write a reply to the requester…"
                    aria-label="Reply"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={sendReply}
                      disabled={!reply.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" /> Send Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Requester */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800">Requester</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <User className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800">{ticket.requester}</p>
                <p className="text-xs tabular-nums text-slate-500">{ticket.requesterNo}</p>
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Type</dt>
                <dd
                  className={cn(
                    'rounded px-1.5 py-0.5 text-xs font-bold uppercase',
                    ticket.requesterKind === 'Student'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-blue-50 text-blue-700',
                  )}
                >
                  {ticket.requesterKind}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Branch</dt>
                <dd className="font-medium text-slate-700">{ticket.branch}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Last updated</dt>
                <dd className="tabular-nums text-slate-700">{ticket.updated}</dd>
              </div>
            </dl>
          </div>

          {/* Manage */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <h2 className="bg-brand-600 px-5 py-3 text-sm font-bold text-white">Manage Ticket</h2>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </label>
                <select
                  value={ticket.status}
                  onChange={(e) => changeStatus(e.target.value as TicketStatus)}
                  className="input"
                >
                  {ticketStatuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Priority
                </label>
                <select
                  value={ticket.priority}
                  onChange={(e) => changePriority(e.target.value as TicketPriority)}
                  className="input"
                >
                  {ticketPriorities.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Assigned To
                </label>
                <button
                  onClick={() => setAssignOpen(true)}
                  className="input flex w-full items-center justify-between text-left"
                >
                  <span className={ticket.assignedTo ? 'text-slate-700' : 'text-rose-600'}>
                    {ticket.assignedTo ?? 'Unassigned'}
                  </span>
                  <span className="text-xs font-semibold text-brand-600">Change</span>
                </button>
              </div>

              <button
                onClick={() => setDeleteOpen(true)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" /> Delete Ticket
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assign staff */}
      {assignOpen && (
        <AssignStaffDialog
          lead={{ id: ticket.id, name: ticket.requester }}
          title="Ticket - Assign Staff"
          nameLabel="Requester"
          assignedTo={ticket.assignedTo}
          staff={ticketStaff()}
          onClose={() => setAssignOpen(false)}
          onSave={saveAssignee}
        />
      )}

      {/* Delete */}
      {deleteOpen &&
        createPortal(
          <ConfirmDialog
            open
            title="Delete this ticket?"
            message={
              <>
                Ticket <span className="font-medium text-slate-700">#{ticket.id}</span> (
                {ticket.subject}) will be removed permanently.
              </>
            }
            confirmLabel="Delete"
            onConfirm={confirmDelete}
            onCancel={() => setDeleteOpen(false)}
          />,
          document.body,
        )}

      {/* Toast */}
      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[60] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
