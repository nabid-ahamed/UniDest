import { useState } from 'react'
import { cn } from '../../lib/cn'
import { LeadIdentityHeader } from '../leads/components/LeadIdentityHeader'
import { LeadCoursePreferencesTab } from '../leads/components/LeadCoursePreferencesTab'
import { StudentDocumentsTab } from './StudentDocumentsTab'
import { StudentProfileForm } from './StudentProfileForm'
import { currentStudent } from '../../mock/student/portal'
import { studentAsLead } from '../../mock/students'

const TABS = ['Profile', 'Course Preferences', 'Documents'] as const
type Tab = (typeof TABS)[number]

/**
 * Study Abroad Apply — the student-facing counterpart to the admin student
 * detail tabs. Reuses the lead Profile / Course Preferences tabs verbatim via
 * `studentAsLead`, plus a portal Documents tab, so there is no duplicate logic.
 */
export default function StudentApplyPage() {
  const [tab, setTab] = useState<Tab>('Profile')
  const [rev, setRev] = useState(0) // bump to re-read the student after a save
  const [toast, setToast] = useState('')

  // `updateStudent` mutates the shared record in place, so re-reading here after
  // a `rev` bump reflects the saved profile changes.
  void rev
  const student = currentStudent()
  const lead = studentAsLead(student)

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2500)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">Apply for Study Abroad</h1>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <LeadIdentityHeader lead={lead} />

        {/* Tabs */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-semibold transition-colors',
                tab === t
                  ? 'rounded-t-lg bg-brand-600 text-white'
                  : 'bg-slate-100 text-brand-600 hover:bg-slate-200',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="px-4 py-6 sm:px-6">
          {tab === 'Profile' ? (
            <StudentProfileForm student={student} onSaved={() => setRev((n) => n + 1)} />
          ) : tab === 'Course Preferences' ? (
            <LeadCoursePreferencesTab lead={lead} onToast={showToast} />
          ) : (
            <StudentDocumentsTab onToast={showToast} />
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
