import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, X, ArrowLeft } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  resourceCategories,
  resourceCountForCategory,
  addResourceCategory,
  updateResourceCategory,
  deleteResourceCategory,
  type ResourceCategory,
} from '../../mock/studentResources'

export default function ResourceCategoriesPage() {
  const [params, setParams] = useSearchParams()
  const [rev, setRev] = useState(0)
  // Open the create modal straight away when arrived via "Create Category".
  const [editor, setEditor] = useState<{ cat: ResourceCategory | null } | null>(
    params.get('create') === '1' ? { cat: null } : null,
  )
  const [confirm, setConfirm] = useState<ResourceCategory | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const closeEditor = () => {
    setEditor(null)
    if (params.get('create')) {
      params.delete('create')
      setParams(params, { replace: true })
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Resources Category</h1>
          <p className="mt-1 text-sm text-slate-500">Organise the documents shared with students.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/student-resources"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Resources
          </a>
          <button
            onClick={() => setEditor({ cat: null })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Create Category
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Resources</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody key={rev}>
            {resourceCategories.map((c) => {
              const count = resourceCountForCategory(c.id)
              return (
                <tr key={c.id} className="border-b border-slate-100 text-sm">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">{c.name}</p>
                    {c.description && <p className="mt-0.5 text-xs text-slate-500">{c.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">{count}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditor({ cat: c })}
                        className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setConfirm(c)}
                        className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {resourceCategories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-sm text-slate-500">
                  No categories yet. Click Create Category to add one.
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
            onClose={closeEditor}
            onSaved={(msg) => {
              closeEditor()
              setRev((n) => n + 1)
              showToast(msg)
            }}
          />,
          document.body,
        )}

      <ConfirmDialog
        open={confirm !== null}
        title="Delete category"
        message={`Delete "${confirm?.name}"?`}
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return
          const ok = deleteResourceCategory(confirm.id)
          if (ok) {
            showToast('Category deleted')
            setRev((n) => n + 1)
          } else {
            showToast(`"${confirm.name}" is in use by ${resourceCountForCategory(confirm.id)} resource(s)`)
          }
          setConfirm(null)
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

function CategoryEditor({
  cat,
  onClose,
  onSaved,
}: {
  cat: ResourceCategory | null
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const isEdit = cat !== null
  const [name, setName] = useState(cat?.name ?? '')
  const [description, setDescription] = useState(cat?.description ?? '')
  const [error, setError] = useState('')

  const submit = () => {
    if (!name.trim()) {
      setError('Please enter a category name.')
      return
    }
    if (isEdit && cat) {
      updateResourceCategory(cat.id, { name: name.trim(), description: description.trim() })
      onSaved('Category updated')
    } else {
      addResourceCategory({ name: name.trim(), description: description.trim() })
      onSaved('Category created')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-500/60" onClick={onClose} />
      <div className="animate-dialog-in relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? 'Edit Category' : 'Create Category'}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="rc-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Name <span className="text-rose-600">*</span>
            </label>
            <input
              id="rc-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              className={cn('input', error && 'border-rose-500')}
              autoFocus
            />
            {error && <p role="alert" className="mt-1.5 text-sm text-rose-600">{error}</p>}
          </div>
          <div>
            <label htmlFor="rc-desc" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              id="rc-desc"
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
