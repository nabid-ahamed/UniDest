import { useState } from 'react'
import { ChevronDown, ChevronUp, PlusCircle, Trash2 } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { SingleSelect } from '../../../components/DataTableUI'
import { intakes, type Lead } from '../../../mock/leads'

interface Program {
  priority: string
  country: string
  university: string
  course: string
  intake: string
  courseId: string
}

const PROGRAMS_KEY = 'unidest-lead-programs'
const PRIORITIES = ['1st Preference', '2nd Preference', '3rd Preference']

/** Small demo catalogue the "Search a Course" flow picks from. */
const COURSE_DB = [
  { id: 'UK-1001', country: 'United Kingdom', university: 'University of Manchester', course: 'MSc Computer Science' },
  { id: 'UK-1002', country: 'United Kingdom', university: 'University of Manchester', course: 'MBA Business Management' },
  { id: 'UK-1003', country: 'United Kingdom', university: 'University of Birmingham', course: 'MSc Data Science' },
  { id: 'UK-1004', country: 'United Kingdom', university: 'University of Birmingham', course: 'LLM International Law' },
  { id: 'US-2001', country: 'United States', university: 'Arizona State University', course: 'MS Software Engineering' },
  { id: 'US-2002', country: 'United States', university: 'Arizona State University', course: 'MBA Finance' },
  { id: 'US-2003', country: 'United States', university: 'University of Texas at Dallas', course: 'MS Information Technology' },
  { id: 'CA-3001', country: 'Canada', university: 'University of Toronto', course: 'MEng Electrical Engineering' },
  { id: 'CA-3002', country: 'Canada', university: 'Conestoga College', course: 'PG Diploma Project Management' },
  { id: 'AU-4001', country: 'Australia', university: 'University of Melbourne', course: 'Master of Public Health' },
  { id: 'AU-4002', country: 'Australia', university: 'Monash University', course: 'Master of Engineering' },
]

function loadPrograms(leadId: number): Program[] {
  try {
    const all = JSON.parse(localStorage.getItem(PROGRAMS_KEY) ?? '{}')
    return Array.isArray(all[leadId]) ? all[leadId] : []
  } catch {
    return []
  }
}

function savePrograms(leadId: number, list: Program[]) {
  try {
    const all = JSON.parse(localStorage.getItem(PROGRAMS_KEY) ?? '{}')
    all[leadId] = list
    localStorage.setItem(PROGRAMS_KEY, JSON.stringify(all))
  } catch {
    // Storage blocked — programs just won't persist.
  }
}

function Bar({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md bg-brand-600 px-4 py-2.5 font-bold text-white">{children}</div>
}

/** Grey collapsible header row (matches the reference accordion sections). */
function Collapsible({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const Chevron = open ? ChevronUp : ChevronDown
  return (
    <div className="rounded-md border border-slate-200">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between bg-slate-100 px-4 py-3 text-left text-base font-medium text-slate-700 transition-colors hover:bg-slate-200"
      >
        {title}
        <Chevron className="h-4 w-4 text-brand-600" />
      </button>
      {open && <div className="p-4 sm:p-5">{children}</div>}
    </div>
  )
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">
      {children} <span className="text-rose-600">*</span>
    </label>
  )
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? (
    <p role="alert" className="mt-1.5 text-sm text-rose-600">
      {msg}
    </p>
  ) : null
}

/** "Course Preferences" tab of the lead detail page. */
export function LeadCoursePreferencesTab({
  lead,
  onToast,
}: {
  lead: Lead
  onToast: (msg: string) => void
}) {
  const [programs, setPrograms] = useState<Program[]>(() => loadPrograms(lead.id))
  const [searchOpen, setSearchOpen] = useState(true)
  const [manualOpen, setManualOpen] = useState(false)

  // "Search a Course" section state.
  const [mode, setMode] = useState<'course' | 'id'>('course')
  const [country, setCountry] = useState('')
  const [university, setUniversity] = useState('')
  const [course, setCourse] = useState('')
  const [intake, setIntake] = useState('')
  const [priority, setPriority] = useState(PRIORITIES[0])
  const [courseId, setCourseId] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // "Manually Add a Program" section state.
  const [mCountry, setMCountry] = useState('')
  const [mUniversity, setMUniversity] = useState('')
  const [mCourse, setMCourse] = useState('')
  const [mIntake, setMIntake] = useState('')
  const [mPriority, setMPriority] = useState(PRIORITIES[0])
  const [mErrors, setMErrors] = useState<Record<string, string>>({})

  const countries = [...new Set(COURSE_DB.map((c) => c.country))]
  const universities = [
    ...new Set(COURSE_DB.filter((c) => c.country === country).map((c) => c.university)),
  ]
  const courses = COURSE_DB.filter((c) => c.university === university).map((c) => c.course)

  const commit = (entry: Program) => {
    if (programs.some((p) => p.course === entry.course && p.university === entry.university)) {
      onToast('This program is already in Selected Programs')
      return false
    }
    const list = [...programs, entry]
    setPrograms(list)
    savePrograms(lead.id, list)
    onToast('Program added to Selected Programs')
    return true
  }

  const addFromSearch = () => {
    const next: Record<string, string> = {}
    if (mode === 'course') {
      if (!country) next.country = 'Please select a country.'
      if (!university) next.university = 'Please select a university.'
      if (!course) next.course = 'Please select a course.'
      if (!intake) next.intake = 'Please select an intake.'
      setErrors(next)
      if (Object.keys(next).length) return
      const hit = COURSE_DB.find((c) => c.university === university && c.course === course)
      if (commit({ priority, country, university, course, intake, courseId: hit?.id ?? '--' })) {
        setCountry('')
        setUniversity('')
        setCourse('')
        setIntake('')
        setPriority(PRIORITIES[0])
      }
    } else {
      const hit = COURSE_DB.find((c) => c.id.toLowerCase() === courseId.trim().toLowerCase())
      if (!courseId.trim()) next.courseId = 'Please enter a course ID.'
      else if (!hit) next.courseId = `No course found with ID "${courseId.trim()}".`
      if (!intake) next.intake = 'Please select an intake.'
      setErrors(next)
      if (Object.keys(next).length || !hit) return
      if (
        commit({
          priority,
          country: hit.country,
          university: hit.university,
          course: hit.course,
          intake,
          courseId: hit.id,
        })
      ) {
        setCourseId('')
        setIntake('')
        setPriority(PRIORITIES[0])
      }
    }
  }

  const addManually = () => {
    const next: Record<string, string> = {}
    if (!mCountry.trim()) next.country = 'Please enter a country.'
    if (!mUniversity.trim()) next.university = 'Please enter a university.'
    if (!mCourse.trim()) next.course = 'Please enter a course.'
    if (!mIntake) next.intake = 'Please select an intake.'
    setMErrors(next)
    if (Object.keys(next).length) return
    if (
      commit({
        priority: mPriority,
        country: mCountry.trim(),
        university: mUniversity.trim(),
        course: mCourse.trim(),
        intake: mIntake,
        courseId: '--',
      })
    ) {
      setMCountry('')
      setMUniversity('')
      setMCourse('')
      setMIntake('')
      setMPriority(PRIORITIES[0])
    }
  }

  const remove = (idx: number) => {
    const list = programs.filter((_, i) => i !== idx)
    setPrograms(list)
    savePrograms(lead.id, list)
    onToast('Program removed')
  }

  const inputCls = (bad?: string) =>
    cn(
      'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2',
      bad
        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
        : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30',
    )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Course Preferences</h2>
        <p className="mt-2 text-sm font-semibold text-slate-700">
          Student Study Level: {lead.studyLevel ?? '--'}
        </p>
      </div>

      <Bar>Add New Program</Bar>

      {/* Search a course */}
      <Collapsible
        title="Search a Course and Select Program"
        open={searchOpen}
        onToggle={() => setSearchOpen((v) => !v)}
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-700">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="cp-mode"
                checked={mode === 'course'}
                onChange={() => {
                  setMode('course')
                  setErrors({})
                }}
                className="h-4 w-4 accent-brand-600"
              />
              Search Course
            </label>
            <span className="font-bold">OR</span>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="cp-mode"
                checked={mode === 'id'}
                onChange={() => {
                  setMode('id')
                  setErrors({})
                }}
                className="h-4 w-4 accent-brand-600"
              />
              Search by Course ID
            </label>
          </div>

          {mode === 'course' ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <FieldLabel>Country</FieldLabel>
                <SingleSelect
                  options={countries}
                  value={country}
                  onChange={(v) => {
                    setCountry(v)
                    setUniversity('')
                    setCourse('')
                    setErrors((p) => ({ ...p, country: '' }))
                  }}
                  placeholder="Country"
                />
                <FieldError msg={errors.country} />
              </div>
              <div>
                <FieldLabel>University</FieldLabel>
                <SingleSelect
                  options={universities}
                  value={university}
                  onChange={(v) => {
                    setUniversity(v)
                    setCourse('')
                    setErrors((p) => ({ ...p, university: '' }))
                  }}
                  placeholder="Select University"
                />
                <FieldError msg={errors.university} />
              </div>
              <div>
                <FieldLabel>Course</FieldLabel>
                <SingleSelect
                  options={courses}
                  value={course}
                  onChange={(v) => {
                    setCourse(v)
                    setErrors((p) => ({ ...p, course: '' }))
                  }}
                  placeholder="Select Course"
                />
                <FieldError msg={errors.course} />
              </div>
              <div>
                <FieldLabel>Intake</FieldLabel>
                <SingleSelect
                  options={intakes}
                  value={intake}
                  onChange={(v) => {
                    setIntake(v)
                    setErrors((p) => ({ ...p, intake: '' }))
                  }}
                  placeholder="Intake"
                />
                <FieldError msg={errors.intake} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <FieldLabel htmlFor="cp-course-id">Course ID</FieldLabel>
                <input
                  id="cp-course-id"
                  value={courseId}
                  onChange={(e) => {
                    setCourseId(e.target.value)
                    setErrors((p) => ({ ...p, courseId: '' }))
                  }}
                  placeholder="e.g. UK-1001"
                  className={inputCls(errors.courseId)}
                />
                <FieldError msg={errors.courseId} />
              </div>
              <div>
                <FieldLabel>Intake</FieldLabel>
                <SingleSelect
                  options={intakes}
                  value={intake}
                  onChange={(v) => {
                    setIntake(v)
                    setErrors((p) => ({ ...p, intake: '' }))
                  }}
                  placeholder="Intake"
                />
                <FieldError msg={errors.intake} />
              </div>
            </div>
          )}

          <div className="max-w-xs">
            <FieldLabel>Priority</FieldLabel>
            <SingleSelect options={PRIORITIES} value={priority} onChange={setPriority} />
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={addFromSearch}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <PlusCircle className="h-4 w-4" /> Add Program
            </button>
          </div>
        </div>
      </Collapsible>

      {/* Manual add */}
      <Collapsible
        title="Manually Add a Program"
        open={manualOpen}
        onToggle={() => setManualOpen((v) => !v)}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
            <div>
              <FieldLabel htmlFor="cp-m-country">Country</FieldLabel>
              <input
                id="cp-m-country"
                value={mCountry}
                onChange={(e) => {
                  setMCountry(e.target.value)
                  setMErrors((p) => ({ ...p, country: '' }))
                }}
                placeholder="Country"
                className={inputCls(mErrors.country)}
              />
              <FieldError msg={mErrors.country} />
            </div>
            <div>
              <FieldLabel htmlFor="cp-m-university">University</FieldLabel>
              <input
                id="cp-m-university"
                value={mUniversity}
                onChange={(e) => {
                  setMUniversity(e.target.value)
                  setMErrors((p) => ({ ...p, university: '' }))
                }}
                placeholder="University name"
                className={inputCls(mErrors.university)}
              />
              <FieldError msg={mErrors.university} />
            </div>
            <div>
              <FieldLabel htmlFor="cp-m-course">Course</FieldLabel>
              <input
                id="cp-m-course"
                value={mCourse}
                onChange={(e) => {
                  setMCourse(e.target.value)
                  setMErrors((p) => ({ ...p, course: '' }))
                }}
                placeholder="Course name"
                className={inputCls(mErrors.course)}
              />
              <FieldError msg={mErrors.course} />
            </div>
            <div>
              <FieldLabel>Intake</FieldLabel>
              <SingleSelect
                options={intakes}
                value={mIntake}
                onChange={(v) => {
                  setMIntake(v)
                  setMErrors((p) => ({ ...p, intake: '' }))
                }}
                placeholder="Intake"
              />
              <FieldError msg={mErrors.intake} />
            </div>
          </div>

          <div className="max-w-xs">
            <FieldLabel>Priority</FieldLabel>
            <SingleSelect options={PRIORITIES} value={mPriority} onChange={setMPriority} />
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={addManually}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <PlusCircle className="h-4 w-4" /> Add Program
            </button>
          </div>
        </div>
      </Collapsible>

      {/* Selected programs */}
      <section className="space-y-4">
        <Bar>Selected Programs</Bar>
        {programs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border border-slate-200">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-left text-sm font-semibold text-slate-700">
                  <th className="px-4 py-2.5">Priority</th>
                  <th className="px-4 py-2.5">Course</th>
                  <th className="px-4 py-2.5">University</th>
                  <th className="px-4 py-2.5">Country</th>
                  <th className="px-4 py-2.5">Intake</th>
                  <th className="px-4 py-2.5">Course ID</th>
                  <th className="px-4 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((p, i) => (
                  <tr key={`${p.course}-${i}`} className="border-b border-slate-100 text-sm odd:bg-slate-50/70">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                      {p.priority}
                    </td>
                    <td className="px-4 py-3 text-slate-700 [overflow-wrap:anywhere]">{p.course}</td>
                    <td className="px-4 py-3 text-slate-600 [overflow-wrap:anywhere]">
                      {p.university}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{p.country}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{p.intake}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-600">
                      {p.courseId}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        aria-label={`Remove ${p.course}`}
                        className="rounded-lg border border-rose-200 p-2 text-rose-600 transition-colors hover:border-rose-600 hover:bg-rose-600 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-md bg-rose-100 px-4 py-3 text-sm text-rose-800">
            No programs found!
          </div>
        )}
      </section>

      <p className="border-t border-slate-200 pt-4 text-sm text-slate-500">
        <span className="font-semibold text-slate-600">Created At:</span> {lead.created} ·{' '}
        <span className="font-semibold text-slate-600">Last Updated:</span> {lead.created}
      </p>
    </div>
  )
}
