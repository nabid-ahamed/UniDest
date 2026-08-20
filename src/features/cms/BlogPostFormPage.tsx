import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Save, ImagePlus, Star, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { staff } from '../../mock/staff'
import { postStatuses, slugify, type PostStatus } from '../../mock/cms'
import {
  useCmsItem,
  useCreateCms,
  useUpdateCms,
  type ApiCmsContent,
} from '../../lib/api'

/**
 * Route entry: resolves the post being edited before the form mounts.
 *
 * The form seeds its fields from `existing` once, so it must not mount until
 * that value has arrived — and the `key` remounts it per id, so switching posts
 * resets the editor instead of keeping the previous one's text.
 */
export default function BlogPostFormPage() {
  const { id } = useParams()
  const { data: existing, isPending } = useCmsItem('post', id != null ? Number(id) : undefined)

  if (id != null && isPending) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Loading post…</p>
      </div>
    )
  }

  return <BlogPostForm key={id ?? 'new'} existing={existing ?? undefined} editing={id != null} />
}

function BlogPostForm({ existing, editing }: { existing?: ApiCmsContent; editing: boolean }) {
  const createPost = useCreateCms()
  const updatePost = useUpdateCms()

  const [title, setTitle] = useState(existing?.title ?? '')
  const [slug, setSlug] = useState(existing?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(editing)
  const [excerpt, setExcerpt] = useState(existing?.excerpt ?? '')
  const [content, setContent] = useState(existing?.content ?? '')
  const [cover, setCover] = useState<string | null>(existing?.cover ?? null)
  const [status, setStatus] = useState<PostStatus>((existing?.status as PostStatus) ?? 'Published')
  const [featured, setFeatured] = useState(existing?.featured ?? false)
  const [author, setAuthor] = useState(existing?.author ?? staff[0]?.name ?? 'Admin Admin')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (editing && !existing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Blog post not found.</p>
        <a href="/cms/blog" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Blog Posts
        </a>
      </div>
    )
  }

  const onTitle = (v: string) => {
    setTitle(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  const onPickCover = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCover(reader.result as string)
    reader.readAsDataURL(file)
  }

  const onSave = () => {
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    const finalSlug = slugify(slug || title)
    // `author` and `publishedAt` are set by the server — from the token and
    // from the publish state — so neither is sent from here.
    const payload = {
      title,
      slug: finalSlug,
      excerpt,
      body: content,
      coverUrl: cover ?? undefined,
      status,
      featured,
    }
    if (editing && existing) {
      updatePost.mutate({ kind: 'post', id: existing.id, ...payload })
    } else {
      createPost.mutate({ kind: 'post', ...payload })
    }
    setSaved(true)
    window.setTimeout(() => {
      window.location.href = '/cms/blog'
    }, 500)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">{editing ? 'Edit Blog Post' : 'Add Blog Post'}</h1>
        <a
          href="/cms/blog"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </a>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-semibold text-slate-700">Title <span className="text-rose-500">*</span></label>
              <input id="title" value={title} onChange={(e) => onTitle(e.target.value)} className="input" placeholder="Post title" />
            </div>
            <div>
              <label htmlFor="slug" className="mb-1 block text-sm font-semibold text-slate-700">Slug</label>
              <input
                id="slug"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }}
                className="input"
                placeholder="auto-generated-from-title"
              />
            </div>
            <div>
              <label htmlFor="excerpt" className="mb-1 block text-sm font-semibold text-slate-700">Excerpt</label>
              <textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className="input resize-y" placeholder="Short summary shown in listings" />
            </div>
            <div>
              <label htmlFor="content" className="mb-1 block text-sm font-semibold text-slate-700">Content</label>
              <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={10} className="input resize-y" placeholder="Write the article body..." />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-2 text-sm font-semibold text-slate-700">Cover Image</p>
            <div
              className={cn('relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-slate-200 bg-slate-50', cover && 'border-solid')}
            >
              {cover ? (
                <>
                  <img src={cover} alt="cover preview" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setCover(null)}
                    className="absolute right-2 top-2 rounded-full bg-slate-900/70 p-1 text-white hover:bg-slate-900"
                    aria-label="Remove cover"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-1 text-slate-400 hover:text-brand-600">
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs font-medium">Upload image</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickCover(e.target.files?.[0])} />
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <label htmlFor="status" className="mb-1 block text-sm font-semibold text-slate-700">Status</label>
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value as PostStatus)} className="input">
                {postStatuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="author" className="mb-1 block text-sm font-semibold text-slate-700">Author</label>
              <select id="author" value={author} onChange={(e) => setAuthor(e.target.value)} className="input">
                {staff.map((s) => (
                  <option key={s.id}>{s.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">Pulled from the Staff module.</p>
            </div>
            <button
              type="button"
              onClick={() => setFeatured((f) => !f)}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                featured ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50',
              )}
            >
              <Star className={cn('h-4 w-4', featured && 'fill-current')} />
              {featured ? 'Featured' : 'Mark as Featured'}
            </button>
          </div>

          <button
            onClick={onSave}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Save className="h-4 w-4" /> {saved ? 'Saved ✓' : editing ? 'Save Changes' : 'Publish Post'}
          </button>
        </div>
      </div>
    </div>
  )
}
