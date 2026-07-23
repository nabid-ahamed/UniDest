import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  Power,
  Ban,
  ShieldCheck,
  Mail,
  Phone,
  Briefcase,
  GitBranch,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { pickTextColor } from '../../lib/contrast'
import { ExportButtons } from '../../components/ExportButtons'
import { PageBtn } from '../../components/DataTableUI'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  users,
  userRoles,
  userStatuses,
  avatarColor,
  initials,
  reportingToName,
  setUserStatus,
  deleteUser,
  type UserAccount,
  type UserStatus,
} from '../../mock/userManagement'

const PAGE_SIZES = [10, 25, 50, 100]

const STATUS_BADGE: Record<UserStatus, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Inactive: 'bg-slate-100 text-slate-500',
  Blocked: 'bg-rose-100 text-rose-700',
}

export default function UserManagementPage() {
  const [rev, setRev] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [confirm, setConfirm] = useState<UserAccount | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users
      .filter((u) => !roleFilter || u.roles.includes(roleFilter))
      .filter((u) => !statusFilter || u.status === statusFilter)
      .filter(
        (u) =>
          !q ||
          `${u.name} ${u.email} ${u.mobile} ${u.roles.join(' ')} ${u.branches.join(' ')}`.toLowerCase().includes(q),
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, statusFilter, rev])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  const exportHeader = ['Name', 'Email', 'Mobile', 'Roles', 'Branches', 'Reporting To', 'Status', 'Created On']
  const exportRows = filtered.map((u) => [
    u.name,
    u.email,
    u.mobile,
    u.roles.join(', '),
    u.branches.join(', '),
    reportingToName(u.reportingToId) ?? '—',
    u.status,
    u.createdOn,
  ])

  const resetFilters = () => {
    setRoleFilter('')
    setStatusFilter('')
    setSearch('')
    setPage(1)
  }
  const filterCount = [roleFilter, statusFilter].filter(Boolean).length

  const changeStatus = (u: UserAccount, status: UserStatus, verb: string) => {
    setUserStatus(u.id, status)
    showToast(`${u.name} ${verb}`)
    setRev((n) => n + 1)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            User Management <span className="text-sm font-medium text-slate-400">· Staff Accounts</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Manage login accounts, roles and reporting lines.</p>
        </div>
        <a
          href="/user-management/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Create
        </a>
      </div>

      {/* Filters */}
      <div className="mt-5 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="u-role" className="mb-1 block text-xs font-medium text-slate-600">Role</label>
          <select id="u-role" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }} className="input">
            <option value="">All Roles</option>
            {userRoles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="u-status" className="mb-1 block text-xs font-medium text-slate-600">Status</label>
          <select id="u-status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="input">
            <option value="">All Statuses</option>
            {userStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
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
              placeholder="Search users..."
              aria-label="Search users"
              className="input w-full pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 md:flex-1 md:justify-end">
          <ExportButtons title="Users" filename="users" header={exportHeader} rows={exportRows} onDone={showToast} />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Created On</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((u) => {
              const bg = avatarColor(u.name)
              const manager = reportingToName(u.reportingToId)
              return (
                <tr key={u.id} className="border-b border-slate-100 align-top text-sm">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{ backgroundColor: bg, color: pickTextColor(bg) }}
                        aria-hidden="true"
                      >
                        {initials(u.name)}
                      </span>
                      <div>
                        <a href={`/user-management/${u.id}`} className="font-bold text-slate-800 hover:text-brand-600 hover:underline">
                          {u.name}
                        </a>
                        {u.isSuperAdmin && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                            <ShieldCheck className="h-3 w-3" /> Super Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <a href={`mailto:${u.email}`} className="flex items-center gap-1.5 text-slate-600 hover:text-brand-600 [overflow-wrap:anywhere]">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {u.email}
                    </a>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {u.mobile || '—'}
                    </span>
                  </td>
                  <td className="max-w-xs px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <span key={r} className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">
                          <Briefcase className="h-3 w-3" /> {r}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-600">Branch:</span> {u.branches.join(', ')}
                    </p>
                    {manager && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <GitBranch className="h-3 w-3 shrink-0" />
                        <span className="font-semibold text-slate-600">Reports to:</span> {manager}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{u.createdOn}</td>
                  <td className="px-4 py-4">
                    <span className={cn('rounded-md px-2.5 py-1 text-xs font-semibold', STATUS_BADGE[u.status])}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <RowActions
                      user={u}
                      onActivate={() => changeStatus(u, 'Active', 'activated')}
                      onDeactivate={() => changeStatus(u, 'Inactive', 'deactivated')}
                      onBlock={() => changeStatus(u, 'Blocked', 'blocked')}
                      onDelete={() => setConfirm(u)}
                    />
                  </td>
                </tr>
              )
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                  No users found.
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

      {/* Note (matches the reference) */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-500">
        <p className="font-semibold text-slate-600">Note</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          <li>You can create multiple Administrators.</li>
          <li>The first Administrator account that pre-exists is called <span className="font-semibold">Super Admin</span> and can't be blocked or deleted.</li>
        </ul>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title="Delete user"
        message={`Delete "${confirm?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            deleteUser(confirm.id)
            showToast('User deleted')
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

/* Row action cluster: eye (view) + 3-dot dropdown (edit / status / delete). */
function RowActions({
  user,
  onActivate,
  onDeactivate,
  onBlock,
  onDelete,
}: {
  user: UserAccount
  onActivate: () => void
  onDeactivate: () => void
  onBlock: () => void
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

  type Item = { label: string; icon: typeof Pencil; href?: string; onClick?: () => void; danger?: boolean }
  const items: Item[] = [{ label: 'Edit', icon: Pencil, href: `/user-management/${user.id}/edit` }]
  if (user.status !== 'Active') items.push({ label: 'Activate', icon: Power, onClick: onActivate })
  else items.push({ label: 'Deactivate', icon: Power, onClick: onDeactivate })
  // Super Admin can't be blocked or deleted (matches the note).
  if (!user.isSuperAdmin) {
    if (user.status !== 'Blocked') items.push({ label: 'Block', icon: Ban, onClick: onBlock, danger: true })
    items.push({ label: 'Delete', icon: Trash2, onClick: onDelete, danger: true })
  }

  return (
    <div ref={ref} className="relative inline-flex items-center gap-1">
      <a
        href={`/user-management/${user.id}`}
        aria-label="View user"
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
                  onClick={() => { it.onClick?.(); setOpen(false) }}
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
