import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, X } from 'lucide-react'
import { showSuccessDialog } from '../../store/successDialog'
import { useCreateApplication, useStudents, useCourses, useAssignableStaff } from '../../lib/api'
import { applicationStatuses } from '../../mock/applications'

/** Submission channels the API accepts (Application.appliedThrough). */
const APPLIED_THROUGH = ['DIRECT', 'Applyboard', 'Adventus', 'INTO Global']

/**
 * Create a university application.
 *
 * This is the last piece of the core funnel that existed in the API but not on
 * screen: the mock had no id generator, so applications could only ever be read.
 * The student, course and assignee pickers read the API rather than mock lists,
 * because the record they create is keyed on real rows.
 */
export default function AddApplicationPage() {
  const navigate = useNavigate()
  const createApplication = useCreateApplication()
  const [error, setError] = useState('')

  const { data: students = [], isPending: studentsPending } = useStudents()
  const { data: courses = [] } = useCourses()
  const { data: staff = [] } = useAssignableStaff()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const fd = new FormData(e.currentTarget)
    const get = (key: string) => String(fd.get(key) ?? '').trim()

    const studentNo = get('studentNo')
    if (!studentNo) {
      setError('Choose the student this application belongs to.')
      return
    }

    createApplication.mutate(
      {
        studentNo,
        course: get('course') || undefined,
        intake: get('intake') || undefined,
        status: get('status') || undefined,
        assignedTo: get('assignedTo') || undefined,
        appliedThrough: get('appliedThrough') || undefined,
        agent: get('agent') || undefined,
      },
      {
        onSuccess: (app) => {
          showSuccessDialog('Application Created Successfully', 'Created!')
          navigate(`/applications/${app.id}`)
        },
        onError: (err) =>
          setError(err instanceof Error ? err.message : 'Could not create the application.'),
      },
    )
  }

  const field = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30'
  const label = 'mb-1.5 block text-sm font-semibold text-slate-700'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">New University Application</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {error && (
          <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="studentNo">
              Student <span className="text-rose-500">*</span>
            </label>
            <select id="studentNo" name="studentNo" required className={field} defaultValue="">
              <option value="" disabled>
                {studentsPending ? 'Loading students…' : 'Select a student'}
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.studentNo}>
                  {s.name} ({s.studentNo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={label} htmlFor="course">
              Course
            </label>
            <input
              id="course"
              name="course"
              list="course-options"
              placeholder="e.g. BSc Computer Science"
              className={field}
            />
            {/* A datalist rather than a select: the catalog is long, and the
                field is free text on the server. */}
            <datalist id="course-options">
              {courses.slice(0, 200).map((c) => (
                <option key={c.id} value={c.title} />
              ))}
            </datalist>
          </div>

          <div>
            <label className={label} htmlFor="intake">
              Intake
            </label>
            <input id="intake" name="intake" placeholder="e.g. September 2026" className={field} />
            {/* Resolved against the intakes recorded for the chosen course, so a
                month the course does not offer is stored as blank rather than
                inventing one. */}
            <p className="mt-1 text-xs text-slate-500">Must match an intake offered by the course.</p>
          </div>

          <div>
            <label className={label} htmlFor="status">
              Status
            </label>
            <select id="status" name="status" className={field} defaultValue="">
              <option value="">Use the default</option>
              {applicationStatuses.map((s) => (
                <option key={s.label} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={label} htmlFor="assignedTo">
              Assigned to
            </label>
            <select id="assignedTo" name="assignedTo" className={field} defaultValue="">
              <option value="">Unassigned</option>
              {staff.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name} — {m.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={label} htmlFor="appliedThrough">
              Applied through
            </label>
            <select id="appliedThrough" name="appliedThrough" className={field} defaultValue="DIRECT">
              {APPLIED_THROUGH.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={label} htmlFor="agent">
              Agent
            </label>
            <input id="agent" name="agent" placeholder="Optional" className={field} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={createApplication.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {createApplication.isPending ? 'Creating…' : 'Create Application'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/applications')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <X className="h-4 w-4" /> Cancel
          </button>
        </div>
      </div>
    </form>
  )
}
