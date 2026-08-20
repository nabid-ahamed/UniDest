import { useMemo, useState } from 'react'
import { showSuccessDialog } from '../../store/successDialog'
import { Search, Plus, Pencil, Trash2, Lock, FileText, Boxes } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useCmsList, useDeleteCms, type ApiCmsContent } from '../../lib/api'

/**
 * Page-specific fields the shared cms_content table has no column for — the
 * page "type", which module it renders, and whether it is a system page that
 * cannot be deleted. They live in `meta` rather than as columns that would be
 * null for every blog post and country entry.
 */
const pageType = (p: ApiCmsContent) => String(p.meta.type ?? 'Custom')
const isSystemPage = (p: ApiCmsContent) => Boolean(p.meta.system)
const pageModule = (p: ApiCmsContent) => (p.meta.module ? String(p.meta.module) : null)

const STATUS_BADGE: Record<string, string> = {
  Published: 'bg-emerald-100 text-emerald-700',
  Draft: 'bg-amber-100 text-amber-700',
}

export default function PagesPage() {
  const { data: cmsPages = [], isPending } = useCmsList('page')
  const removePage = useDeleteCms()
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState<ApiCmsContent | null>(null)


  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cmsPages.filter(
      (p) => !q || `${p.title} ${pageType(p)} ${p.status}`.toLowerCase().includes(q),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmsPages, search])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pages</h1>
          <p className="mt-1 text-sm text-slate-500">Content pages plus auto-generated module pages for the public site.</p>
        </div>
        <a
          href="/cms/pages/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Create
        </a>
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-500">{filtered.length} pages</p>
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, type and status..."
            aria-label="Search pages"
            className="input w-full pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="w-12 px-4 py-3">#</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} className="border-b border-slate-100 text-sm">
                <td className="px-4 py-3.5 text-slate-500">{i + 1}</td>
                <td className="px-4 py-3.5">
                  <a href={`/cms/pages/${p.id}/edit`} className="inline-flex items-center gap-2 font-semibold text-slate-800 hover:text-brand-600 hover:underline">
                    {isSystemPage(p) ? <Boxes className="h-4 w-4 text-slate-400" /> : <FileText className="h-4 w-4 text-slate-400" />}
                    {p.title}
                  </a>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-slate-600">
                    {pageType(p)}
                    {pageModule(p) && <span className="text-slate-400"> — {pageModule(p)}</span>}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn('rounded-md px-2.5 py-1 text-xs font-semibold', STATUS_BADGE[p.status])}>{p.status}</span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/cms/pages/${p.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </a>
                    {isSystemPage(p) ? (
                      <span
                        title="System page — can't be deleted"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-300"
                      >
                        <Lock className="h-3.5 w-3.5" /> System
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirm(p)}
                        className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  {isPending ? 'Loading pages…' : 'No pages found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Note */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-500">
        <p className="font-semibold text-slate-600">Note</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          <li><span className="font-semibold">Content Pages</span> (About Us, policies) are fully editable and deletable.</li>
          <li><span className="font-semibold">Module Pages</span> render live data (Countries, Home) and can be edited but not deleted.</li>
        </ul>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title="Delete page"
        message={`Delete "${confirm?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            // System pages are protected in the UI (no delete button), so
            // anything reaching here is a normal page.
            removePage.mutate({ kind: 'page', id: confirm.id })
            showSuccessDialog('Page deleted successfully')
            setConfirm(null)
          }
        }}
      />

    </div>
  )
}
