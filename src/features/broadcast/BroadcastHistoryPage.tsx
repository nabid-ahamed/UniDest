import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, Undo2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ExportButtons } from '../../components/ExportButtons'
import { PageBtn } from '../../components/DataTableUI'
import { loadBroadcasts } from '../../mock/broadcast'

const PAGE_SIZES = [25, 50, 100]

export default function BroadcastHistoryPage() {
  const [records] = useState(() => loadBroadcasts())
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2500)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return records
    return records.filter((r) =>
      `${r.dateTime} ${r.type} ${r.subject} ${r.message} ${r.sentTo.join(' ')} ${r.staff}`
        .toLowerCase()
        .includes(q),
    )
  }, [records, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  const exportHeader = ['Date & Time', 'Type', 'Subject', 'Message', 'Sent To', 'Staff']
  const exportRows = filtered.map((r) => [
    r.dateTime,
    r.type,
    r.subject,
    r.message,
    r.sentTo.join(', '),
    r.staff,
  ])

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <h1 className="text-xl font-bold text-slate-900">Broadcast History</h1>
        <a
          href="/broadcast"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Undo2 className="h-4 w-4" /> Back to Broadcast page
        </a>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:px-6 md:flex-row md:items-center">
        <label className="flex items-center gap-2 text-sm text-slate-600 md:flex-1">
          Show
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            className="input w-20 py-1.5"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          entries
        </label>
        <div className="flex justify-center md:flex-[2] md:px-2">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search..."
              aria-label="Search broadcasts"
              className="input w-full pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 md:flex-1 md:justify-end">
          <ExportButtons
            title="Broadcast History"
            filename="broadcast-history"
            header={exportHeader}
            rows={exportRows}
            onDone={showToast}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">Date &amp; Time</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Sent To</th>
              <th className="px-4 py-3">Staff</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 align-top text-sm">
                <td className="whitespace-nowrap px-4 py-4 text-slate-700">{r.dateTime}</td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      'rounded-md px-2 py-0.5 text-xs font-semibold uppercase',
                      r.type === 'email' ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700',
                    )}
                  >
                    {r.type}
                  </span>
                </td>
                <td className="min-w-36 px-4 py-4 font-medium text-slate-800 [overflow-wrap:anywhere]">
                  {r.subject}
                </td>
                <td className="max-w-md px-4 py-4 text-slate-600">
                  <p className="line-clamp-4 whitespace-pre-line [overflow-wrap:anywhere]">
                    {r.message}
                  </p>
                </td>
                <td className="max-w-sm px-4 py-4 text-slate-600 [overflow-wrap:anywhere]">
                  {r.sentTo.join(', ')}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-700">{r.staff}</td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                  No broadcasts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-500">
          Showing {from} to {to} of {filtered.length} entries
          {filtered.length < records.length && ` (filtered from ${records.length} total entries)`}
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
                n === currentPage
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
              )}
            >
              {n}
            </button>
          ))}
          <PageBtn
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </PageBtn>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[60] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
