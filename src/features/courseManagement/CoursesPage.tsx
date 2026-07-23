import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  Plus,
  Power,
  Pencil,
  Trash2,
  GraduationCap,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { ExportButtons } from '../../components/ExportButtons'
import { PageBtn } from '../../components/DataTableUI'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  courses,
  universityNames,
  categoryNames,
  studyLevels,
  toggleCourseStatus,
  deleteCourse,
  type ManagedCourse,
} from '../../mock/courseManagement'

const PAGE_SIZES = [10, 25, 50, 100]

export default function CoursesPage() {
  const [rev, setRev] = useState(0)
  const [search, setSearch] = useState('')
  const [uniFilter, setUniFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [confirm, setConfirm] = useState<ManagedCourse | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const universities = useMemo(() => universityNames(), [])
  const categories = useMemo(() => categoryNames(), [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return courses
      .filter((c) => !uniFilter || c.university === uniFilter)
      .filter((c) => !catFilter || c.studyArea === catFilter)
      .filter((c) => !levelFilter || c.studyLevel === levelFilter)
      .filter((c) => !statusFilter || c.status === statusFilter)
      .filter(
        (c) =>
          !q ||
          `${c.title} ${c.university} ${c.country} ${c.studyLevel} ${c.studyArea} ${c.disciplineArea}`
            .toLowerCase()
            .includes(q),
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, uniFilter, catFilter, levelFilter, statusFilter, rev])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  const exportHeader = ['ID', 'Course', 'University', 'Country', 'Study Level', 'Study Area', 'Discipline', 'Status']
  const exportRows = filtered.map((c) => [
    c.id,
    c.title,
    c.university,
    c.country,
    c.studyLevel,
    c.studyArea,
    c.disciplineArea,
    c.status,
  ])

  const resetFilters = () => {
    setUniFilter('')
    setCatFilter('')
    setLevelFilter('')
    setStatusFilter('')
    setSearch('')
    setPage(1)
  }
  const filterCount = [uniFilter, catFilter, levelFilter, statusFilter].filter(Boolean).length

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">University Course Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            {courses.length} courses across {universities.length} universities.
          </p>
        </div>
        <a
          href="/courses/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add Course
        </a>
      </div>

      {/* Filters */}
      <div className="mt-5 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="c-uni" className="mb-1 block text-xs font-medium text-slate-600">
            University
          </label>
          <select id="c-uni" value={uniFilter} onChange={(e) => { setUniFilter(e.target.value); setPage(1) }} className="input">
            <option value="">All Universities</option>
            {universities.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="c-cat" className="mb-1 block text-xs font-medium text-slate-600">
            Study Area
          </label>
          <select id="c-cat" value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1) }} className="input">
            <option value="">All Areas</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="c-level" className="mb-1 block text-xs font-medium text-slate-600">
            Study Level
          </label>
          <select id="c-level" value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setPage(1) }} className="input">
            <option value="">All Levels</option>
            {studyLevels.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="c-status" className="mb-1 block text-xs font-medium text-slate-600">
            Status
          </label>
          <select id="c-status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="input">
            <option value="">All Statuses</option>
            <option>Enabled</option>
            <option>Disabled</option>
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
              placeholder="Search courses..."
              aria-label="Search courses"
              className="input w-full pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 md:flex-1 md:justify-end">
          <ExportButtons title="Courses" filename="courses" header={exportHeader} rows={exportRows} onDone={showToast} />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[960px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">University</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Study Level</th>
              <th className="px-4 py-3">Study Area</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 align-top text-sm">
                <td className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white',
                        c.logoClass,
                      )}
                      aria-hidden="true"
                    >
                      <GraduationCap className="h-4 w-4" />
                    </span>
                    <div>
                      <a href={`/courses/${c.id}`} className="font-bold text-slate-800 hover:text-brand-600 hover:underline">
                        {c.title}
                      </a>
                      <p className="mt-0.5 text-xs text-slate-500">{c.disciplineArea}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-600 [overflow-wrap:anywhere]">{c.university}</td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">{c.country}</td>
                <td className="px-4 py-4">
                  <span className="whitespace-nowrap rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {c.studyLevel}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-600">{c.studyArea}</td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-semibold',
                      c.status === 'Enabled' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                    )}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <RowActions
                    courseId={c.id}
                    status={c.status}
                    onToggle={() => {
                      toggleCourseStatus(c.id)
                      showToast(`"${c.title}" ${c.status === 'Enabled' ? 'disabled' : 'enabled'}`)
                      setRev((n) => n + 1)
                    }}
                    onDelete={() => setConfirm(c)}
                  />
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                  No courses found.
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
          {pageWindow(currentPage, totalPages).map((n, i) =>
            n === -1 ? (
              <span key={`gap-${i}`} className="px-1 text-slate-400">…</span>
            ) : (
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
            ),
          )}
          <PageBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </PageBtn>
        </div>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title="Delete course"
        message={`Delete "${confirm?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            deleteCourse(confirm.id)
            showToast('Course deleted')
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

/** Compact pagination window (1 … n-1 n n+1 … last) for large course lists. */
function pageWindow(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out = new Set<number>([1, total, current, current - 1, current + 1])
  const sorted = [...out].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const result: number[] = []
  let prev = 0
  for (const n of sorted) {
    if (n - prev > 1) result.push(-1)
    result.push(n)
    prev = n
  }
  return result
}

/* Row action cluster: eye (view) + 3-dot dropdown (edit / enable / delete). */
function RowActions({
  courseId,
  status,
  onToggle,
  onDelete,
}: {
  courseId: number
  status: string
  onToggle: () => void
  onDelete: () => void
}) {
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

  const items = [
    { label: 'Edit', icon: Pencil, href: `/courses/${courseId}/edit` as string | undefined, onClick: undefined as (() => void) | undefined },
    { label: status === 'Enabled' ? 'Disable' : 'Enable', icon: Power, href: undefined, onClick: onToggle },
    { label: 'Delete', icon: Trash2, href: undefined, onClick: onDelete, danger: true },
  ]

  return (
    <div ref={ref} className="relative inline-flex items-center gap-1">
      <a
        href={`/courses/${courseId}`}
        aria-label="View course"
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
            {items.map((it) =>
              it.href ? (
                <a
                  key={it.label}
                  href={it.href}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-600"
                >
                  <it.icon className="h-4 w-4" /> {it.label}
                </a>
              ) : (
                <button
                  key={it.label}
                  type="button"
                  onClick={() => {
                    it.onClick?.()
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors',
                    it.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50 hover:text-brand-600',
                  )}
                >
                  <it.icon className="h-4 w-4" /> {it.label}
                </button>
              ),
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
