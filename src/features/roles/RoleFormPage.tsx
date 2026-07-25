import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Save, ShieldCheck, Info } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Toggle } from '../cms/components/Toggle'
import {
  permissionGroups,
  allPermissionIds,
  getRole,
  addRole,
  updateRole,
  type PermissionGroup,
} from '../../mock/roles'

export default function RoleFormPage() {
  const { id } = useParams()
  const editing = id != null
  const existing = editing ? getRole(Number(id)) : undefined

  const [name, setName] = useState(existing?.name ?? '')
  const [managerial, setManagerial] = useState(existing?.managerial ?? false)
  const [selected, setSelected] = useState<Set<string>>(
    new Set(existing ? existing.permissions : ['view-backend']),
  )
  const [error, setError] = useState('')

  if (editing && !existing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Role not found.</p>
        <a href="/roles" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Role Management
        </a>
      </div>
    )
  }

  const toggle = (permId: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(permId)) next.delete(permId)
      else next.add(permId)
      return next
    })

  const toggleGroup = (group: PermissionGroup, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      group.items.forEach((p) => (on ? next.add(p.id) : next.delete(p.id)))
      return next
    })

  const allOn = selected.size >= allPermissionIds.length
  const toggleAll = () => setSelected(allOn ? new Set() : new Set(allPermissionIds))

  const onSave = () => {
    if (!name.trim()) {
      setError('Role name is required.')
      return
    }
    const permissions = [...selected]
    if (editing && existing) {
      updateRole(existing.id, { name: name.trim(), managerial, permissions })
    } else {
      addRole({ name: name.trim(), managerial, permissions })
    }
    window.location.href = '/roles'
  }

  const selectedCount = selected.size

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <ShieldCheck className="h-5 w-5 text-brand-500" /> {editing ? 'Edit Role' : 'Create Role'}
        </h1>
        <a
          href="/roles"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </a>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
      )}

      {/* Name + managerial */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="role-name" className="mb-1 block text-sm font-semibold text-slate-700">Name *</label>
            <input id="role-name" value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Visa Officer" />
          </div>
          <div className="flex items-end gap-3 pb-1">
            <Toggle checked={managerial} onChange={setManagerial} label="Managerial role" />
            <div>
              <p className="text-sm font-semibold text-slate-700">This is a managerial role</p>
              <p className="text-xs text-slate-500">Managers can oversee their team's data.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Associated Permissions</h2>
            <p className="mt-0.5 text-sm text-slate-500">{selectedCount} of {allPermissionIds.length} selected</p>
          </div>
          <button
            onClick={toggleAll}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            {allOn ? 'Clear all' : 'Select all'}
          </button>
        </div>

        <div className="mt-4 space-y-5">
          {permissionGroups.map((g) => {
            const groupOn = g.items.every((p) => selected.has(p.id))
            const groupSome = !groupOn && g.items.some((p) => selected.has(p.id))
            return (
              <div key={g.group}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">{g.group}</h3>
                  <button
                    onClick={() => toggleGroup(g, !groupOn)}
                    className={cn(
                      'text-xs font-semibold transition-colors',
                      groupOn || groupSome ? 'text-brand-600 hover:underline' : 'text-slate-400 hover:text-brand-600',
                    )}
                  >
                    {groupOn ? 'Clear' : 'Select all'}
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((p) => {
                    const on = selected.has(p.id)
                    return (
                      <label
                        key={p.id}
                        className={cn(
                          'flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors',
                          on ? 'border-brand-300 bg-brand-50/50' : 'border-slate-200 hover:border-slate-300',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(p.id)}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-slate-800">{p.label}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">{p.desc}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>When granting an <span className="font-semibold">Edit/Manage</span> permission, remember to also grant the matching <span className="font-semibold">View</span> permission.</span>
        </div>

        <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={onSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Save className="h-4 w-4" /> {editing ? 'Save Changes' : 'Create Role'}
          </button>
          <a href="/roles" className="text-sm font-semibold text-slate-500 hover:text-slate-700">Cancel</a>
        </div>
      </div>
    </div>
  )
}
