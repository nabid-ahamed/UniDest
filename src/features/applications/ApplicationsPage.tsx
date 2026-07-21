import { useEffect, useMemo, useState } from 'react'
import {
  RefreshCw,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { MultiSelect } from '../../components/MultiSelect'
import { ExportButtons } from '../../components/ExportButtons'
import { DotsLoader, Field, PageBtn, SingleSelect } from '../../components/DataTableUI'
import { AssignStaffDialog } from '../leads/components/AssignStaffDialog'
import type { Application } from '../../mock/applications'
import {
  applications,
  applicationStatuses,
  applicationChannels,
  applicationBulkActions,
  applicationBranches,
  applicationStaff,
  allCountries,
  intakes,
} from '../../mock/applications'
import { ApplicationRow } from './components/ApplicationRow'

const PAGE_SIZES = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 1000, label: '100+' },
]

export default function ApplicationsPage() {
  const [search, setSearch] = useState('')
  const [countries, setCountries] = useState<string[]>([])
  const [intake, setIntake] = useState('')
  const [statuses, setStatuses] = useState<string[]>([])
  const [staff, setStaff] = useState('')
  const [branch, setBranch] = useState('All Branch')
  const [channel, setChannel] = useState('')
  // Reference keeps the filter panel open by default, with a toggle icon.
  const [filtersOpen, setFiltersOpen] = useState(true)

  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [bulkAction, setBulkAction] = useState('')
  const [toast, setToast] = useState('')
  const [assignApp, setAssignApp] = useState<Application | null>(null)
  // Owner per application id, seeded from the mock so re-assignment persists in the UI.
  const [assignees, setAssignees] = useState<Record<number, string | null>>(() =>
    Object.fromEntries(applications.map((a) => [a.id, a.assignedTo])),
  )

  // Initial "fetch" preloader on mount.
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 700)
    return () => window.clearTimeout(t)
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2500)
  }

  const clearFilters = () => {
    setSearch('')
    setCountries([])
    setIntake('')
    setStatuses([])
    setStaff('')
    setBranch('All Branch')
    setChannel('')
    setPage(1)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setLoading(true)
    window.setTimeout(() => {
      setRefreshing(false)
      setLoading(false)
    }, 700)
    showToast('List refreshed')
  }

  const applyBulk = () => {
    if (!bulkAction) return showToast('Choose a bulk action first')
    if (selected.size === 0) return showToast('Select at least one application')
    showToast(`${bulkAction} — ${selected.size} application(s)`)
    setBulkAction('')
  }

  const rowAction = (type: string, app: Application) => {
    if (type === 'Assign') return setAssignApp(app)
    showToast(`${type}: ${app.student} (#${app.id})`)
  }

  const saveAssignee = (member: string) => {
    if (!assignApp) return
    setAssignees((prev) => ({ ...prev, [assignApp.id]: member }))
    showToast(`Application #${assignApp.id} assigned to ${member}`)
    setAssignApp(null)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return applications.filter((a) => {
      if (countries.length && !countries.includes(a.country)) return false
      if (intake && a.intake !== intake) return false
      if (statuses.length && !statuses.includes(a.status)) return false
      if (staff && (assignees[a.id] ?? null) !== staff) return false
      if (branch !== 'All Branch' && a.branch !== branch) return false
      if (channel && a.appliedThrough !== channel) return false
      if (q) {
        const hay = `${a.id} ${a.student} ${a.studentNo} ${a.university} ${a.course} ${a.country}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [search, countries, intake, statuses, staff, branch, channel, assignees])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((a) => selected.has(a.id))

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) pageRows.forEach((a) => next.delete(a.id))
      else pageRows.forEach((a) => next.add(a.id))
      return next
    })
  }

  const resetToFirst = () => setPage(1)

  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  const activeFilterCount =
    countries.length +
    statuses.length +
    (intake ? 1 : 0) +
    (staff ? 1 : 0) +
    (branch !== 'All Branch' ? 1 : 0) +
    (channel ? 1 : 0)

  const exportHeader = [
    'ID',
    'Date Created',
    'Student',
    'Country',
    'University',
    'Course',
    'Intake',
    'Applied Through',
    'Status',
    'Assigned To',
  ]
  const exportRows = filtered.map((a) => [
    a.id,
    a.dateCreated,
    a.student,
    a.country,
    a.university,
    a.course,
    a.intake,
    a.appliedThrough,
    a.status,
    assignees[a.id] ?? 'Unassigned',
  ])

  return (
    <div className="space-y-4">
      {/* Header card — title + filter toggle, like the reference */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold text-slate-900">University Applications</h1>
          <div className="flex items-center gap-2">
            <div className="group relative">
              <button
                onClick={handleRefresh}
                aria-label="Refresh List"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
              >
                <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              </button>
              {/* Tooltip sits below — these buttons are near the top of the page. */}
              <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-slate-700 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                Refresh List
              </span>
            </div>
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-label="Toggle filters"
              className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
                filtersOpen || activeFilterCount > 0
                  ? 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700'
                  : 'border-brand-300 bg-white text-brand-600 hover:bg-brand-50',
              )}
            >
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-brand-600 bg-white px-1 text-xs font-bold text-brand-600">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter panel — grid-rows 0fr→1fr animates the height smoothly. */}
        <div
          className={cn(
            'grid transition-all duration-300 ease-in-out',
            filtersOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-4 border-t border-slate-100 px-4 py-4 sm:px-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Study Country">
                  <MultiSelect
                    options={allCountries}
                    selected={countries}
                    onChange={(next) => {
                      setCountries(next)
                      resetToFirst()
                    }}
                    placeholder="Study Country"
                  />
                </Field>
                <Field label="Intake">
                  <SingleSelect
                    options={intakes}
                    value={intake}
                    onChange={(v) => {
                      setIntake(v)
                      resetToFirst()
                    }}
                    placeholder="Intake"
                  />
                </Field>
                <Field label="Applications Status">
                  <MultiSelect
                    options={applicationStatuses.map((s) => s.label)}
                    selected={statuses}
                    onChange={(next) => {
                      setStatuses(next)
                      resetToFirst()
                    }}
                    placeholder="Applications Status"
                  />
                </Field>
                <Field label="Created Date">
                  <input type="date" className="input" />
                </Field>
                <Field label="Assigned To">
                  <select
                    value={staff}
                    onChange={(e) => {
                      setStaff(e.target.value)
                      resetToFirst()
                    }}
                    className="input"
                  >
                    <option value="">- Assigned To -</option>
                    {applicationStaff.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Branch">
                  <select
                    value={branch}
                    onChange={(e) => {
                      setBranch(e.target.value)
                      resetToFirst()
                    }}
                    className="input"
                  >
                    {applicationBranches.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Applied Through Agent">
                  <select
                    value={channel}
                    onChange={(e) => {
                      setChannel(e.target.value)
                      resetToFirst()
                    }}
                    className="input"
                  >
                    <option value="">Applied Through Agent</option>
                    {applicationChannels.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Centered Filter/Clear, per the reference. Filtering is live, so
                  "Filter" just collapses the panel to show the results. */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Filter
                </button>
                <button
                  onClick={clearFilters}
                  className="rounded-lg border border-brand-300 bg-white px-6 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
                >
                  Clear
                </button>
              </div>

              {/* Active filter chips — one click drops a single filter. */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {countries.map((c) => (
                    <FilterChip
                      key={`c-${c}`}
                      label={c}
                      onRemove={() => setCountries((p) => p.filter((x) => x !== c))}
                    />
                  ))}
                  {statuses.map((s) => (
                    <FilterChip
                      key={`s-${s}`}
                      label={s}
                      onRemove={() => setStatuses((p) => p.filter((x) => x !== s))}
                    />
                  ))}
                  {intake && <FilterChip label={intake} onRemove={() => setIntake('')} />}
                  {staff && <FilterChip label={staff} onRemove={() => setStaff('')} />}
                  {branch !== 'All Branch' && (
                    <FilterChip label={branch} onRemove={() => setBranch('All Branch')} />
                  )}
                  {channel && <FilterChip label={channel} onRemove={() => setChannel('')} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center">
          <label className="flex items-center gap-2 text-sm text-slate-600 md:flex-1">
            Show
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                resetToFirst()
              }}
              className="input w-20 py-1.5"
            >
              {PAGE_SIZES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            entries
          </label>

          <div className="flex justify-center md:flex-[2] md:px-2">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  resetToFirst()
                }}
                placeholder="ID, Student, University, Course..."
                className="input w-full pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:flex-1 md:justify-end">
            <ExportButtons
              title="University Applications"
              filename="applications"
              header={exportHeader}
              rows={exportRows}
              onDone={showToast}
            />
          </div>
        </div>

        {/* Table — horizontal scroll only below lg, so the sticky header can
            anchor to the page (an overflow container would trap it). */}
        <div className="overflow-x-auto lg:overflow-x-visible">
          <table className="w-full min-w-[1000px]">
            <thead className="sticky top-16 z-10">
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-[0_1px_0_0_rgb(226_232_240)]">
                <th className="bg-slate-50 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                    aria-label="Select all on this page"
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
                <th className="bg-slate-50 px-3 py-3">ID</th>
                <th className="bg-slate-50 px-3 py-3">Date Created</th>
                <th className="bg-slate-50 px-3 py-3">Student</th>
                <th className="bg-slate-50 px-3 py-3">Country</th>
                <th className="bg-slate-50 px-3 py-3">Details</th>
                <th className="bg-slate-50 px-3 py-3">Status</th>
                <th className="bg-slate-50 px-3 py-3">Assigned To</th>
                <th className="bg-slate-50 px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-16">
                    <DotsLoader />
                  </td>
                </tr>
              ) : (
                <>
                  {pageRows.map((app) => (
                    <ApplicationRow
                      key={app.id}
                      app={app}
                      assignedTo={assignees[app.id] ?? null}
                      selected={selected.has(app.id)}
                      onToggle={() => toggleOne(app.id)}
                      onAction={(type) => rowAction(type, app)}
                    />
                  ))}
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-3 py-10 text-center text-sm text-slate-500">
                        No applications found.
                        {activeFilterCount > 0 && (
                          <button
                            onClick={clearFilters}
                            className="ml-1 font-semibold text-brand-600 hover:underline"
                          >
                            Clear filters
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">
            Showing {from} to {to} of {filtered.length} entries
            {filtered.length < applications.length && (
              <span className="text-slate-500">
                {' '}
                (filtered from {applications.length} total entries)
              </span>
            )}
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
      </div>

      {/* Bulk actions */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={bulkAction}
          onChange={(e) => setBulkAction(e.target.value)}
          aria-label="Bulk action"
          className="input w-56"
        >
          <option value="">- Bulk Actions -</option>
          {applicationBulkActions.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <button
          onClick={applyBulk}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Apply
        </button>
        {selected.size > 0 && (
          <span className="text-sm text-slate-500">{selected.size} selected</span>
        )}
      </div>

      {/* Assign staff */}
      {assignApp && (
        <AssignStaffDialog
          lead={{ id: assignApp.id, name: assignApp.student }}
          title="Application - Assign Staff"
          nameLabel="Student Name"
          assignedTo={assignees[assignApp.id] ?? null}
          staff={applicationStaff}
          onClose={() => setAssignApp(null)}
          onSave={saveAssignee}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[60] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${label}`}
        className="hover:text-brand-900"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}
