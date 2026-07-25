import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Menu as MenuIcon,
  Newspaper,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  Save,
  Link2,
  X,
  ExternalLink,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  menuGroups,
  menuForGroup,
  topMenuItems,
  childMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  moveMenuItem,
  linkTypes,
  linkTypeById,
  type MenuGroup,
  type MenuItem,
} from '../../mock/cms'

export default function MenuManagerPage() {
  const [group, setGroup] = useState<MenuGroup>('main')
  const [, setRev] = useState(0)
  const [confirm, setConfirm] = useState<MenuItem | null>(null)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [toast, setToast] = useState('')

  // Add-item form state
  const [label, setLabel] = useState('')
  const [linkType, setLinkType] = useState(linkTypes[0].id)
  const [parentId, setParentId] = useState<string>('')
  const [newTab, setNewTab] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const refresh = () => setRev((n) => n + 1)
  const items = menuForGroup(group)
  const tops = topMenuItems(group)

  const onAdd = () => {
    if (!label.trim()) {
      showToast('Enter a menu label')
      return
    }
    addMenuItem({ group, label: label.trim(), linkType, parentId: parentId ? Number(parentId) : null, newTab })
    setLabel('')
    setParentId('')
    setNewTab(false)
    refresh()
    showToast('Menu item added')
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <MenuIcon className="h-5 w-5 text-brand-500" /> Menu Manager
        </h1>
        <p className="mt-1 text-sm text-slate-500">Build the public site navigation. Link types map to your existing modules.</p>

        {/* Tabs */}
        <div className="mt-4 inline-flex rounded-lg border border-slate-200 p-1">
          {menuGroups.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
                group === g ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              {g === 'main' ? <Newspaper className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
              {g === 'main' ? 'Main Menu' : 'Footer Menu'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Items + add form */}
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">{group === 'main' ? 'Main' : 'Footer'} Menu Items</h2>
              <button
                onClick={() => showToast('Menu saved')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <Save className="h-4 w-4" /> Save Menu
              </button>
            </div>

            <div className="space-y-2">
              {tops.map((item, idx) => (
                <div key={item.id}>
                  <MenuRow
                    item={item}
                    isFirst={idx === 0}
                    isLast={idx === tops.length - 1}
                    onMove={(dir) => { moveMenuItem(item.id, dir); refresh() }}
                    onEdit={() => setEditing(item)}
                    onDelete={() => setConfirm(item)}
                  />
                  {childMenuItems(item.id).map((child, cIdx, arr) => (
                    <div key={child.id} className="ml-6 mt-2 border-l-2 border-slate-100 pl-3">
                      <MenuRow
                        item={child}
                        nested
                        isFirst={cIdx === 0}
                        isLast={cIdx === arr.length - 1}
                        onMove={(dir) => { moveMenuItem(child.id, dir); refresh() }}
                        onEdit={() => setEditing(child)}
                        onDelete={() => setConfirm(child)}
                      />
                    </div>
                  ))}
                </div>
              ))}
              {items.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">No items yet — add one below.</p>
              )}
            </div>
          </div>

          {/* Add new item */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Plus className="h-4 w-4 text-brand-500" /> Add New Item
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <label htmlFor="m-label" className="mb-1 block text-xs font-semibold text-slate-600">Label</label>
                <input id="m-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Menu label" className="input" />
              </div>
              <div>
                <label htmlFor="m-type" className="mb-1 block text-xs font-semibold text-slate-600">Link Type</label>
                <select id="m-type" value={linkType} onChange={(e) => setLinkType(e.target.value)} className="input">
                  {linkTypes.map((l) => (
                    <option key={l.id} value={l.id}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="m-parent" className="mb-1 block text-xs font-semibold text-slate-600">Parent</label>
                <select id="m-parent" value={parentId} onChange={(e) => setParentId(e.target.value)} className="input">
                  <option value="">— Top level —</option>
                  {tops.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={newTab} onChange={(e) => setNewTab(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  New tab
                </label>
              </div>
            </div>
            <button
              onClick={onAdd}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Add Item
            </button>
          </div>
        </div>

        {/* Link types reference */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Link2 className="h-4 w-4 text-brand-500" /> Link Types
          </h3>
          <p className="mt-1 text-xs text-slate-500">Each type resolves to a real route in this portal.</p>
          <ul className="mt-3 space-y-2">
            {linkTypes.map((l) => (
              <li key={l.id} className="flex items-center gap-2 text-sm">
                <span className={cn('rounded px-2 py-0.5 text-xs font-semibold', l.tint)}>{l.id}</span>
                <span className="text-slate-600">{l.hint}</span>
              </li>
            ))}
          </ul>
          <a href="/cms/home-page" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
            <ExternalLink className="h-4 w-4" /> Home page layout
          </a>
        </div>
      </div>

      {editing &&
        createPortal(
          <EditModal
            item={editing}
            tops={topMenuItems(editing.group).filter((t) => t.id !== editing.id)}
            onClose={() => setEditing(null)}
            onSave={(patch) => {
              updateMenuItem(editing.id, patch)
              setEditing(null)
              refresh()
              showToast('Menu item updated')
            }}
          />,
          document.body,
        )}

      <ConfirmDialog
        open={confirm !== null}
        title="Delete menu item"
        message={`Remove "${confirm?.label}" from the menu?`}
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            deleteMenuItem(confirm.id)
            showToast('Menu item removed')
            setConfirm(null)
            refresh()
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

function MenuRow({
  item,
  nested,
  isFirst,
  isLast,
  onMove,
  onEdit,
  onDelete,
}: {
  item: MenuItem
  nested?: boolean
  isFirst: boolean
  isLast: boolean
  onMove: (dir: -1 | 1) => void
  onEdit: () => void
  onDelete: () => void
}) {
  const lt = linkTypeById(item.linkType)
  return (
    <div className={cn('flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5', nested && 'bg-slate-50/60')}>
      <div className="flex flex-col">
        <button onClick={() => onMove(-1)} disabled={isFirst} aria-label="Move up" className="text-slate-300 hover:text-slate-600 disabled:opacity-30">
          <ChevronUp className="h-4 w-4" />
        </button>
        <button onClick={() => onMove(1)} disabled={isLast} aria-label="Move down" className="text-slate-300 hover:text-slate-600 disabled:opacity-30">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      <span className="flex-1 font-semibold text-slate-800">{item.label}</span>
      {item.newTab && <span className="text-slate-300"><ExternalLink className="h-3.5 w-3.5" /></span>}
      {lt && <span className={cn('rounded px-2 py-0.5 text-xs font-semibold', lt.tint)}>{lt.id}</span>}
      <button onClick={onEdit} aria-label="Edit" className="rounded-md border border-slate-200 p-1.5 text-brand-600 transition-colors hover:bg-brand-50">
        <Pencil className="h-4 w-4" />
      </button>
      <button onClick={onDelete} aria-label="Delete" className="rounded-md border border-slate-200 p-1.5 text-rose-600 transition-colors hover:bg-rose-50">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

function EditModal({
  item,
  tops,
  onClose,
  onSave,
}: {
  item: MenuItem
  tops: MenuItem[]
  onClose: () => void
  onSave: (patch: Partial<MenuItem>) => void
}) {
  const [label, setLabel] = useState(item.label)
  const [linkType, setLinkType] = useState(item.linkType)
  const [parentId, setParentId] = useState<string>(item.parentId ? String(item.parentId) : '')
  const [newTab, setNewTab] = useState(item.newTab)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4" onMouseDown={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Edit Menu Item</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="e-label" className="mb-1 block text-xs font-semibold text-slate-600">Label</label>
            <input id="e-label" value={label} onChange={(e) => setLabel(e.target.value)} className="input" />
          </div>
          <div>
            <label htmlFor="e-type" className="mb-1 block text-xs font-semibold text-slate-600">Link Type</label>
            <select id="e-type" value={linkType} onChange={(e) => setLinkType(e.target.value)} className="input">
              {linkTypes.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="e-parent" className="mb-1 block text-xs font-semibold text-slate-600">Parent</label>
            <select id="e-parent" value={parentId} onChange={(e) => setParentId(e.target.value)} className="input">
              <option value="">— Top level —</option>
              {tops.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={newTab} onChange={(e) => setNewTab(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            Open in new tab
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => onSave({ label: label.trim() || item.label, linkType, parentId: parentId ? Number(parentId) : null, newTab })}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
