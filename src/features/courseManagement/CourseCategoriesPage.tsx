import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Pencil, Trash2, Check, X, CornerDownRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  courseCategories,
  topCategories,
  childCategories,
  categoryCourseCount,
  addCategory,
  updateCategory,
  deleteCategory,
  type CourseCategory,
  type ActiveStatus,
} from '../../mock/courseManagement'

export default function CourseCategoriesPage() {
  const [rev, setRev] = useState(0)
  const [editor, setEditor] = useState<{ cat: CourseCategory | null } | null>(null)
  const [confirm, setConfirm] = useState<CourseCategory | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const parents = topCategories()
  const bump = () => setRev((n) => n + 1)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Course Management — Categories</h1>
          <p className="mt-1 text-sm text-slate-500">Study areas and their discipline sub-categories.</p>
        </div>
        <button
          onClick={() => setEditor({ cat: null })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Create
        </button>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">Category (Study Area &gt; Discipline Area)</th>
              <th className="px-4 py-3">Courses</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Display Order</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody key={rev}>
            {parents.map((parent) => (
              <CategoryRows
                key={parent.id}
                parent={parent}
                onEdit={(cat) => setEditor({ cat })}
                onDelete={(cat) => setConfirm(cat)}
              />
            ))}
            {parents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  No categories yet. Click Create to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editor &&
        createPortal(
          <CategoryEditor
            cat={editor.cat}
            parents={parents}
            onClose={() => setEditor(null)}
            onSaved={(msg) => {
              setEditor(null)
              bump()
              showToast(msg)
            }}
          />,
          document.body,
        )}

      <ConfirmDialog
        open={confirm !== null}
        title="Delete category"
        message={
          confirm?.parentId === null
            ? `Delete "${confirm?.name}" and all its sub-categories? This cannot be undone.`
            : `Delete "${confirm?.name}"? This cannot be undone.`
        }
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            deleteCategory(confirm.id)
            showToast('Category deleted')
            setConfirm(null)
            bump()
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

/** A parent study-area row followed by its indented discipline rows. */
function CategoryRows({
  parent,
  onEdit,
  onDelete,
}: {
  parent: CourseCategory
  onEdit: (cat: CourseCategory) => void
  onDelete: (cat: CourseCategory) => void
}) {
  const children = childCategories(parent.id)
  return (
    <>
      <Row cat={parent} depth={0} onEdit={onEdit} onDelete={onDelete} />
      {children.map((child) => (
        <Row key={child.id} cat={child} depth={1} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  )
}

function Row({
  cat,
  depth,
  onEdit,
  onDelete,
}: {
  cat: CourseCategory
  depth: number
  onEdit: (cat: CourseCategory) => void
  onDelete: (cat: CourseCategory) => void
}) {
  const count = categoryCourseCount(cat)
  return (
    <tr className="border-b border-slate-100 text-sm">
      <td className="px-4 py-3">
        <div className={cn('flex items-center gap-2', depth === 1 && 'pl-7')}>
          {depth === 1 && <CornerDownRight className="h-4 w-4 shrink-0 text-slate-300" />}
          <span className={cn(depth === 0 ? 'font-bold text-slate-800' : 'font-medium text-slate-600')}>
            {cat.name}
          </span>
          <span className="text-xs text-slate-400">ID: {cat.id}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">{count}</span>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold',
            cat.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
          )}
        >
          {cat.status === 'Active' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {cat.status}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-600 tabular-nums">{cat.displayOrder}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(cat)}
            aria-label={`Edit ${cat.name}`}
            className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={() => onDelete(cat)}
            aria-label={`Delete ${cat.name}`}
            className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </td>
    </tr>
  )
}

/** Modal add/edit form for a category. */
function CategoryEditor({
  cat,
  parents,
  onClose,
  onSaved,
}: {
  cat: CourseCategory | null
  parents: CourseCategory[]
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const isEdit = cat !== null
  const [name, setName] = useState(cat?.name ?? '')
  // "" = top-level study area; otherwise the parent id as a string.
  const [parent, setParent] = useState(cat?.parentId != null ? String(cat.parentId) : '')
  const [displayOrder, setDisplayOrder] = useState(String(cat?.displayOrder ?? 99))
  const [status, setStatus] = useState<ActiveStatus>(cat?.status ?? 'Active')
  const [description, setDescription] = useState(cat?.description ?? '')
  const [error, setError] = useState('')

  // A parent study area can't be reparented under another (keeps the tree 2-deep).
  const editingParent = isEdit && cat?.parentId === null
  const parentOptions = parents.filter((p) => !isEdit || p.id !== cat?.id)

  const submit = () => {
    if (!name.trim()) {
      setError('Please enter a name.')
      return
    }
    const payload = {
      name: name.trim(),
      parentId: parent === '' ? null : Number(parent),
      displayOrder: Number(displayOrder) || 99,
      status,
      description: description.trim(),
    }
    if (isEdit && cat) {
      updateCategory(cat.id, payload)
      onSaved('Category updated')
    } else {
      const inParents = courseCategories.some((c) => c.name.toLowerCase() === payload.name.toLowerCase())
      addCategory(payload)
      onSaved(inParents ? 'Category added' : 'Category created')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-500/60" onClick={onClose} />
      <div className="animate-dialog-in relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? 'Edit Category' : 'Create Category'}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="cat-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Name <span className="text-rose-600">*</span>
            </label>
            <input
              id="cat-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              className={cn('input', error && 'border-rose-500')}
              autoFocus
            />
            {error && <p role="alert" className="mt-1.5 text-sm text-rose-600">{error}</p>}
          </div>

          <div>
            <label htmlFor="cat-parent" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Parent Study Area
            </label>
            <select
              id="cat-parent"
              value={parent}
              onChange={(e) => setParent(e.target.value)}
              disabled={editingParent}
              className={cn('input', editingParent && 'cursor-not-allowed bg-slate-50')}
            >
              <option value="">— None (top-level study area) —</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {editingParent && (
              <p className="mt-1 text-xs text-slate-400">Top-level study areas can't be moved under another.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cat-order" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Display Order
              </label>
              <input
                id="cat-order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Status</span>
              <div className="flex items-center gap-4 pt-2.5">
                {(['Active', 'Inactive'] as const).map((s) => (
                  <label key={s} className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-700">
                    <input
                      type="radio"
                      name="cat_status"
                      checked={status === s}
                      onChange={() => setStatus(s)}
                      className="h-4 w-4 accent-brand-600"
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="cat-desc" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="input resize-y"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-6 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            {isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
