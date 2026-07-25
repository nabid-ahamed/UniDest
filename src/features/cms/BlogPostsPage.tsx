import { useMemo, useState } from 'react'
import { showSuccessDialog } from '../../store/successDialog'
import { Search, Plus, Pencil, Trash2, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import { PageBtn } from '../../components/DataTableUI'
import { ExportButtons } from '../../components/ExportButtons'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  sortedPosts,
  deletePost,
  togglePostFeatured,
  postStatuses,
  type BlogPost,
} from '../../mock/cms'

const PAGE_SIZES = [10, 25, 50, 100]

const STATUS_BADGE: Record<string, string> = {
  Published: 'bg-emerald-100 text-emerald-700',
  Draft: 'bg-amber-100 text-amber-700',
}

export default function BlogPostsPage() {
  const [rev, setRev] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [confirm, setConfirm] = useState<BlogPost | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sortedPosts()
      .filter((p) => !statusFilter || p.status === statusFilter)
      .filter((p) => !q || `${p.title} ${p.slug} ${p.author}`.toLowerCase().includes(q))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, rev])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  const exportRows = filtered.map((p) => [p.title, p.slug, p.status, p.featured ? 'Yes' : 'No', p.author, p.publishedAt])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Blog Posts</h1>
          <p className="mt-1 text-sm text-slate-500">Articles that power the public Blog / Resources section.</p>
        </div>
        <a
          href="/cms/blog/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add New
        </a>
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
        <label className="flex items-center gap-2 text-sm text-slate-600 md:flex-1">
          Show
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }} className="input w-20 py-1.5">
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          entries
        </label>
        <div className="flex flex-1 items-center gap-2 md:flex-[2] md:justify-center">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="input w-auto py-1.5">
            <option value="">All Status</option>
            {postStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search posts..."
              aria-label="Search blog posts"
              className="input w-full pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 md:flex-1 md:justify-end">
          <ExportButtons
            title="Blog Posts"
            filename="blog-posts"
            header={['Title', 'Slug', 'Status', 'Featured', 'Author', 'Published']}
            rows={exportRows}
            onDone={showToast}
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[880px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 align-middle text-sm">
                <td className="px-4 py-3.5">
                  {p.cover ? (
                    <img src={p.cover} alt="" className="h-12 w-16 rounded-md object-cover" />
                  ) : (
                    <span className={cn('flex h-12 w-16 items-center justify-center rounded-md bg-gradient-to-br text-[10px] font-bold text-white/90', p.gradient)}>
                      BLOG
                    </span>
                  )}
                </td>
                <td className="max-w-md px-4 py-3.5">
                  <a href={`/cms/blog/${p.id}/edit`} className="font-bold text-slate-800 hover:text-brand-600 hover:underline [overflow-wrap:anywhere]">
                    {p.title}
                  </a>
                  <p className="mt-0.5 text-xs text-slate-400 [overflow-wrap:anywhere]">{p.slug}</p>
                  <p className="mt-0.5 text-xs text-slate-500">by {p.author}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn('rounded-md px-2.5 py-1 text-xs font-semibold', STATUS_BADGE[p.status])}>{p.status}</span>
                </td>
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => { togglePostFeatured(p.id); setRev((n) => n + 1) }}
                    aria-label={p.featured ? 'Unfeature' : 'Feature'}
                    title={p.featured ? 'Featured — click to unfeature' : 'Not featured — click to feature'}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                      p.featured ? 'bg-amber-400 text-white hover:bg-amber-500' : 'border border-slate-200 text-slate-300 hover:text-amber-400',
                    )}
                  >
                    <Star className={cn('h-4 w-4', p.featured && 'fill-current')} />
                  </button>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{p.publishedAt}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/cms/blog/${p.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </a>
                    <button
                      onClick={() => setConfirm(p)}
                      className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                  No blog posts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-500">Showing {from} to {to} of {filtered.length} entries</p>
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
        title="Delete blog post"
        message={`Delete "${confirm?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            deletePost(confirm.id)
            showSuccessDialog('Blog post deleted successfully')
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
