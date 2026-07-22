import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus,
  RefreshCw,
  UploadCloud,
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
import type { Student } from '../../mock/students'
import {
  students,
  studentStatuses,
  studentStaff,
  studentBranches,
  studentSources,
  studentBulkActions,
  residenceCountries,
  universities,
  allCountries,
  studyLevels,
  intakes,
} from '../../mock/students'
import { StudentRow } from './components/StudentRow'

const PAGE_SIZES = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 1000, label: '100+' },
]

export default function StudentsPage() {
  const [search, setSearch] = useState('')
  const [statuses, setStatuses] = useState<string[]>([])
  const [countriesInterested, setCountriesInterested] = useState<string[]>([])
  const [staff, setStaff] = useState('')
  const [residence, setResidence] = useState('')
  const [branch, setBranch] = useState('All Branch')
  const [studyLevel, setStudyLevel] = useState('')
  const [intake, setIntake] = useState('')
  const [university, setUniversity] = useState('')
  const [source, setSource] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [bulkAction, setBulkAction] = useState('')
  const [toast, setToast] = useState('')
  const [assignStudent, setAssignStudent] = useState<Student | null>(null)
  // Owner per student id, seeded from the mock so re-assignment persists in the UI.
  const [assignees, setAssignees] = useState<Record<number, string | null>>(() =>
    Object.fromEntries(students.map((s) => [s.id, s.assignedTo])),
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
    setStatuses([])
    setCountriesInterested([])
    setStaff('')
    setResidence('')
    setBranch('All Branch')
    setStudyLevel('')
    setIntake('')
    setUniversity('')
    setSource('')
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
    if (selected.size === 0) return showToast('Select at least one student')
    showToast(`${bulkAction} — ${selected.size} student(s)`)
    setBulkAction('')
  }

  const rowAction = (type: string, student: Student) => {
    if (type === 'Assign') return setAssignStudent(student)
    if (type === 'View') return window.location.assign(`/students/${student.id}`)
    showToast(`${type}: ${student.name} (#${student.id})`)
  }

  const saveAssignee = (member: string) => {
    if (!assignStudent) return
    setAssignees((prev) => ({ ...prev, [assignStudent.id]: member }))
    showToast(`${assignStudent.name} assigned to ${member}`)
    setAssignStudent(null)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students.filter((s) => {
      if (statuses.length && !statuses.includes(s.status)) return false
      if (countriesInterested.length && !countriesInterested.includes(s.countryInterested))
        return false
      if (staff && (assignees[s.id] ?? null) !== staff) return false
      if (residence && s.countryOfResidence !== residence) return false
      if (branch !== 'All Branch' && s.branch !== branch) return false
      if (studyLevel && s.studyLevel !== studyLevel) return false
      if (intake && s.intake !== intake) return false
      if (university && s.university !== university) return false
      if (source && s.source !== source) return false
      if (q) {
        const hay = `${s.id} ${s.studentNo} ${s.name} ${s.email} ${s.phone}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [
    search,
    statuses,
    countriesInterested,
    staff,
    residence,
    branch,
    studyLevel,
    intake,
    university,
    source,
    assignees,
  ])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((s) => selected.has(s.id))

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
      if (allOnPageSelected) pageRows.forEach((s) => next.delete(s.id))
      else pageRows.forEach((s) => next.add(s.id))
      return next
    })
  }

  const resetToFirst = () => setPage(1)

  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  const activeFilterCount =
    statuses.length +
    countriesInterested.length +
    (staff ? 1 : 0) +
    (residence ? 1 : 0) +
    (branch !== 'All Branch' ? 1 : 0) +
    (studyLevel ? 1 : 0) +
    (intake ? 1 : 0) +
    (university ? 1 : 0) +
    (source ? 1 : 0)

  const exportHeader = [
    'ID',
    'Student No',
    'Name',
    'Email',
    'Phone',
    'Country Interested',
    'Status',
    'Assigned To',
    'Branch',
    'Created',
  ]
  const exportRows = filtered.map((s) => [
    s.id,
    s.studentNo,
    s.name,
    s.email,
    s.phone,
    s.countryInterested,
    s.status,
    assignees[s.id] ?? 'Unassigned',
    s.branch,
    s.created,
  ])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Students</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOpen(true)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors',
              activeFilterCount > 0
                ? 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700'
                : 'border-brand-300 bg-white text-brand-600 hover:bg-brand-50',
            )}
          >
            <Filter className="h-4 w-4" /> Filter
            {activeFilterCount > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-brand-600">
                {activeFilterCount}
              </span>
            )}
          </button>
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
            onClick={() => showToast('Import — coming soon')}
            aria-label="Import"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
          >
            <UploadCloud className="h-4 w-4" />
          </button>
          <button
            onClick={() => showToast('New Student — coming soon')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> New Student
          </button>
        </div>
      </div>

      {/* Filter modal */}
      {filterOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4">
            <div
              className="animate-fade-in absolute inset-0 bg-slate-500/60"
              onClick={() => setFilterOpen(false)}
            />
            <div className="animate-dialog-in relative my-8 w-full max-w-5xl rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-800">Filter Students</h2>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Student Status">
                    <MultiSelect
                      options={studentStatuses.map((s) => s.label)}
                      selected={statuses}
                      onChange={(next) => {
                        setStatuses(next)
                        resetToFirst()
                      }}
                      placeholder="- Select -"
                    />
                  </Field>
                  <Field label="Assigned To Staff">
                    <select
                      value={staff}
                      onChange={(e) => {
                        setStaff(e.target.value)
                        resetToFirst()
                      }}
                      className="input"
                    >
                      <option value="">- Select -</option>
                      {studentStaff.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Country Of Residence">
                    <select
                      value={residence}
                      onChange={(e) => {
                        setResidence(e.target.value)
                        resetToFirst()
                      }}
                      className="input"
                    >
                      <option value="">- Select -</option>
                      {residenceCountries.map((c) => (
                        <option key={c}>{c}</option>
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
                      {studentBranches.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* Advanced filters */}
                <div className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Country Interested In">
                    <MultiSelect
                      options={allCountries}
                      selected={countriesInterested}
                      onChange={(next) => {
                        setCountriesInterested(next)
                        resetToFirst()
                      }}
                      placeholder="- Select -"
                    />
                  </Field>
                  <Field label="Study Level">
                    <select
                      value={studyLevel}
                      onChange={(e) => {
                        setStudyLevel(e.target.value)
                        resetToFirst()
                      }}
                      className="input"
                    >
                      <option value="">Select Study Level</option>
                      {studyLevels.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
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
                  <Field label="University">
                    <select
                      value={university}
                      onChange={(e) => {
                        setUniversity(e.target.value)
                        resetToFirst()
                      }}
                      className="input"
                    >
                      <option value="">- Select -</option>
                      {universities.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Source">
                    <select
                      value={source}
                      onChange={(e) => {
                        setSource(e.target.value)
                        resetToFirst()
                      }}
                      className="input"
                    >
                      <option value="">- Select -</option>
                      {studentSources.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Created Date">
                    <input type="date" className="input" />
                  </Field>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
                <button
                  onClick={clearFilters}
                  className="rounded-lg border border-brand-300 bg-white px-6 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
                >
                  Clear
                </button>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

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
                placeholder="ID, Student No, Name, Mobile, Email..."
                className="input w-full pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:flex-1 md:justify-end">
            <ExportButtons
              title="Students"
              filename="students"
              header={exportHeader}
              rows={exportRows}
              onDone={showToast}
            />
          </div>
        </div>

        {/* Table — horizontal scroll below xl so the expanded sidebar never
            pushes the row icons past the card edge; from xl up the wrapper is
            overflow-visible so the sticky header can anchor to the page. */}
        <div className="overflow-x-auto xl:overflow-x-visible">
          <table className="w-full min-w-[900px]">
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
                <th className="bg-slate-50 px-3 py-3">Student</th>
                <th className="bg-slate-50 px-3 py-3">Study Interest</th>
                <th className="bg-slate-50 px-3 py-3">Apps</th>
                <th className="bg-slate-50 px-3 py-3">Status</th>
                <th className="bg-slate-50 px-3 py-3">Assigned to</th>
                <th className="bg-slate-50 px-3 py-3">Created</th>
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
                  {pageRows.map((student) => (
                    <StudentRow
                      key={student.id}
                      student={student}
                      assignedTo={assignees[student.id] ?? null}
                      selected={selected.has(student.id)}
                      onToggle={() => toggleOne(student.id)}
                      onAction={(type) => rowAction(type, student)}
                    />
                  ))}
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-3 py-10 text-center text-sm text-slate-500">
                        No students found.
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
            {filtered.length < students.length && (
              <span className="text-slate-500">
                {' '}
                (filtered from {students.length} total entries)
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
          {studentBulkActions.map((a) => (
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

      <p className="text-xs text-slate-500">
        <span className="font-semibold text-slate-500">Notes:</span> By default all active students
        are shown. "Inactive" and "Withdrawn" students appear only when you pick those statuses in
        the filter.
      </p>

      {/* Assign staff */}
      {assignStudent && (
        <AssignStaffDialog
          lead={assignStudent}
          title="Student - Assign Staff"
          nameLabel="Student Name"
          assignedTo={assignees[assignStudent.id] ?? null}
          staff={studentStaff}
          onClose={() => setAssignStudent(null)}
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
