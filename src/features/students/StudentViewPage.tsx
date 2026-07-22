import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import {
  Mail,
  Globe,
  MessageCircle,
  MessageSquare,
  KeyRound,
  LogIn,
  SquarePen,
  UserCog,
  FileSignature,
  Link2,
  Ticket,
  Undo2,
  Trash2,
  Info,
  Pencil,
  UserRoundPlus,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { pickTextColor } from '../../lib/contrast'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  ConfidentialNotes,
  Detail,
  DetailGrid,
  RecordsSection,
} from '../../components/DetailSections'
import { LeadIdentityHeader } from '../leads/components/LeadIdentityHeader'
import { LeadProfileTab } from '../leads/components/LeadProfileTab'
import { LeadCourseSuggestionTab } from '../leads/components/LeadCourseSuggestionTab'
import { LeadCoursePreferencesTab } from '../leads/components/LeadCoursePreferencesTab'
import type { Lead } from '../../mock/leads'
import { students, studentStatuses, type Student } from '../../mock/students'

const TABS = [
  'Overview',
  'Profile',
  'Course Suggestion',
  'Course Preferences',
  'Documents',
  'Applications',
  'Services',
  'Chat',
] as const

const STATUS_KEY = 'unidest-student-status'

function loadStatus(studentId: number): string | null {
  try {
    const all = JSON.parse(localStorage.getItem(STATUS_KEY) ?? '{}')
    return typeof all[studentId] === 'string' ? all[studentId] : null
  } catch {
    return null
  }
}

function saveStatus(studentId: number, status: string) {
  try {
    const all = JSON.parse(localStorage.getItem(STATUS_KEY) ?? '{}')
    all[studentId] = status
    localStorage.setItem(STATUS_KEY, JSON.stringify(all))
  } catch {
    // Storage blocked — the change just won't persist.
  }
}

/**
 * Adapts a Student to the Lead shape so the identity header and the
 * Profile / Course Suggestion / Course Preferences tabs can be reused as-is.
 */
function studentAsLead(s: Student, status: string, statusColor: string): Lead {
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    emailDate: s.emailDate,
    phone: s.phone,
    phoneNote: s.phoneNote,
    whatsapp: false,
    leadAgeDays: 0,
    branch: s.branch,
    status,
    statusColor,
    assignedTo: s.assignedTo,
    created: s.created,
    nextFollowup: null,
    countryInterested: s.countryInterested,
    tags: [],
    studyLevel: s.studyLevel,
    source: s.source,
    countryOfResidence: s.countryOfResidence,
  }
}

/** Student detail page (route /students/:id), matching the reference "View" page. */
export default function StudentViewPage() {
  const { id } = useParams()
  const student = students.find((s) => s.id === Number(id))

  if (!student) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-slate-500">Student not found.</p>
        <a
          href="/students"
          className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Back to Student Management
        </a>
      </div>
    )
  }

  return <StudentView student={student} />
}

function StudentView({ student }: { student: Student }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview')
  const [toast, setToast] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [status, setStatus] = useState(() => loadStatus(student.id) ?? student.status)

  const statusColor =
    studentStatuses.find((s) => s.label === status)?.color ?? student.statusColor
  const asLead = studentAsLead(student, status, statusColor)

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2500)
  }

  const changeStatus = (next: string) => {
    if (next === status) return
    setStatus(next)
    saveStatus(student.id, next)
    showToast(`Status changed to ${next}`)
  }

  const ACTIONS = [
    { label: 'View Support Tickets', icon: Ticket },
    { label: 'Reset Password', icon: KeyRound },
    { label: 'Login as User', icon: LogIn },
    { label: 'Send email', icon: Mail },
    { label: 'Send sms', icon: MessageSquare },
    { label: 'Send Whatsapp', icon: MessageCircle },
    { label: 'Edit Basic Info', icon: SquarePen },
    { label: 'Edit Profile', icon: UserCog },
    { label: 'Student Agreement', icon: FileSignature },
    { label: 'Link to Agent', icon: Link2 },
    { label: 'Country Info Permissions', icon: Globe },
    { label: 'Convert Back To Lead', icon: Undo2 },
  ]

  // Newest first; the top entry reflects a live status change on this page.
  const activities = [
    ...(status !== student.status
      ? [
          {
            text: `STUDENT STATUS CHANGED TO: ${status}, Previous Status: ${student.status}`,
            at: `Today · Admin Admin`,
          },
        ]
      : []),
    { text: 'LEAD CONVERTED', at: `${student.created} · Admin Admin` },
    {
      title: 'Other activity',
      text: `LEAD CREATED & ASSIGNED TO: ${student.assignedTo ?? 'Unassigned'}`,
      at: `${student.created} · System`,
    },
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Identity header */}
      <LeadIdentityHeader lead={asLead} onChat={() => setTab('Chat')} />

      {/* Tabs */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-semibold transition-colors',
              tab === t
                ? 'rounded-t-lg bg-brand-600 text-white'
                : 'bg-slate-100 text-brand-600 hover:bg-slate-200',
            )}
          >
            {t === 'Chat' && <MessageCircle className="h-4 w-4" />}
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' ? (
        <div className="grid grid-cols-1 gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[1fr_20rem]">
          {/* Left column */}
          <div className="min-w-0 space-y-8">
            {/* Status + follow-up row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-slate-700">Status:</span>
                <span
                  className="rounded-md px-2 py-1 text-xs font-semibold"
                  style={{ backgroundColor: statusColor, color: pickTextColor(statusColor) }}
                >
                  {status}
                </span>
                <StatusMenu current={status} onPick={changeStatus} />
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-600">
                  <span className="font-semibold text-slate-700">Next Follow-up:</span> --
                </span>
                <button
                  type="button"
                  onClick={() => showToast('New Follow-up Record — coming soon')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
                >
                  <UserRoundPlus className="h-4 w-4" /> New Follow-up Record
                </button>
              </div>
            </div>

            <section>
              <h2 className="text-lg font-bold text-slate-800">Basic Details</h2>
              <div className="mt-4 rounded-lg border border-slate-200 p-5">
                <DetailGrid
                  rows={[
                    ['Gender', undefined],
                    ['Date of Birth', undefined],
                    ['Interested Study Level', student.studyLevel],
                    ['Country Interested in', student.countryInterested],
                    ['Course Interested to Study', student.course],
                    ['Intake', student.intake],
                    ['Other Services Interested In', undefined],
                    ['Qualification', undefined],
                    ['Passout Year', undefined],
                    ['Score/Grade', undefined],
                    ['Currently Studying Course', undefined],
                  ]}
                />
                <hr className="my-5 border-slate-200" />
                <DetailGrid
                  rows={[
                    ['ID', String(student.id)],
                    ['Branch', student.branch],
                    ['Assigned to Staff', student.assignedTo ?? 'Unassigned'],
                    ['Lead Source', student.source],
                    ['Lead Source Details', undefined],
                  ]}
                />
                <hr className="my-5 border-slate-200" />
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <span className="mt-1 inline-block rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                      Active
                    </span>
                  </div>
                  <Detail label="Last Login At" value="N/A" />
                  <Detail label="Last Login IP" value="N/A" />
                </div>
              </div>
            </section>

            <RecordsSection
              title="Invoices"
              headers={['Date', 'Invoice #', 'Amount']}
              onCreate={() => showToast('Create invoice — coming soon')}
            />

            <RecordsSection
              title="Support Tickets"
              headers={['Ticket', 'Assigned To', 'Status', 'Last Reply']}
              onCreate={() => showToast('Create ticket — coming soon')}
            />

            <section>
              <h2 className="text-lg font-bold text-slate-800">User Activity Log</h2>
              <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200 p-5">
                {activities.map((a, i) => (
                  <div key={i} className={cn('flex items-start gap-3', i > 0 && 'pt-4', i < activities.length - 1 && 'pb-4')}>
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <div>
                      {'title' in a && a.title && (
                        <p className="font-semibold text-slate-800">{a.title}</p>
                      )}
                      <p className={cn('text-sm text-slate-700', 'title' in a && a.title && 'mt-2')}>
                        {a.text}
                      </p>
                      <p className="mt-2 text-sm italic text-slate-500">{a.at}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <p className="border-t border-slate-100 pt-4 text-sm text-slate-500">
              <span className="font-semibold text-slate-600">Created At:</span> {student.created} ·{' '}
              <span className="font-semibold text-slate-600">Last Updated:</span> {student.created}
            </p>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <section className="overflow-hidden rounded-lg border border-slate-200">
              <h2 className="bg-brand-600 px-4 py-3 font-bold text-white">Actions</h2>
              <div className="divide-y divide-slate-100">
                {ACTIONS.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => showToast(`${a.label} — coming soon`)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    <a.icon className="h-4 w-4 text-brand-600" />
                    {a.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setDeleting(true)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="h-4 w-4 text-brand-600" />
                  Delete
                </button>
              </div>
            </section>

            <ConfidentialNotes
              id={student.id}
              storageKey="unidest-student-notes"
              onSaved={() => showToast('Note saved')}
            />
          </div>
        </div>
      ) : tab === 'Profile' ? (
        <div className="px-4 py-6 sm:px-6">
          <LeadProfileTab
            lead={asLead}
            onToast={showToast}
            onEditProfile={() => showToast('Edit student profile — coming soon')}
          />
        </div>
      ) : tab === 'Course Suggestion' ? (
        <div className="px-4 py-6 sm:px-6">
          <LeadCourseSuggestionTab lead={asLead} onToast={showToast} />
        </div>
      ) : tab === 'Course Preferences' ? (
        <div className="px-4 py-6 sm:px-6">
          <LeadCoursePreferencesTab lead={asLead} onToast={showToast} />
        </div>
      ) : (
        <div className="px-4 py-16 text-center sm:px-6">
          <p className="text-slate-500">"{tab}" is still not built yet.</p>
        </div>
      )}

      {/* Delete confirmation */}
      {deleting &&
        createPortal(
          <ConfirmDialog
            open
            title="Delete this student?"
            message={
              <>
                <span className="font-medium text-slate-700">{student.name}</span> (
                {student.studentNo}) will be removed permanently.
              </>
            }
            confirmLabel="Delete"
            onConfirm={() => {
              setDeleting(false)
              showToast('Delete — coming soon (frontend demo)')
            }}
            onCancel={() => setDeleting(false)}
          />,
          document.body,
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

/** Pencil trigger + "Change Status to" dropdown (same pattern as the leads list). */
function StatusMenu({ current, onPick }: { current: string; onPick: (status: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Edit status"
        className="text-brand-600 hover:text-brand-700"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-56 rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg">
          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Change Status to
          </p>
          {studentStatuses.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                setOpen(false)
                onPick(s.label)
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50',
                s.label === current ? 'font-semibold text-brand-700' : 'text-slate-700',
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
