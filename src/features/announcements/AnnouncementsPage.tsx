import { useMemo, useState } from 'react'
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { cn } from '../../lib/cn'
import { PageBtn } from '../../components/DataTableUI'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  sortedAnnouncements,
  deleteAnnouncement,
  audienceCount,
  formatDateTime,
  type Announcement,
  type AnnouncementArea,
} from '../../mock/announcements'

const PAGE_SIZES = [10, 25, 50, 100]

/** Area badge tint per audience segment. */
export const AREA_BADGE: Record<AnnouncementArea, string> = {
  All: 'bg-brand-50 text-brand-600',
  Students: 'bg-violet-50 text-violet-700',
  Leads: 'bg-sky-50 text-sky-700',
  Staff: 'bg-amber-50 text-amber-700',
}

export default function AnnouncementsPage() {
  const [rev, setRev] = useState(0)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [confirm, setConfirm] = useState<Announcement | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sortedAnnouncements().filter(
      (a) => !q || `${a.title} ${a.area} ${a.createdBy}`.toLowerCase().includes(q),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, rev])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Announcements</h1>
          <p className="mt-1 text-sm text-slate-500">Broadcast notices to students, leads and staff.</p>
        </div>
        <a
          href="/announcements/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Create
        </a>
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Show
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }} className="input w-20 py-1.5">
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          entries
        </label>
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by title and area..."
            aria-label="Search announcements"
            className="input w-full pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Created By</th>
              <th className="px-4 py-3">Published At</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((a) => (
              <tr key={a.id} className="border-b border-slate-100 align-top text-sm">
                <td className="px-4 py-4">
                  <a href={`/announcements/${a.id}`} className="font-bold text-slate-800 hover:text-brand-600 hover:underline [overflow-wrap:anywhere]">
                    {a.title}
                  </a>
                </td>
                <td className="px-4 py-4">
                  <span className={cn('inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold', AREA_BADGE[a.area])}>
                    {a.area}
                    <span className="inline-flex items-center gap-0.5 opacity-70">
                      <Users className="h-3 w-3" /> {audienceCount(a.area)}
                    </span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">{a.createdBy}</td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDateTime(a.publishedAt)}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/announcements/${a.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </a>
                    <button
                      onClick={() => setConfirm(a)}
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
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  No announcements found.
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

      <ConfirmDialog
        open={confirm !== null}
        title="Delete announcement"
        message={`Delete "${confirm?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            deleteAnnouncement(confirm.id)
            showToast('Announcement deleted')
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
