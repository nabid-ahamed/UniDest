import { useMemo, useState } from 'react'
import {
  Search,
  Landmark,
  GraduationCap,
  Clock,
  BookOpen,
  Banknote,
  Bookmark,
  Send,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { SingleSelect } from '../../components/DataTableUI'
import { HighlightMatch } from '../../components/ui/HighlightMatch'
import { showSuccessDialog } from '../../store/successDialog'
import { currentStudent } from '../../mock/student/portal'
import {
  finderCountries,
  finderStudyLevels,
  studyAreas,
  disciplineAreas,
  durationBuckets,
  sortOptions,
  feeAmount,
  inDurationBucket,
  type FinderCourse,
} from '../../mock/courseFinder'
import { useCourses } from '../../lib/api'
import { loadBookmarks, toggleBookmark, applyToCourse } from '../../mock/student/finderActions'

const ANY_LEVEL = 'Any Study Level'
const ALL_COUNTRIES = 'All Countries'

export default function StudentCourseFinderPage() {
  const { data: finderCourses = [] } = useCourses()
  const studentId = currentStudent().id

  const [keyword, setKeyword] = useState('')
  const [studyLevel, setStudyLevel] = useState(ANY_LEVEL)
  const [country, setCountry] = useState(ALL_COUNTRIES)
  const [studyArea, setStudyArea] = useState('')
  const [discipline, setDiscipline] = useState('Any')
  const [duration, setDuration] = useState('Any')
  const [sortBy, setSortBy] = useState('Sort By')

  const [bookmarks, setBookmarks] = useState<number[]>(() => loadBookmarks(studentId))
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const clearAll = () => {
    setKeyword('')
    setStudyLevel(ANY_LEVEL)
    setCountry(ALL_COUNTRIES)
    setStudyArea('')
    setDiscipline('Any')
    setDuration('Any')
    setSortBy('Sort By')
  }

  const results = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    let list = finderCourses.filter((c) => {
      if (studyLevel !== ANY_LEVEL && c.studyLevel !== studyLevel) return false
      if (country !== ALL_COUNTRIES && c.country !== country) return false
      if (studyArea && c.studyArea !== studyArea) return false
      if (discipline !== 'Any' && c.disciplineArea !== discipline) return false
      if (!inDurationBucket(c.durationYears, duration)) return false
      if (kw && !`${c.title} ${c.university}`.toLowerCase().includes(kw)) return false
      return true
    })
    if (sortBy === 'Course Name') list = [...list].sort((a, b) => a.title.localeCompare(b.title))
    else if (sortBy === 'IELTS Score Low to High')
      list = [...list].sort((a, b) => (a.ielts ?? 99) - (b.ielts ?? 99))
    else if (sortBy === 'IELTS Score High to Low')
      list = [...list].sort((a, b) => (b.ielts ?? -1) - (a.ielts ?? -1))
    else if (sortBy === 'Course Fee Low to High')
      list = [...list].sort((a, b) => (feeAmount(a) ?? Infinity) - (feeAmount(b) ?? Infinity))
    else if (sortBy === 'Course Fee High to Low')
      list = [...list].sort((a, b) => (feeAmount(b) ?? -1) - (feeAmount(a) ?? -1))
    return list
  }, [finderCourses, keyword, studyLevel, country, studyArea, discipline, duration, sortBy])

  const onBookmark = (c: FinderCourse) => {
    const next = toggleBookmark(studentId, c.id)
    setBookmarks(next)
    showToast(next.includes(c.id) ? `"${c.title}" bookmarked` : `"${c.title}" removed from bookmarks`)
  }

  const onApply = (c: FinderCourse) => {
    if (applyToCourse(studentId, c)) {
      showSuccessDialog(
        `"${c.title}" has been added to your Course Preferences. Our team will review your application shortly.`,
        'Applied!',
      )
    } else {
      showToast('This course is already in your Course Preferences')
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero + search */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 px-6 py-10 text-center shadow-sm sm:px-10">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Find Your Perfect Course Abroad</h1>
        <p className="mt-2 text-brand-100">Explore thousands of programs at top universities worldwide</p>

        <div className="mx-auto mt-7 flex max-w-4xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-lg sm:flex-row sm:rounded-full">
          <div className="flex flex-1 items-center gap-2 px-3">
            <Search className="h-5 w-5 shrink-0 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Course or university name…"
              className="w-full bg-transparent py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <div className="sm:w-52">
            <SingleSelect
              options={[ANY_LEVEL, ...finderStudyLevels]}
              value={studyLevel}
              onChange={setStudyLevel}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[18rem_1fr]">
        {/* Filters */}
        <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Filters</h2>
            <button
              type="button"
              onClick={clearAll}
              className="text-sm font-semibold text-brand-600 hover:underline"
            >
              Clear all
            </button>
          </div>

          <FilterGroup label="Destination">
            <SingleSelect options={[ALL_COUNTRIES, ...finderCountries]} value={country} onChange={setCountry} />
          </FilterGroup>

          <FilterGroup label="Study Level">
            <SingleSelect options={[ANY_LEVEL, ...finderStudyLevels]} value={studyLevel} onChange={setStudyLevel} />
          </FilterGroup>

          <FilterGroup label="Study Area">
            <SingleSelect
              options={['Any Study Area', ...studyAreas]}
              value={studyArea || 'Any Study Area'}
              onChange={(v) => {
                setStudyArea(v === 'Any Study Area' ? '' : v)
                setDiscipline('Any')
              }}
            />
          </FilterGroup>

          <FilterGroup label="Discipline">
            <SingleSelect
              options={['Any', ...(disciplineAreas[studyArea] ?? [])]}
              value={discipline}
              onChange={setDiscipline}
              placeholder={studyArea ? 'Any' : 'Select Study Area first'}
            />
          </FilterGroup>

          <FilterGroup label="Duration">
            <SingleSelect options={durationBuckets} value={duration} onChange={setDuration} />
          </FilterGroup>
        </aside>

        {/* Results */}
        <div className="min-w-0 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              <span className="text-lg font-bold text-slate-900">{results.length}</span> courses found
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Sort:
              <div className="w-52">
                <SingleSelect options={sortOptions} value={sortBy} onChange={setSortBy} />
              </div>
            </label>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500 shadow-sm">
              No courses match your filters.
              <button onClick={clearAll} className="ml-1 font-semibold text-brand-600 hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            results.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                query={keyword}
                bookmarked={bookmarks.includes(c.id)}
                onBookmark={() => onBookmark(c)}
                onApply={() => onApply(c)}
              />
            ))
          )}
        </div>
      </div>

      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[60] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 border-t border-slate-100 pt-4 first-of-type:border-t-0 first-of-type:pt-0">
      <p className="text-sm font-bold text-slate-700">{label}</p>
      {children}
    </div>
  )
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Landmark
  label: string
  value: string
}) {
  return (
    <div className="text-sm">
      <p className="flex items-center gap-1.5 text-slate-500">
        <Icon className="h-4 w-4" /> {label}
      </p>
      <p className="mt-0.5 font-bold text-slate-800 [overflow-wrap:anywhere]">{value}</p>
    </div>
  )
}

function CourseCard({
  course: c,
  query,
  bookmarked,
  onBookmark,
  onApply,
}: {
  course: FinderCourse
  query: string
  bookmarked: boolean
  onBookmark: () => void
  onApply: () => void
}) {
  const initials = c.university
    .split(' ')
    .filter((w) => /^[A-Z]/.test(w))
    .map((w) => w[0])
    .slice(0, 3)
    .join('')
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-[7rem_1fr] sm:p-6">
        <div
          className={cn(
            'flex h-24 w-24 items-center justify-center rounded-xl bg-gradient-to-br text-2xl font-extrabold text-white',
            c.logoClass,
          )}
        >
          {initials}
        </div>

        <div className="min-w-0">
          <h2 className="text-xl font-bold text-brand-600 [overflow-wrap:anywhere]">
            <HighlightMatch text={c.title} query={query} />
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">
              <HighlightMatch text={c.university} query={query} />
            </span> · {c.city}, {c.country}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Fact icon={GraduationCap} label="Study Level" value={c.studyLevel} />
            <Fact
              icon={Clock}
              label="Duration"
              value={c.durationYears ? `${c.durationYears} year${c.durationYears > 1 ? 's' : ''}` : '--'}
            />
            <Fact icon={BookOpen} label="Intakes" value={c.intakes.join(', ') || '--'} />
            <Fact icon={Banknote} label="Application Fees" value={c.applicationFee ?? '--'} />
            <Fact icon={Banknote} label="Tuition Fees" value={c.tuitionFee ?? '--'} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
        <button
          type="button"
          onClick={onBookmark}
          aria-pressed={bookmarked}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors',
            bookmarked
              ? 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700'
              : 'border-brand-300 bg-white text-brand-600 hover:bg-brand-50',
          )}
        >
          <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-current')} />
          {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </button>
        <button
          type="button"
          onClick={onApply}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Send className="h-4 w-4" /> Apply
        </button>
      </div>
    </div>
  )
}
