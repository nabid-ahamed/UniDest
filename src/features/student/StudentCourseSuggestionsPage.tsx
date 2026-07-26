import { useState } from 'react'
import { Download, Check, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { showSuccessDialog } from '../../store/successDialog'
import { currentStudent } from '../../mock/student/portal'
import { finderCourseByTitle } from '../../mock/courseFinder'
import {
  ensureCourseSuggestionsSeed,
  loadFileSuggestions,
  loadCfSuggestions,
  setFileSuggestionAccepted,
  setCfSuggestionAccepted,
  type FileSuggestion,
  type CfSuggestion,
} from '../../mock/courseSuggestions'

/** "Are You Satisfied with this Course Recommendation?" approve / reject toggle. */
function Satisfaction({
  accepted,
  onChange,
}: {
  accepted: string
  onChange: (value: string) => void
}) {
  const isApproved = accepted === 'Approved'
  const isRejected = accepted === 'Rejected'
  return (
    <div className="space-y-2">
      <p className="text-base font-bold text-slate-700">Are You Satisfied with this Course Recommendation?</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange('Approved')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            isApproved
              ? 'bg-emerald-500 text-white'
              : 'border border-emerald-500 text-emerald-600 hover:bg-emerald-50',
          )}
        >
          <Check className="h-4 w-4" /> {isApproved ? 'Approved' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={() => onChange('Rejected')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            isRejected
              ? 'bg-rose-500 text-white'
              : 'border border-rose-400 text-rose-600 hover:bg-rose-50',
          )}
        >
          <X className="h-4 w-4" /> {isRejected ? 'Rejected' : 'Reject'}
        </button>
      </div>
    </div>
  )
}

/** One fact row like "University: <value>". */
function Fact({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <p className="text-sm text-slate-600">
      {label}: <span className={cn(strong ? 'font-bold text-slate-800' : 'text-slate-700')}>{value}</span>
    </p>
  )
}

/** Plain white suggestion card. */
function Card({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
}

export default function StudentCourseSuggestionsPage() {
  const personId = currentStudent().id

  // Seed once (idempotent) before the first read, then track locally.
  const [files, setFiles] = useState<FileSuggestion[]>(() => {
    ensureCourseSuggestionsSeed(personId)
    return loadFileSuggestions(personId)
  })
  const [courses, setCourses] = useState<CfSuggestion[]>(() => loadCfSuggestions(personId))

  const isEmpty = files.length === 0 && courses.length === 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">Course Suggestions / Shortlisted</h1>

      {isEmpty ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center text-sm text-slate-500">
          No course suggestions yet. Your counsellor will share recommendations here.
        </div>
      ) : (
        <div className="space-y-5">
          {/* File suggestions */}
          {files.map((s, i) => {
            const [title, ...rest] = s.file.split(' — ')
            return (
              <Card key={`file-${i}`}>
                <h2 className="text-lg font-bold text-brand-600">{title}</h2>
                <p className="text-sm text-slate-500">{s.date}</p>
                {rest.length > 0 && <p className="text-xs text-slate-400">{rest.join(' — ')}</p>}
                <button
                  type="button"
                  onClick={() => showSuccessDialog('Your document download has started.', 'Downloading')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  <Download className="h-4 w-4" /> Download
                </button>
                <Satisfaction
                  accepted={s.accepted}
                  onChange={(value) => setFiles(setFileSuggestionAccepted(personId, i, value))}
                />
              </Card>
            )
          })}

          {/* Course Finder suggestions */}
          {courses.map((s, i) => {
            const course = finderCourseByTitle(s.course, s.university)
            return (
              <Card key={`cf-${i}`}>
                <h2 className="text-lg font-bold text-brand-600">{s.course}</h2>
                <p className="text-sm text-slate-500">{s.date}</p>
                <Satisfaction
                  accepted={s.accepted}
                  onChange={(value) => setCourses(setCfSuggestionAccepted(personId, i, value))}
                />
                <div className="space-y-1 border-t border-slate-100 pt-4">
                  <Fact label="University" value={s.university} strong />
                  {course && <Fact label="Location" value={`${course.city}, ${course.country}`} />}
                  {course && <Fact label="Study Level" value={course.studyLevel} strong />}
                  <Fact label="Intake" value={s.intake} strong />
                  {course?.durationYears != null && (
                    <Fact
                      label="Duration"
                      value={`${course.durationYears} Year${course.durationYears > 1 ? 's' : ''}`}
                      strong
                    />
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
