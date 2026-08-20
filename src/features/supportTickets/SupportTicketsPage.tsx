import { useEffect, useMemo, useState } from 'react'
import { showSuccessDialog } from '../../store/successDialog'
import { createPortal } from 'react-dom'
import { RefreshCw, Filter, Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ExportButtons } from '../../components/ExportButtons'
import { DotsLoader, Field, PageBtn } from '../../components/DataTableUI'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { AssignStaffDialog } from '../leads/components/AssignStaffDialog'
import type { Ticket, TicketStatus, TicketPriority } from '../../mock/supportTickets'
import {
  ticketStatuses,
  ticketPriorities,
  ticketCategories,
  ticketBulkActions,
  ticketBranches,
  ticketStaff,
} from '../../mock/supportTickets'
import { useTickets, useUpdateTicket, useDeleteTicket } from '../../lib/api'
import { TicketRow } from './components/TicketRow'

const PAGE_SIZES = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 1000, label: '100+' },
]

export default function SupportTicketsPage() {
  // Prefill the search box from ?q= (e.g. the student detail "View Support
  // Tickets" action deep-links here filtered to that requester).
  const initialQuery =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('q') ?? '' : ''
  const [search, setSearch] = useState(initialQuery)
  const [statuses, setStatuses] = useState('')
  const [priority, setPriority] = useState('')
  const [category, setCategory] = useState('')
  const [staff, setStaff] = useState('')
  const [branch, setBranch] = useState('All Branch')
  const [kind, setKind] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [bulkAction, setBulkAction] = useState('')
  const [bulkValue, setBulkValue] = useState('')
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [toast, setToast] = useState('')
  const [assignTicket, setAssignTicket] = useState<Ticket | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null)
  // React Query owns the data and its invalidation, so the old `rev` counter
  // that forced a re-read of the mutable mock array is gone.
  const { data: tickets = [], isPending } = useTickets()
  const updateTicket = useUpdateTicket()
  const removeTicket = useDeleteTicket()

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 700)
    return () => window.clearTimeout(t)
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2500)
  }

  const clearFilters = () => {
    setSearch('')
    setStatuses('')
    setPriority('')
    setCategory('')
    setStaff('')
    setBranch('All Branch')
    setKind('')
    setPage(1)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setLoading(true)
    window.setTimeout(() => {
      setRefreshing(false)
      setLoading(false)
    }, 700)
    showToast('List refreshed')
  }

  const bulkNeedsValue =
    bulkAction === 'Change status'
      ? 'status'
      : bulkAction === 'Change priority'
        ? 'priority'
        : bulkAction === 'Assign to staff'
          ? 'staff'
          : null

  const applyBulk = () => {
    if (!bulkAction) return showToast('Choose a bulk action first')
    if (selected.size === 0) return showToast('Select at least one ticket')
    const ids = [...selected]

    if (bulkAction === 'Delete selected') return setBulkConfirm(true)

    if (bulkAction === 'Change status') {
      if (!bulkValue) return showToast('Choose a status to apply')
      ids.forEach((id) => updateTicket.mutate({ id, status: bulkValue as TicketStatus }))
      showToast(`Status set to ${bulkValue} — ${ids.length} ticket(s)`)
    } else if (bulkAction === 'Change priority') {
      if (!bulkValue) return showToast('Choose a priority to apply')
      ids.forEach((id) => updateTicket.mutate({ id, priority: bulkValue as TicketPriority }))
      showToast(`Priority set to ${bulkValue} — ${ids.length} ticket(s)`)
    } else if (bulkAction === 'Assign to staff') {
      if (!bulkValue) return showToast('Choose a staff member')
      ids.forEach((id) => updateTicket.mutate({ id, assignedTo: bulkValue }))
      showToast(`Assigned to ${bulkValue} — ${ids.length} ticket(s)`)
    }
    setBulkAction('')
    setBulkValue('')
  }

  const confirmBulkDelete = () => {
    const ids = [...selected]
    // One request per ticket: the API has no bulk endpoint, and inventing one
    // for a handful of rows would be scope the UI does not need.
    ids.forEach((id) => removeTicket.mutate(id))
    setSelected(new Set())
    setBulkConfirm(false)
    setBulkAction('')
    showSuccessDialog(`${ids.length} ticket(s) deleted successfully`)
  }

  const rowAction = (type: string, ticket: Ticket, payload?: string) => {
    if (type === 'Assign') return setAssignTicket(ticket)
    if (type === 'View') return window.location.assign(`/support-tickets/${ticket.id}`)
    if (type === 'Delete') return setDeleteTarget(ticket)
    if (type === 'SetStatus' && payload) {
      updateTicket.mutate({ id: ticket.id, status: payload as TicketStatus })
      return showToast(`#${ticket.id} → ${payload}`)
    }
    if (type === 'SetPriority' && payload) {
      updateTicket.mutate({ id: ticket.id, priority: payload as TicketPriority })
      return showToast(`#${ticket.id} priority → ${payload}`)
    }
    showToast(`${type}: #${ticket.id}`)
  }

  const saveAssignee = (member: string) => {
    if (!assignTicket) return
    updateTicket.mutate({ id: assignTicket.id, assignedTo: member })
    showToast(`Ticket #${assignTicket.id} assigned to ${member}`)
    setAssignTicket(null)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    removeTicket.mutate(deleteTarget.id)
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(deleteTarget.id)
      return next
    })
    showSuccessDialog(`Ticket #${deleteTarget.id} deleted successfully`)
    setDeleteTarget(null)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tickets.filter((t) => {
      if (statuses && t.status !== statuses) return false
      if (priority && t.priority !== priority) return false
      if (category && t.category !== category) return false
      if (staff && (t.assignedTo ?? null) !== staff) return false
      if (branch !== 'All Branch' && t.branch !== branch) return false
      if (kind && t.requesterKind !== kind) return false
      if (q) {
        const hay =
          `${t.id} ${t.subject} ${t.requester} ${t.requesterNo} ${t.category}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [tickets, search, statuses, priority, category, staff, branch, kind])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((t) => selected.has(t.id))

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) pageRows.forEach((t) => next.delete(t.id))
      else pageRows.forEach((t) => next.add(t.id))
      return next
    })
  }

  const resetToFirst = () => setPage(1)

  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  const activeFilterCount =
    (statuses ? 1 : 0) +
    (priority ? 1 : 0) +
    (category ? 1 : 0) +
    (staff ? 1 : 0) +
    (branch !== 'All Branch' ? 1 : 0) +
    (kind ? 1 : 0)

  const exportHeader = [
    'ID',
    'Subject',
    'Category',
    'Requester',
    'Type',
    'Priority',
    'Status',
    'Assigned To',
    'Created',
    'Updated',
  ]
  const exportRows = filtered.map((t) => [
    t.id,
    t.subject,
    t.category,
    t.requester,
    t.requesterKind,
    t.priority,
    t.status,
    t.assignedTo ?? 'Unassigned',
    t.created,
    t.updated,
  ])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Support Tickets</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOpen(true)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors',
              activeFilterCount > 0
                ? 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700'
                : 'border-brand-300 bg-white text-brand-600 hover:bg-brand-50',
            )}
          >
            <Filter className="h-4 w-4" /> Filter
            {activeFilterCount > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-brand-600">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="group relative">
            <button
              onClick={handleRefresh}
              aria-label="Refresh List"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            </button>
            <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-slate-700 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
              Refresh List
            </span>
          </div>
        </div>
      </div>

      {/* Filter modal */}
      {filterOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4">
            <div
              className="animate-fade-in absolute inset-0 bg-slate-500/60"
              onClick={() => setFilterOpen(false)}
            />
            <div className="animate-dialog-in relative my-8 w-full max-w-4xl rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-800">Filter Tickets</h2>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Status">
                    <select
                      value={statuses}
                      onChange={(e) => {
                        setStatuses(e.target.value)
                        resetToFirst()
                      }}
                      className="input"
                    >
                      <option value="">- Status -</option>
                      {ticketStatuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Priority">
                    <select
                      value={priority}
                      onChange={(e) => {
                        setPriority(e.target.value)
                        resetToFirst()
                      }}
                      className="input"
                    >
                      <option value="">- Priority -</option>
                      {ticketPriorities.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Category">
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value)
                        resetToFirst()
                      }}
                      className="input"
                    >
                      <option value="">- Category -</option>
                      {ticketCategories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Requester Type">
                    <select
                      value={kind}
                      onChange={(e) => {
                        setKind(e.target.value)
                        resetToFirst()
                      }}
                      className="input"
                    >
                      <option value="">- Any -</option>
                      <option>Student</option>
                      <option>Lead</option>
                    </select>
                  </Field>
                  <Field label="Assigned To">
                    <select
                      value={staff}
                      onChange={(e) => {
                        setStaff(e.target.value)
                        resetToFirst()
                      }}
                      className="input"
                    >
                      <option value="">- Assigned To -</option>
                      {ticketStaff().map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Branch">
                    <select
                      value={branch}
                      onChange={(e) => {
                        setBranch(e.target.value)
                        resetToFirst()
                      }}
                      className="input"
                    >
                      {ticketBranches.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
                <button
                  onClick={clearFilters}
                  className="rounded-lg border border-brand-300 bg-white px-6 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
                >
                  Clear
                </button>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Table card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center">
          <label className="flex items-center gap-2 text-sm text-slate-600 md:flex-1">
            Show
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                resetToFirst()
              }}
              className="input w-20 py-1.5"
            >
              {PAGE_SIZES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            entries
          </label>

          <div className="flex justify-center md:flex-[2] md:px-2">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  resetToFirst()
                }}
                placeholder="ID, Subject, Requester, Category..."
                className="input w-full pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:flex-1 md:justify-end">
            <ExportButtons
              title="Support Tickets"
              filename="support-tickets"
              header={exportHeader}
              rows={exportRows}
              onDone={showToast}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto xl:overflow-x-visible">
          <table className="w-full min-w-[960px]">
            <thead className="sticky top-16 z-10">
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-[0_1px_0_0_rgb(226_232_240)]">
                <th className="bg-slate-50 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                    aria-label="Select all on this page"
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
                <th className="bg-slate-50 px-3 py-3">ID</th>
                <th className="bg-slate-50 px-3 py-3">Subject</th>
                <th className="bg-slate-50 px-3 py-3">Requester</th>
                <th className="bg-slate-50 px-3 py-3">Priority</th>
                <th className="bg-slate-50 px-3 py-3">Status</th>
                <th className="bg-slate-50 px-3 py-3">Assigned To</th>
                <th className="bg-slate-50 px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-16">
                    <DotsLoader />
                  </td>
                </tr>
              ) : (
                <>
                  {pageRows.map((ticket) => (
                    <TicketRow
                      key={ticket.id}
                      ticket={ticket}
                      selected={selected.has(ticket.id)}
                      onToggle={() => toggleOne(ticket.id)}
                      onAction={(type, payload) => rowAction(type, ticket, payload)}
                    />
                  ))}
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-sm text-slate-500">
                        {isPending ? 'Loading tickets…' : 'No tickets found.'}
                        {activeFilterCount > 0 && (
                          <button
                            onClick={clearFilters}
                            className="ml-1 font-semibold text-brand-600 hover:underline"
                          >
                            Clear filters
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">
            Showing {from} to {to} of {filtered.length} entries
            {filtered.length < tickets.length && (
              <span className="text-slate-500"> (filtered from {tickets.length} total entries)</span>
            )}
          </p>
          <div className="flex items-center gap-1">
            <PageBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </PageBtn>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={cn(
                  'h-8 min-w-8 rounded-md px-2 text-sm font-medium',
                  n === currentPage
                    ? 'bg-brand-600 text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
              >
                {n}
              </button>
            ))}
            <PageBtn
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </PageBtn>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={bulkAction}
          onChange={(e) => {
            setBulkAction(e.target.value)
            setBulkValue('')
          }}
          aria-label="Bulk action"
          className="input w-56"
        >
          <option value="">- Bulk Actions -</option>
          {ticketBulkActions.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>

        {bulkNeedsValue === 'status' && (
          <select
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            aria-label="Target status"
            className="input w-48"
          >
            <option value="">- Select status -</option>
            {ticketStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
        {bulkNeedsValue === 'priority' && (
          <select
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            aria-label="Target priority"
            className="input w-48"
          >
            <option value="">- Select priority -</option>
            {ticketPriorities.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        )}
        {bulkNeedsValue === 'staff' && (
          <select
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            aria-label="Target staff"
            className="input w-48"
          >
            <option value="">- Select staff -</option>
            {ticketStaff().map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}

        <button
          onClick={applyBulk}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Apply
        </button>
        {selected.size > 0 && <span className="text-sm text-slate-500">{selected.size} selected</span>}
      </div>

      {/* Assign staff */}
      {assignTicket && (
        <AssignStaffDialog
          lead={{ id: assignTicket.id, name: assignTicket.requester }}
          title="Ticket - Assign Staff"
          nameLabel="Requester"
          assignedTo={assignTicket.assignedTo}
          staff={ticketStaff()}
          onClose={() => setAssignTicket(null)}
          onSave={saveAssignee}
        />
      )}

      {/* Delete one */}
      {deleteTarget &&
        createPortal(
          <ConfirmDialog
            open
            title="Delete this ticket?"
            message={
              <>
                Ticket <span className="font-medium text-slate-700">#{deleteTarget.id}</span> (
                {deleteTarget.subject}) will be removed permanently.
              </>
            }
            confirmLabel="Delete"
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />,
          document.body,
        )}

      {/* Bulk delete */}
      {bulkConfirm &&
        createPortal(
          <ConfirmDialog
            open
            title={`Delete ${selected.size} ticket(s)?`}
            message="The selected tickets will be removed permanently."
            confirmLabel="Delete"
            onConfirm={confirmBulkDelete}
            onCancel={() => setBulkConfirm(false)}
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
