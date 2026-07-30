import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Save, Boxes } from 'lucide-react'
import {
  getCmsPage,
  addCmsPage,
  updateCmsPage,
  postStatuses,
  slugify,
  type PostStatus,
} from '../../mock/cms'

export default function PageFormPage() {
  const { id } = useParams()
  const editing = id != null
  const existing = editing ? getCmsPage(Number(id)) : undefined

  const [name, setName] = useState(existing?.name ?? '')
  const [slug, setSlug] = useState(existing?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(editing)
  const [content, setContent] = useState(existing?.content ?? '')
  const [status, setStatus] = useState<PostStatus>(existing?.status ?? 'Published')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const isSystem = existing?.system ?? false

  if (editing && !existing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Page not found.</p>
        <a href="/cms/pages" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Pages
        </a>
      </div>
    )
  }

  const onName = (v: string) => {
    setName(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  const onSave = () => {
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    const finalSlug = slugify(slug || name)
    if (editing && existing) {
      updateCmsPage(existing.id, { name, slug: finalSlug, content, status })
    } else {
      addCmsPage({ name, slug: finalSlug, content, status })
    }
    setSaved(true)
    window.setTimeout(() => {
      window.location.href = '/cms/pages'
    }, 500)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">{editing ? 'Edit Page' : 'Create Page'}</h1>
        <a
          href="/cms/pages"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </a>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
      )}

      {isSystem && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <Boxes className="h-4 w-4 text-slate-400" />
          <span>
            This is a <span className="font-semibold">module page</span> ({existing?.module}). It renders live data and
            can't be deleted or renamed.
          </span>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-semibold text-slate-700">Name <span className="text-rose-500">*</span></label>
            <input id="name" value={name} onChange={(e) => onName(e.target.value)} disabled={isSystem} className="input disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" />
          </div>
          <div>
            <label htmlFor="slug" className="mb-1 block text-sm font-semibold text-slate-700">Slug</label>
            <input
              id="slug"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }}
              disabled={isSystem}
              className="input disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>
          <div>
            <label htmlFor="content" className="mb-1 block text-sm font-semibold text-slate-700">Content</label>
            <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={10} className="input resize-y" />
          </div>
          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-semibold text-slate-700">Status</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value as PostStatus)} className="input w-auto">
              {postStatuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={onSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Save className="h-4 w-4" /> {saved ? 'Saved ✓' : editing ? 'Save Changes' : 'Create Page'}
          </button>
        </div>
      </div>
    </div>
  )
}
