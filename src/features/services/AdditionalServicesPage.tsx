import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Filter,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
  Globe,
  UserRoundPen,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { ExportButtons } from '../../components/ExportButtons'
import { Field, PageBtn } from '../../components/DataTableUI'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { AssignStaffDialog } from '../leads/components/AssignStaffDialog'
import { allCountries } from '../../mock/leads'
import {
  serviceRequests,
  serviceTypes,
  serviceStatuses,
  serviceStaff,
  updateService,
  deleteService,
  type ServiceRequest,
} from '../../mock/services'

const PAGE_SIZES = [10, 25, 50, 100]

/** Status → badge colour (blank status renders nothing, like the demo). */
function statusClass(status: string) {
  if (status === 'Processing') return 'bg-amber-50 text-amber-700'
  if (status === 'New File') return 'bg-brand-50 text-brand-700'
  if (status === 'Decision - Completed') return 'bg-emerald-50 text-emerald-700'
  if (status === 'Decision - Rejected') return 'bg-rose-50 text-rose-700'
  return ''
}

export default function AdditionalServicesPage() {
  const [, force] = useState(0)
  const rerender = () => force((n) => n + 1)

  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [service, setService] = useState('')
  const [status, setStatus] = useState('')
  const [country, setCountry] = useState('')
  const [assigned, setAssigned] = useState('')
  const [createdDate, setCreatedDate] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [assignReq, setAssignReq] = useState<ServiceRequest | null>(null)
  const [deleteReq, setDeleteReq] = useState<ServiceRequest | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2500)
  }

  const clearFilters = () => {
    setService('')
    setStatus('')
    setCountry('')
    setAssigned('')
    setCreatedDate('')
    setPage(1)
  }

  const activeFilterCount =
    (service ? 1 : 0) + (status ? 1 : 0) + (country ? 1 : 0) + (assigned ? 1 : 0) + (createdDate ? 1 : 0)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return serviceRequests.filter((r) => {
      if (service && r.service !== service) return false
      if (status && r.status !== status) return false
      if (country && r.country !== country) return false
      if (assigned === 'Unassigned' && r.assignedTo) return false
      if (assigned && assigned !== 'Unassigned' && r.assignedTo !== assigned) return false
      if (createdDate) {
        // Filter input is yyyy-mm-dd; rows store dd-mm-yyyy.
        const [y, m, d] = createdDate.split('-')
        if (r.dateCreated !== `${d}-${m}-${y}`) return false
      }
      if (q) {
        const hay =
          `${r.id} ${r.studentName} ${r.studentEmail} ${r.service} ${r.country} ${r.description} ${r.assignedTo ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, service, status, country, assigned, createdDate, deleteReq, assignReq, toast])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  const exportHeader = ['ID', 'Date Created', 'Status', 'Student', 'Service', 'Country', 'Description', 'Assigned to']
  const exportRows = filtered.map((r) => [
    r.id,
    r.dateCreated,
    r.status || '--',
    r.studentName,
    r.service,
    r.country,
    r.description || '--',
    r.assignedTo ?? '--',
  ])

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <h1 className="text-xl font-bold text-slate-900">Additional Services</h1>
        <button
          onClick={() => setFilterOpen(true)}
          aria-label="Filter"
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
            activeFilterCount > 0
              ? 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700'
              : 'border-brand-300 text-brand-600 hover:bg-brand-50',
          )}
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:px-6 md:flex-row md:items-center">
        <label className="flex items-center gap-2 text-sm text-slate-600 md:flex-1">
          Show
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            className="input w-20 py-1.5"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          entries
        </label>
        <div className="flex justify-center md:flex-[2] md:px-2">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search..."
              aria-label="Search services"
              className="input w-full pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 md:flex-1 md:justify-end">
          <ExportButtons
            title="Additional Services"
            filename="additional-services"
            header={exportHeader}
            rows={exportRows}
            onDone={showToast}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1150px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Date Created</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Assigned to</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 align-middle text-sm hover:bg-slate-50/70">
                <td className="px-4 py-4 font-medium tabular-nums text-slate-700">{r.id}</td>
                <td className="whitespace-nowrap px-4 py-4 tabular-nums text-slate-600">{r.dateCreated}</td>
                <td className="px-4 py-4">
                  {r.status ? (
                    <span className={cn('whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold', statusClass(r.status))}>
                      {r.status}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-bold text-slate-800">
                    <User className="h-4 w-4 shrink-0 text-slate-500" />
                    {r.studentName}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-700">{r.service}</td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-700">
                    <Globe className="h-4 w-4 shrink-0 text-slate-500" />
                    {r.country}
                  </span>
                </td>
                <td className="max-w-44 px-4 py-4 text-slate-600">
                  {r.description ? `${r.description.slice(0, 18)}.....` : '--'}
                </td>
                <td className="px-4 py-4 text-slate-700">{r.assignedTo ?? '--'}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="group relative">
                      <button
                        onClick={() => setAssignReq(r)}
                        aria-label="Assign staff"
                        className="text-brand-600 hover:text-brand-700"
                      >
                        <UserRoundPen className="h-4 w-4" />
                      </button>
                      <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-slate-700 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                        Assign staff
                      </span>
                    </div>
                    <a
                      href={`/services/${r.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      <Eye className="h-4 w-4" /> View
                    </a>
                    <button
                      onClick={() => setDeleteReq(r)}
                      className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">
                  No service requests found.
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="ml-1 font-semibold text-brand-600 hover:underline">
                      Clear filters
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-500">
          Showing {from} to {to} of {filtered.length} entries
          {filtered.length < serviceRequests.length &&
            ` (filtered from ${serviceRequests.length} total entries)`}
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

      {/* Filter modal */}
      {filterOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4">
            <div className="animate-fade-in absolute inset-0 bg-slate-500/60" onClick={() => setFilterOpen(false)} />
            <div className="animate-dialog-in relative my-8 w-full max-w-3xl rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-800">Filter Services</h2>
                <button
                  onClick={() => setFilterOpen(false)}
                  aria-label="Close"
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Select Service">
                  <select value={service} onChange={(e) => { setService(e.target.value); setPage(1) }} className="input">
                    <option value="">Select</option>
                    {serviceTypes.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Select Status">
                  <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="input">
                    <option value="">Select</option>
                    {serviceStatuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Country">
                  <select value={country} onChange={(e) => { setCountry(e.target.value); setPage(1) }} className="input">
                    <option value="">Country</option>
                    {[...new Set([...allCountries, ...serviceRequests.map((r) => r.country)])].sort().map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Assigned To">
                  <select value={assigned} onChange={(e) => { setAssigned(e.target.value); setPage(1) }} className="input">
                    <option value="">Assigned To</option>
                    <option>Unassigned</option>
                    {serviceStaff.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Created Date">
                  <input
                    type="date"
                    value={createdDate}
                    onChange={(e) => {
                      setCreatedDate(e.target.value)
                      setPage(1)
                    }}
                    className="input"
                  />
                </Field>
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

      {/* Assign staff */}
      {assignReq && (
        <AssignStaffDialog
          lead={{ id: assignReq.id, name: assignReq.studentName }}
          title="Service - Assign Staff"
          nameLabel="Student Name"
          assignedTo={assignReq.assignedTo}
          staff={serviceStaff}
          onClose={() => setAssignReq(null)}
          onSave={(member) => {
            updateService({ ...assignReq, assignedTo: member })
            showToast(`Request #${assignReq.id} assigned to ${member}`)
            setAssignReq(null)
            rerender()
          }}
        />
      )}

      {/* Delete confirmation */}
      {deleteReq &&
        createPortal(
          <ConfirmDialog
            open
            title="Delete this service request?"
            message={
              <>
                Request <span className="font-medium text-slate-700">#{deleteReq.id}</span> (
                {deleteReq.service} — {deleteReq.studentName}) will be removed permanently.
              </>
            }
            confirmLabel="Delete"
            onConfirm={() => {
              deleteService(deleteReq.id)
              showToast(`Request #${deleteReq.id} deleted`)
              setDeleteReq(null)
              rerender()
            }}
            onCancel={() => setDeleteReq(null)}
          />,
          document.body,
        )}

      {/* Toast */}
      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[110] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
