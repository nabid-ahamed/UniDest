import { useState } from 'react'
import { Calendar, MapPin, Users, Video, CheckCircle2 } from 'lucide-react'
import { showSuccessDialog } from '../../store/successDialog'
import { currentStudent } from '../../mock/student/portal'
import { upcomingStudentWebinars, parseWebinarDate, type Webinar } from '../../mock/webinars'
import { loadRegistrations, registerForWebinar } from '../../mock/student/webinarRegistrations'

/** "15-08-2026 06:00 PM" → "15 Aug 2026, 06:00 PM". */
function formatWebinarDate(d: string): string {
  const dt = parseWebinarDate(d)
  if (!dt) return d
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(dt)
}

/**
 * "Webinar & Events" — upcoming webinars for the student, derived live from the
 * admin Webinars module (`upcomingStudentWebinars`). Registering persists and
 * bumps the shared enrolment count. Matches demo.eductrl.com/cn4/webinar.
 */
export default function StudentWebinarsPage() {
  const studentId = currentStudent().id
  const [registered, setRegistered] = useState<number[]>(() => loadRegistrations(studentId))
  const webinars = upcomingStudentWebinars()

  const register = (w: Webinar) => {
    setRegistered(registerForWebinar(studentId, w.id))
    showSuccessDialog(`You're registered for "${w.topic}". We'll email you the joining details.`, 'Registered!')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">Webinar &amp; Events</h1>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-brand-600 px-6 py-4 text-lg font-bold text-white">Upcoming Webinar &amp; Events</div>

        {webinars.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">
            No upcoming webinars or events right now. Check back soon!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {webinars.map((w) => {
                  const isReg = registered.includes(w.id)
                  return (
                    <tr key={w.id} className="border-b border-slate-100 text-sm last:border-0 align-top">
                      <td className="whitespace-nowrap px-6 py-5">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                          <Calendar className="h-4 w-4 text-brand-600" /> {formatWebinarDate(w.date)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-800 [overflow-wrap:anywhere]">{w.topic}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {w.venue}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> {w.audienceType}
                          </span>
                        </div>
                        {w.description && (
                          <p className="mt-1.5 max-w-xl text-sm text-slate-600 [overflow-wrap:anywhere]">
                            {w.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap items-center gap-2">
                          {isReg ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                              <CheckCircle2 className="h-4 w-4" /> Registered
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => register(w)}
                              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                            >
                              Register
                            </button>
                          )}
                          {isReg && w.webinarLink && (
                            <a
                              href={w.webinarLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
                            >
                              <Video className="h-4 w-4" /> Join
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
