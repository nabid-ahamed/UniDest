import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, ChevronLeft, ChevronRight, Eye, MoreVertical, Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ExportButtons } from '../../components/ExportButtons'
import { PageBtn } from '../../components/DataTableUI'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  universities,
  universityTypes,
  coursesForUniversity,
  deleteUniversity,
  type University,
} from '../../mock/courseManagement'

const PAGE_SIZES = [10, 25, 50, 100]

export default function UniversitiesPage() {
  const [rev, setRev] = useState(0)
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [confirm, setConfirm] = useState<University | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const countries = useMemo(
    () => [...new Set(universities.map((u) => u.country))].sort(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rev],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return universities
      .filter((u) => !countryFilter || u.country === countryFilter)
      .filter((u) => !typeFilter || u.type === typeFilter)
      .filter((u) => !statusFilter || u.status === statusFilter)
      .filter((u) => !q || `${u.name} ${u.country} ${u.city}`.toLowerCase().includes(q))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, countryFilter, typeFilter, statusFilter, rev])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  const exportHeader = ['Name', 'Country', 'City', 'Type', 'Courses', 'Show To Agent', 'Status']
  const exportRows = filtered.map((u) => [
    u.name,
    u.country,
    u.city,
    u.type,
    coursesForUniversity(u.name).length,
    u.showToAgent ? 'Yes' : 'No',
    u.status,
  ])

  const resetFilters = () => {
    setCountryFilter('')
    setTypeFilter('')
    setStatusFilter('')
    setSearch('')
    setPage(1)
  }
  const filterCount = [countryFilter, typeFilter, statusFilter].filter(Boolean).length

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Universities (Institutions)</h1>
          <p className="mt-1 text-sm text-slate-500">Manage partner institutions and their courses.</p>
        </div>
        <a
          href="/universities/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add New
        </a>
      </div>

      {/* Filters */}
      <div className="mt-5 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="u-country" className="mb-1 block text-xs font-medium text-slate-600">Country</label>
          <select id="u-country" value={countryFilter} onChange={(e) => { setCountryFilter(e.target.value); setPage(1) }} className="input">
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="u-type" className="mb-1 block text-xs font-medium text-slate-600">Type</label>
          <select id="u-type" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }} className="input">
            <option value="">All Types</option>
            {universityTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="u-status" className="mb-1 block text-xs font-medium text-slate-600">Status</label>
          <select id="u-status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="input">
            <option value="">All Statuses</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={resetFilters}
            disabled={filterCount === 0 && !search}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear{filterCount > 0 && ` (${filterCount})`}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <label className="flex items-center gap-2 text-sm text-slate-600 md:flex-1">
          Show
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }} className="input w-20 py-1.5">
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          entries
        </label>
        <div className="flex justify-center md:flex-[2] md:px-2">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search universities..."
              aria-label="Search universities"
              className="input w-full pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 md:flex-1 md:justify-end">
          <ExportButtons title="Universities" filename="universities" header={exportHeader} rows={exportRows} onDone={showToast} />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[880px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">University</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Courses</th>
              <th className="px-4 py-3">Show To Agent</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((u) => {
              const count = coursesForUniversity(u.name).length
              return (
                <tr key={u.id} className="border-b border-slate-100 align-top text-sm">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white', u.logoClass)}
                        aria-hidden="true"
                      >
                        <Building2 className="h-5 w-5" />
                      </span>
                      <div>
                        <a href={`/universities/${u.id}`} className="font-bold text-slate-800 hover:text-brand-600 hover:underline">
                          {u.name}
                        </a>
                        <p className="mt-0.5 text-xs text-slate-500">{u.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{u.country}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{u.type}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-600">{count}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-semibold',
                        u.showToAgent ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      {u.showToAgent ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-semibold',
                        u.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                      )}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <RowActions universityId={u.id} onDelete={() => setConfirm(u)} />
                  </td>
                </tr>
              )
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                  No universities found.
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
        title="Delete university"
        message={`Delete "${confirm?.name}"? Its courses will remain but lose this institution link.`}
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            deleteUniversity(confirm.id)
            showToast('University deleted')
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

/* Row action cluster: eye (view) + 3-dot dropdown (edit / delete). */
function RowActions({ universityId, onDelete }: { universityId: number; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative inline-flex items-center gap-1">
      <a
        href={`/universities/${universityId}`}
        aria-label="View university"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500 text-white transition-colors hover:bg-sky-600"
      >
        <Eye className="h-4 w-4" />
      </a>
      <button
        type="button"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
          setOpen((v) => !v)
        }}
        aria-label="More actions"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-600 text-white transition-colors hover:bg-slate-700"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && menuPos &&
        createPortal(
          <div
            style={{ top: menuPos.top, right: menuPos.right }}
            className="fixed z-[90] w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <a
              href={`/universities/${universityId}/edit`}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-600"
            >
              <Pencil className="h-4 w-4" /> Edit
            </a>
            <button
              type="button"
              onClick={() => {
                onDelete()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}
