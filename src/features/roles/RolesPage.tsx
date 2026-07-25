import { useMemo, useState } from 'react'
import { showSuccessDialog } from '../../store/successDialog'
import { Search, Plus, Pencil, Trash2, Lock, ShieldCheck, Users } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  roles,
  deleteRole,
  userCountForRole,
  hasAllPermissions,
  permissionLabel,
  type Role,
} from '../../mock/roles'

export default function RolesPage() {
  const [rev, setRev] = useState(0)
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState<Role | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return roles.filter((r) => !q || r.name.toLowerCase().includes(q))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, rev])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <ShieldCheck className="h-5 w-5 text-brand-500" /> Role Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">Named permission sets assigned to staff accounts.</p>
        </div>
        <a
          href="/roles/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Create
        </a>
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex justify-end">
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles..."
            aria-label="Search roles"
            className="input w-full pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Permissions</th>
              <th className="px-4 py-3">Managerial</th>
              <th className="px-4 py-3">Users</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const all = hasAllPermissions(r)
              const userCount = userCountForRole(r.name)
              return (
                <tr key={r.id} className="border-b border-slate-100 align-top text-sm">
                  <td className="whitespace-nowrap px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                      {r.name}
                      {r.system && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                          <Lock className="h-2.5 w-2.5" /> System
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="max-w-xl px-4 py-4">
                    {all ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        All permissions
                      </span>
                    ) : (
                      <PermissionChips ids={r.permissions} />
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {r.managerial ? (
                      <span className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600">Yes</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <a
                      href={`/user-management?role=${encodeURIComponent(r.name)}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-600"
                      title="View users with this role"
                    >
                      <Users className="h-3.5 w-3.5 text-slate-400" /> {userCount}
                    </a>
                  </td>
                  <td className="px-4 py-4">
                    {r.system ? (
                      <span className="text-sm text-slate-400">N/A</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`/roles/${r.id}/edit`}
                          aria-label="Edit role"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => setConfirm(r)}
                          aria-label="Delete role"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600 text-white transition-colors hover:bg-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  No roles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Note (mirrors the reference intent) */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-500">
        <p className="font-semibold text-slate-600">Note</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          <li>Roles are assigned to accounts in <a href="/user-management" className="font-semibold text-brand-600 hover:underline">User Management</a>.</li>
          <li>The <span className="font-semibold">Super Admin</span> role has every permission and can't be edited or deleted.</li>
        </ul>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title="Delete role"
        message={`Delete the "${confirm?.name}" role? Accounts keep the role label but lose its permissions.`}
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            const ok = deleteRole(confirm.id)
            if (ok) showSuccessDialog('Role deleted successfully')
            else showToast("System role can't be deleted")
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

const CHIP_LIMIT = 8

/** Shows the first N permission labels as chips, then a "+N more" pill. */
function PermissionChips({ ids }: { ids: string[] }) {
  if (ids.length === 0) return <span className="text-slate-400">No permissions</span>
  const shown = ids.slice(0, CHIP_LIMIT)
  const extra = ids.length - shown.length
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((id) => (
        <span key={id} className={cn('rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600')}>
          {permissionLabel(id)}
        </span>
      ))}
      {extra > 0 && (
        <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-600">+{extra} more</span>
      )}
    </div>
  )
}
