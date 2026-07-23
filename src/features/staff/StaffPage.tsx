import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  Plus,
  Power,
  Pencil,
  Trash2,
  Mail,
  Phone,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { pickTextColor } from '../../lib/contrast'
import { ExportButtons } from '../../components/ExportButtons'
import { PageBtn } from '../../components/DataTableUI'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  staff,
  staffRoles,
  staffBranches,
  avatarColor,
  initials,
  toggleStaffStatus,
  deleteStaff,
  workload,
  type StaffMember,
} from '../../mock/staff'

const PAGE_SIZES = [10, 25, 50, 100]

export default function StaffPage() {
  const [rev, setRev] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [confirm, setConfirm] = useState<StaffMember | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return staff
      .filter((s) => !roleFilter || s.role === roleFilter)
      .filter((s) => !branchFilter || s.branch === branchFilter)
      .filter((s) => !statusFilter || s.status === statusFilter)
      .filter((s) => !q || `${s.name} ${s.email} ${s.phone} ${s.role} ${s.branch}`.toLowerCase().includes(q))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, branchFilter, statusFilter, rev])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  const exportHeader = ['Name', 'Email', 'Phone', 'Role', 'Branch', 'Status', 'Leads', 'Students', 'Applications']
  const exportRows = filtered.map((s) => {
    const w = workload(s.name)
    return [s.name, s.email, s.phone, s.role, s.branch, s.status, w.leads, w.students, w.applications]
  })

  const resetFilters = () => {
    setRoleFilter('')
    setBranchFilter('')
    setStatusFilter('')
    setSearch('')
    setPage(1)
  }
  const filterCount = [roleFilter, branchFilter, statusFilter].filter(Boolean).length

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Staff</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your team members, roles and branch access.</p>
        </div>
        <a
          href="/staff/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add Staff
        </a>
      </div>

      {/* Filters */}
      <div className="mt-5 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="st-role" className="mb-1 block text-xs font-medium text-slate-600">
            Role
          </label>
          <select id="st-role" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }} className="input">
            <option value="">All Roles</option>
            {staffRoles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="st-branch" className="mb-1 block text-xs font-medium text-slate-600">
            Branch
          </label>
          <select id="st-branch" value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setPage(1) }} className="input">
            <option value="">All Branches</option>
            {staffBranches.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="st-status" className="mb-1 block text-xs font-medium text-slate-600">
            Status
          </label>
          <select id="st-status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="input">
            <option value="">All Statuses</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={resetFilters}
            disabled={filterCount === 0 && !search}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear{filterCount > 0 && ` (${filterCount})`}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <label className="flex items-center gap-2 text-sm text-slate-600 md:flex-1">
          Show
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }} className="input w-20 py-1.5">
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          entries
        </label>
        <div className="flex justify-center md:flex-[2] md:px-2">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search staff..."
              aria-label="Search staff"
              className="input w-full pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 md:flex-1 md:justify-end">
          <ExportButtons title="Staff" filename="staff" header={exportHeader} rows={exportRows} onDone={showToast} />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((s) => {
              const w = workload(s.name)
              const bg = avatarColor(s.name)
              return (
                <tr key={s.id} className="border-b border-slate-100 align-top text-sm">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{ backgroundColor: bg, color: pickTextColor(bg) }}
                        aria-hidden="true"
                      >
                        {initials(s.name)}
                      </span>
                      <a href={`/staff/${s.id}`} className="font-bold text-slate-800 hover:text-brand-600 hover:underline">
                        {s.name}
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <a href={`mailto:${s.email}`} className="flex items-center gap-1.5 text-slate-600 hover:text-brand-600 [overflow-wrap:anywhere]">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {s.email}
                    </a>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {s.phone}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="whitespace-nowrap rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {s.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{s.branch}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <span className="rounded-md bg-sky-50 px-2 py-1 font-semibold text-sky-700" title="Assigned leads">
                        {w.leads} Leads
                      </span>
                      <span className="rounded-md bg-violet-50 px-2 py-1 font-semibold text-violet-700" title="Assigned students">
                        {w.students} Students
                      </span>
                      <span className="rounded-md bg-emerald-50 px-2 py-1 font-semibold text-emerald-700" title="Assigned applications">
                        {w.applications} Apps
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-semibold',
                        s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                      )}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <RowActions
                      staffId={s.id}
                      status={s.status}
                      onToggle={() => {
                        toggleStaffStatus(s.id)
                        showToast(`${s.name} ${s.status === 'Active' ? 'deactivated' : 'activated'}`)
                        setRev((n) => n + 1)
                      }}
                      onDelete={() => setConfirm(s)}
                    />
                  </td>
                </tr>
              )
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                  No staff found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-500">
          Showing {from} to {to} of {filtered.length} entries
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
                n === currentPage ? 'bg-brand-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
              )}
            >
              {n}
            </button>
          ))}
          <PageBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </PageBtn>
        </div>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title="Delete staff member"
        message={`Delete "${confirm?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            deleteStaff(confirm.id)
            showToast('Staff member deleted')
            setConfirm(null)
            setRev((n) => n + 1)
          }
        }}
      />

      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[120] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

/* Row action cluster: eye (view) + 3-dot dropdown (edit / activate / delete). */
function RowActions({
  staffId,
  status,
  onToggle,
  onDelete,
}: {
  staffId: number
  status: string
  onToggle: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const items = [
    { label: 'Edit', icon: Pencil, href: `/staff/${staffId}/edit` as string | undefined, onClick: undefined as (() => void) | undefined },
    { label: status === 'Active' ? 'Deactivate' : 'Activate', icon: Power, href: undefined, onClick: onToggle },
    { label: 'Delete', icon: Trash2, href: undefined, onClick: onDelete, danger: true },
  ]

  return (
    <div ref={ref} className="relative inline-flex items-center gap-1">
      <a
        href={`/staff/${staffId}`}
        aria-label="View staff"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500 text-white transition-colors hover:bg-sky-600"
      >
        <Eye className="h-4 w-4" />
      </a>
      <button
        type="button"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
          setOpen((v) => !v)
        }}
        aria-label="More actions"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-600 text-white transition-colors hover:bg-slate-700"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && menuPos &&
        createPortal(
          <div
            style={{ top: menuPos.top, right: menuPos.right }}
            className="fixed z-[90] w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {items.map((it) =>
              it.href ? (
                <a
                  key={it.label}
                  href={it.href}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-600"
                >
                  <it.icon className="h-4 w-4" /> {it.label}
                </a>
              ) : (
                <button
                  key={it.label}
                  type="button"
                  onClick={() => {
                    it.onClick?.()
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors',
                    it.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50 hover:text-brand-600',
                  )}
                >
                  <it.icon className="h-4 w-4" /> {it.label}
                </button>
              ),
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
