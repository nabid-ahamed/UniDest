import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Globe,
  GraduationCap,
  Clock,
  BookOpen,
  Banknote,
  ArrowUpCircle,
  PlusCircle,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { MultiSelect } from '../../components/MultiSelect'
import { ExportButtons } from '../../components/ExportButtons'
import { DotsLoader, Field, PageBtn, SingleSelect } from '../../components/DataTableUI'
import { leads, intakes } from '../../mock/leads'
import { students } from '../../mock/students'
import {
  finderCourses,
  finderCountries,
  finderStudyLevels,
  studyAreas,
  disciplineAreas,
  durationBuckets,
  sortOptions,
  intakeMonths,
  finderPageSizes,
  feeAmount,
  inDurationBucket,
  type FinderCourse,
} from '../../mock/courseFinder'

/* ---------- persistence ---------- */

const CF_SUGGESTIONS_KEY = 'unidest-cf-suggestions'
const PROGRAMS_KEY = 'unidest-lead-programs' // shared with the Course Preferences tab

interface CfSuggestion {
  date: string
  course: string
  university: string
  intake: string
  accepted: string
}

function pushToStore<T>(key: string, personId: number, entry: T) {
  try {
    const all = JSON.parse(localStorage.getItem(key) ?? '{}')
    all[personId] = [...(Array.isArray(all[personId]) ? all[personId] : []), entry]
    localStorage.setItem(key, JSON.stringify(all))
  } catch {
    // Storage blocked — the record just won't persist.
  }
}

const today = () =>
  new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(),
  )

/* ---------- people (suggest targets) ---------- */

interface Person {
  id: number
  label: string
  group: 'Students' | 'Leads'
}

const PEOPLE: Person[] = [
  ...students.map((s): Person => ({ id: s.id, label: `${s.name} (${s.studentNo})`, group: 'Students' })),
  ...leads.map((l): Person => ({ id: l.id, label: `${l.name} (Lead #${l.id})`, group: 'Leads' })),
]

const YEARS = ['2026', '2027', '2028']

/* ---------- page ---------- */

export default function CourseFinderPage() {
  // Top search bar (applied on Search, like the reference).
  const [studyLevel, setStudyLevel] = useState('Undergraduate')
  const [countries, setCountries] = useState<string[]>([])
  const [keyword, setKeyword] = useState('')
  const [applied, setApplied] = useState({ studyLevel: 'Undergraduate', countries: [] as string[], keyword: '' })

  // Sidebar filters (live).
  const [personId, setPersonId] = useState<number | ''>('')
  const [studyArea, setStudyArea] = useState('')
  const [discipline, setDiscipline] = useState('Any')
  const [intakeSel, setIntakeSel] = useState<string[]>([])
  const [duration, setDuration] = useState('Any')
  const [sortBy, setSortBy] = useState('Sort By')
  const [scores, setScores] = useState({ ielts: '', ieltsNoBand: '', toefl: '', toeflNoBand: '', pte: '', pteNoBand: '', gre: '', gmat: '' })

  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  // Modals.
  const [suggestCourse, setSuggestCourse] = useState<FinderCourse | null>(null)
  const [prefCourse, setPrefCourse] = useState<FinderCourse | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [commissionCourse, setCommissionCourse] = useState<FinderCourse | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 700)
    return () => window.clearTimeout(t)
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const runSearch = () => {
    setApplied({ studyLevel, countries, keyword })
    setPage(1)
    setLoading(true)
    window.setTimeout(() => setLoading(false), 600)
  }

  const clearAll = () => {
    setStudyLevel('Undergraduate')
    setCountries([])
    setKeyword('')
    setApplied({ studyLevel: 'Undergraduate', countries: [], keyword: '' })
    setPersonId('')
    setStudyArea('')
    setDiscipline('Any')
    setIntakeSel([])
    setDuration('Any')
    setSortBy('Sort By')
    setScores({ ielts: '', ieltsNoBand: '', toefl: '', toeflNoBand: '', pte: '', pteNoBand: '', gre: '', gmat: '' })
    setPage(1)
  }

  const filtered = useMemo(() => {
    const kw = applied.keyword.trim().toLowerCase()
    const atMost = (req: number | null, val: string) => {
      // "My score is X" — show courses requiring at most X. Blank = no filter.
      if (!val.trim()) return true
      if (req == null) return true
      return req <= Number(val)
    }
    let list = finderCourses.filter((c) => {
      if (applied.studyLevel && c.studyLevel !== applied.studyLevel) return false
      if (applied.countries.length && !applied.countries.includes(c.country)) return false
      if (kw && !`${c.title} ${c.university}`.toLowerCase().includes(kw)) return false
      if (studyArea && c.studyArea !== studyArea) return false
      if (discipline !== 'Any' && c.disciplineArea !== discipline) return false
      if (intakeSel.length && !intakeSel.some((m) => c.intakes.includes(m.slice(0, 3)))) return false
      if (!inDurationBucket(c.durationYears, duration)) return false
      if (!atMost(c.ielts, scores.ielts)) return false
      if (!atMost(c.ieltsNoBand, scores.ieltsNoBand)) return false
      if (!atMost(c.toefl, scores.toefl)) return false
      if (!atMost(c.toefl, scores.toeflNoBand)) return false
      if (!atMost(c.pte, scores.pte)) return false
      if (!atMost(c.pte, scores.pteNoBand)) return false
      if (!atMost(c.gre, scores.gre)) return false
      if (!atMost(c.gmat, scores.gmat)) return false
      return true
    })
    if (sortBy === 'IELTS Score Low to High')
      list = [...list].sort((a, b) => (a.ielts ?? 99) - (b.ielts ?? 99))
    else if (sortBy === 'IELTS Score High to Low')
      list = [...list].sort((a, b) => (b.ielts ?? -1) - (a.ielts ?? -1))
    else if (sortBy === 'Course Name') list = [...list].sort((a, b) => a.title.localeCompare(b.title))
    else if (sortBy === 'Course Fee Low to High')
      list = [...list].sort((a, b) => (feeAmount(a) ?? Infinity) - (feeAmount(b) ?? Infinity))
    else if (sortBy === 'Course Fee High to Low')
      list = [...list].sort((a, b) => (feeAmount(b) ?? -1) - (feeAmount(a) ?? -1))
    return list
  }, [applied, studyArea, discipline, intakeSel, duration, sortBy, scores])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((c) => selected.has(c.id))
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) pageRows.forEach((c) => next.delete(c.id))
      else pageRows.forEach((c) => next.add(c.id))
      return next
    })
  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  /* ---------- save actions ---------- */

  const personById = (id: number) => PEOPLE.find((p) => p.id === id)

  const saveSuggestion = (courses: FinderCourse[], pid: number, intake: string) => {
    for (const c of courses)
      pushToStore<CfSuggestion>(CF_SUGGESTIONS_KEY, pid, {
        date: today(),
        course: c.title,
        university: c.university,
        intake,
        accepted: '--',
      })
    showToast(
      courses.length === 1
        ? `"${courses[0].title}" suggested to ${personById(pid)?.label}`
        : `${courses.length} courses suggested to ${personById(pid)?.label}`,
    )
  }

  const savePreference = (c: FinderCourse, pid: number, intake: string, priority: string) => {
    pushToStore(PROGRAMS_KEY, pid, {
      priority,
      country: c.country,
      university: c.university,
      course: c.title,
      intake,
      courseId: String(c.id),
    })
    showToast(`"${c.title}" added to ${personById(pid)?.label}'s course preferences`)
  }

  const exportHeader = ['Id', 'Course', 'University', 'Country', 'Study Level', 'Duration', 'Intakes', 'Tuition Fees']
  const exportRows = filtered.map((c) => [
    c.id,
    c.title,
    c.university,
    c.country,
    c.studyLevel,
    c.durationYears ? `${c.durationYears} year(s)` : '--',
    c.intakes.join(', '),
    c.tuitionFee ?? '--',
  ])

  return (
    <div className="space-y-5">
      {/* Top search card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <h1 className="px-5 pb-2 pt-5 text-xl font-bold text-slate-900">University Course Finder</h1>
        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 px-5 py-5 lg:grid-cols-[1fr_1fr_1.6fr]">
          <Field label="Study Level">
            <select
              value={studyLevel}
              onChange={(e) => setStudyLevel(e.target.value)}
              className="input"
            >
              {finderStudyLevels.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Select Country">
            <MultiSelect
              options={finderCountries}
              selected={countries}
              onChange={setCountries}
              placeholder="Select Country"
            />
          </Field>
          <Field label="Enter a Keyword">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder="Search a Course, University..."
              className="input"
            />
          </Field>
        </div>
        <div className="flex justify-center gap-2 pb-5">
          <button
            onClick={runSearch}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Search className="h-4 w-4" /> Search
          </button>
          <button
            onClick={clearAll}
            className="rounded-lg border border-brand-300 bg-white px-6 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[19rem_1fr]">
        {/* Filter sidebar */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Field label="Select Student">
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value ? Number(e.target.value) : '')}
              className="input"
              aria-label="Select Student"
            >
              <option value="">- Select -</option>
              <optgroup label="Students">
                {PEOPLE.filter((p) => p.group === 'Students').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Leads">
                {PEOPLE.filter((p) => p.group === 'Leads').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </Field>

          <hr className="border-slate-100" />
          <Field label="Study Area">
            <select
              value={studyArea}
              onChange={(e) => {
                setStudyArea(e.target.value)
                setDiscipline('Any')
                setPage(1)
              }}
              className="input"
            >
              <option value="">Study Area</option>
              {studyAreas.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </Field>
          <Field label="Discipline Area">
            <select
              value={discipline}
              onChange={(e) => {
                setDiscipline(e.target.value)
                setPage(1)
              }}
              className="input"
            >
              <option>Any</option>
              {(disciplineAreas[studyArea] ?? []).map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="Intake">
            <MultiSelect
              options={intakeMonths}
              selected={intakeSel}
              onChange={(next) => {
                setIntakeSel(next)
                setPage(1)
              }}
              placeholder="Intake"
            />
          </Field>
          <Field label="Duration">
            <select
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value)
                setPage(1)
              }}
              className="input"
            >
              {durationBuckets.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="Sort">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input">
              {sortOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>

          <ScoreAccordion title="IELTS Score" defaultOpen>
            <ScoreInput label="IELTS Score" value={scores.ielts} onChange={(v) => setScores((p) => ({ ...p, ielts: v }))} />
            <ScoreInput label="IELTS No Band Less Than" value={scores.ieltsNoBand} onChange={(v) => setScores((p) => ({ ...p, ieltsNoBand: v }))} />
          </ScoreAccordion>
          <ScoreAccordion title="TOEFL Score">
            <ScoreInput label="TOEFL Score" value={scores.toefl} onChange={(v) => setScores((p) => ({ ...p, toefl: v }))} />
            <ScoreInput label="TOEFL No Band Less Than" value={scores.toeflNoBand} onChange={(v) => setScores((p) => ({ ...p, toeflNoBand: v }))} />
          </ScoreAccordion>
          <ScoreAccordion title="PTE Scores">
            <ScoreInput label="PTE Score" value={scores.pte} onChange={(v) => setScores((p) => ({ ...p, pte: v }))} />
            <ScoreInput label="PTE No Band Less Than" value={scores.pteNoBand} onChange={(v) => setScores((p) => ({ ...p, pteNoBand: v }))} />
          </ScoreAccordion>
          <ScoreAccordion title="GRE/ GMAT Scores">
            <ScoreInput label="GRE Score" value={scores.gre} onChange={(v) => setScores((p) => ({ ...p, gre: v }))} />
            <ScoreInput label="GMAT Score" value={scores.gmat} onChange={(v) => setScores((p) => ({ ...p, gmat: v }))} />
          </ScoreAccordion>
        </div>

        {/* Results */}
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Show
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="input w-20 py-1.5"
              >
                {finderPageSizes.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              entries
            </label>
            <ExportButtons
              title="Course Finder"
              filename="course-finder"
              header={exportHeader}
              rows={exportRows}
              onDone={showToast}
            />
          </div>

          {/* Select all bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-brand-50 px-4 py-2.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={allOnPageSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Select All
            </label>
            {selected.size > 0 && (
              <button
                onClick={() => setBulkOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
              >
                <ArrowUpCircle className="h-4 w-4" /> Suggest Selected ({selected.size})
              </button>
            )}
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white py-20 shadow-sm">
              <DotsLoader />
            </div>
          ) : pageRows.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500 shadow-sm">
              No courses match your filters.
              <button onClick={clearAll} className="ml-1 font-semibold text-brand-600 hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            pageRows.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                selected={selected.has(c.id)}
                onToggle={() => toggleOne(c.id)}
                onSuggest={() => setSuggestCourse(c)}
                onAddPreference={() => setPrefCourse(c)}
                onShowCommission={() => setCommissionCourse(c)}
              />
            ))
          )}

          {/* Footer */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
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
      </div>

      {/* Modals */}
      {suggestCourse && (
        <SuggestModal
          title="Suggest Course to Student"
          courseLabel={suggestCourse.title}
          initialPerson={personId}
          withMonthYear
          onClose={() => setSuggestCourse(null)}
          onSave={(pid, intake) => {
            saveSuggestion([suggestCourse], pid, intake)
            setSuggestCourse(null)
          }}
        />
      )}
      {bulkOpen && (
        <SuggestModal
          title="Suggest Selected Courses to Student"
          courseLabel={`${selected.size} selected course(s)`}
          initialPerson={personId}
          withMonthYear={false}
          onClose={() => setBulkOpen(false)}
          onSave={(pid, intake) => {
            saveSuggestion(
              finderCourses.filter((c) => selected.has(c.id)),
              pid,
              intake || '--',
            )
            setSelected(new Set())
            setBulkOpen(false)
          }}
        />
      )}
      {prefCourse && (
        <PreferenceModal
          course={prefCourse}
          initialPerson={personId}
          onClose={() => setPrefCourse(null)}
          onSave={(pid, intake, priority) => {
            savePreference(prefCourse, pid, intake, priority)
            setPrefCourse(null)
          }}
        />
      )}
      {commissionCourse && (
        <CommissionModal course={commissionCourse} onClose={() => setCommissionCourse(null)} />
      )}

      {/* Toast */}
      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[110] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

/* ---------- pieces ---------- */

function ScoreAccordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const Chevron = open ? ChevronUp : ChevronDown
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm font-semibold transition-colors',
          open ? 'bg-brand-50 text-brand-700' : 'bg-white text-slate-700 hover:bg-slate-50',
        )}
      >
        {title}
        <Chevron className="h-4 w-4" />
      </button>
      {open && <div className="space-y-3 border-t border-slate-100 p-3.5">{children}</div>}
    </div>
  )
}

function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-600">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className="input"
      />
    </div>
  )
}

function CardField({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Landmark
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="text-sm">
      <p className="flex items-center gap-1.5 font-semibold text-slate-700">
        <Icon className="h-4 w-4 text-slate-500" /> {label}
      </p>
      <div className="mt-0.5 font-bold text-slate-900 [overflow-wrap:anywhere]">{children}</div>
    </div>
  )
}

function CourseCard({
  course: c,
  selected,
  onToggle,
  onSuggest,
  onAddPreference,
  onShowCommission,
}: {
  course: FinderCourse
  selected: boolean
  onToggle: () => void
  onSuggest: () => void
  onAddPreference: () => void
  onShowCommission: () => void
}) {
  const initials = c.university
    .split(' ')
    .filter((w) => /^[A-Z]/.test(w))
    .map((w) => w[0])
    .slice(0, 3)
    .join('')
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-white shadow-sm',
        selected ? 'border-brand-400 ring-1 ring-brand-300' : 'border-slate-200',
      )}
    >
      <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-[10rem_1fr]">
        {/* Logo block */}
        <div className="text-center sm:border-r sm:border-slate-200 sm:pr-5">
          <div
            className={cn(
              'mx-auto flex h-24 w-24 items-center justify-center rounded-lg bg-gradient-to-br text-2xl font-extrabold text-white',
              c.logoClass,
            )}
          >
            {initials}
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-700">{c.city}</p>
          <p className="text-sm font-bold text-slate-800">{c.country}</p>
        </div>

        {/* Details */}
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-brand-600 [overflow-wrap:anywhere]">{c.title}</h2>
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
            <div className="text-sm">
              <span className="font-semibold text-slate-700">Id:</span>{' '}
              <span className="font-bold text-slate-900 tabular-nums">{c.id}</span>
            </div>
            <CardField icon={Landmark} label="">{c.university}</CardField>
            <CardField icon={Globe} label="">{c.country}</CardField>
            <CardField icon={GraduationCap} label="Study Level:">{c.studyLevel}</CardField>
            <CardField icon={Clock} label="Duration:">
              {c.durationYears ? `${c.durationYears} year${c.durationYears > 1 ? 's' : ''}` : '--'}
            </CardField>
            <CardField icon={BookOpen} label="Intakes:">{c.intakes.join(', ') || '--'}</CardField>
            <CardField icon={Banknote} label="Tuition Fees:">{c.tuitionFee ?? '--'}</CardField>
            <CardField icon={Banknote} label="Application Fees:">{c.applicationFee ?? '--'}</CardField>
            <div className="text-sm">
              <p className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Banknote className="h-4 w-4 text-slate-500" /> Commission:
              </p>
              <button
                type="button"
                onClick={onShowCommission}
                className="mt-0.5 font-bold text-brand-600 hover:underline"
              >
                Show
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            aria-label={`Select ${c.title}`}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Select
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onSuggest}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
          >
            <ArrowUpCircle className="h-4 w-4" /> Suggest to Student
          </button>
          <button
            onClick={onAddPreference}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <PlusCircle className="h-4 w-4" /> Add to Student Course Preference
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- modals ---------- */

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="animate-fade-in absolute inset-0 bg-slate-500/60" onClick={onClose} />
      <div className="animate-dialog-in relative w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

function PersonSelect({
  value,
  onChange,
  invalid,
}: {
  value: number | ''
  onChange: (v: number | '') => void
  invalid?: boolean
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        Select Student <span className="text-rose-600">*</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
        className={cn('input', invalid && 'border-rose-500')}
        aria-label="Student"
      >
        <option value="">- Select -</option>
        <optgroup label="Students">
          {PEOPLE.filter((p) => p.group === 'Students').map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="Leads">
          {PEOPLE.filter((p) => p.group === 'Leads').map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </optgroup>
      </select>
      {invalid && (
        <p role="alert" className="mt-1.5 text-sm text-rose-600">
          Please select a student.
        </p>
      )}
    </div>
  )
}

function SuggestModal({
  title,
  courseLabel,
  initialPerson,
  withMonthYear,
  onClose,
  onSave,
}: {
  title: string
  courseLabel: string
  initialPerson: number | ''
  withMonthYear: boolean
  onClose: () => void
  onSave: (personId: number, intake: string) => void
}) {
  const [pid, setPid] = useState<number | ''>(initialPerson)
  const [month, setMonth] = useState('')
  const [year, setYear] = useState(YEARS[0])
  const [tried, setTried] = useState(false)

  const submit = () => {
    setTried(true)
    if (!pid) return
    onSave(pid, withMonthYear && month ? `${month} ${year}` : '--')
  }

  return (
    <ModalShell title={title} onClose={onClose}>
      <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
        {courseLabel}
      </p>
      <PersonSelect value={pid} onChange={setPid} invalid={tried && !pid} />
      {withMonthYear && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Intake Month</label>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="input" aria-label="Intake Month">
              <option value="">- Select -</option>
              {intakeMonths.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Intake Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} className="input" aria-label="Intake Year">
              {YEARS.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Close
        </button>
        <button
          onClick={submit}
          className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
        >
          Suggest
        </button>
      </div>
    </ModalShell>
  )
}

function PreferenceModal({
  course,
  initialPerson,
  onClose,
  onSave,
}: {
  course: FinderCourse
  initialPerson: number | ''
  onClose: () => void
  onSave: (personId: number, intake: string, priority: string) => void
}) {
  const [pid, setPid] = useState<number | ''>(initialPerson)
  const [intake, setIntake] = useState('')
  const [priority, setPriority] = useState('1st Preference')
  const [tried, setTried] = useState(false)

  const submit = () => {
    setTried(true)
    if (!pid || !intake) return
    onSave(pid, intake, priority)
  }

  return (
    <ModalShell title="Add to Student Course Preference" onClose={onClose}>
      <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
        {course.title} — {course.university}
      </p>
      <PersonSelect value={pid} onChange={setPid} invalid={tried && !pid} />
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Intake <span className="text-rose-600">*</span>
        </label>
        <SingleSelect options={intakes} value={intake} onChange={setIntake} placeholder="Intake" />
        {tried && !intake && (
          <p role="alert" className="mt-1.5 text-sm text-rose-600">
            Please select an intake.
          </p>
        )}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Priority</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input" aria-label="Priority">
          {['1st Preference', '2nd Preference', '3rd Preference'].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Close
        </button>
        <button
          onClick={submit}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Add
        </button>
      </div>
    </ModalShell>
  )
}

function CommissionModal({ course, onClose }: { course: FinderCourse; onClose: () => void }) {
  return (
    <ModalShell title="Your Commission" onClose={onClose}>
      <p className="text-sm text-slate-600">
        <span className="font-semibold text-slate-700">Course:</span> {course.title}
      </p>
      <p className="text-lg">
        <span className="font-semibold text-slate-700">Commission Amount:</span>{' '}
        <span className="font-bold text-emerald-600">{course.commission}</span>
      </p>
      <div className="flex justify-end pt-1">
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </ModalShell>
  )
}
