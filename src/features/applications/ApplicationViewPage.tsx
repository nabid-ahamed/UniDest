import { useEffect, useRef, useState } from 'react'
import { showSuccessDialog } from '../../store/successDialog'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Pencil,
  Mail,
  MessageSquare,
  MessageCircle,
  UserRoundPen,
  GraduationCap,
  ExternalLink,
  FileDown,
  Trash2,
  Info,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { pickTextColor } from '../../lib/contrast'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ConfidentialNotes, Detail, DetailGrid, RecordsSection } from '../../components/DetailSections'
import { AssignStaffDialog } from '../leads/components/AssignStaffDialog'
import {
  getApplication,
  applicationStatuses,
  applicationStaff,
  setApplicationStatus,
  setApplicationAssignee,
  deleteApplication,
} from '../../mock/applications'
import { students } from '../../mock/students'

/** Application detail page (route /applications/:id), matching the reference "View" page. */
export default function ApplicationViewPage() {
  const { id } = useParams()
  const app = getApplication(Number(id))

  if (!app) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-slate-500">Application not found.</p>
        <a
          href="/applications"
          className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Back to Applications
        </a>
      </div>
    )
  }

  return <ApplicationView key={app.id} app={app} />
}

function ApplicationView({ app }: { app: NonNullable<ReturnType<typeof getApplication>> }) {
  const navigate = useNavigate()
  const [toast, setToast] = useState('')
  const [status, setStatus] = useState(app.status)
  const [assignedTo, setAssignedTo] = useState(app.assignedTo)
  const [assigning, setAssigning] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Link back to the originating student record when the studentNo matches.
  const student = students.find((s) => s.studentNo === app.studentNo)

  const statusColor =
    applicationStatuses.find((s) => s.label === status)?.color ?? app.statusColor

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2500)
  }

  const changeStatus = (next: string) => {
    if (next === status) return
    setStatus(next)
    setApplicationStatus(app.id, next)
    showToast(`Status changed to ${next}`)
  }

  const saveAssignee = (member: string) => {
    setAssignedTo(member)
    setApplicationAssignee(app.id, member)
    showToast(`Assigned to ${member}`)
    setAssigning(false)
  }

  const ACTIONS = [
    { label: 'Send email', icon: Mail },
    { label: 'Send sms', icon: MessageSquare },
    { label: 'Send Whatsapp', icon: MessageCircle },
    { label: 'Download Offer Letter', icon: FileDown },
  ]

  // Newest first; the top entry reflects a live status change on this page.
  const activities = [
    ...(status !== app.status
      ? [
          {
            text: `APPLICATION STATUS CHANGED TO: ${status}, Previous Status: ${app.status}`,
            at: 'Today · Admin Admin',
          },
        ]
      : []),
    { text: `APPLICATION SUBMITTED THROUGH: ${app.appliedThrough}`, at: `${app.dateCreated} · Admin Admin` },
    {
      title: 'Other activity',
      text: `APPLICATION CREATED & ASSIGNED TO: ${app.assignedTo ?? 'Unassigned'}`,
      at: `${app.dateCreated} · System`,
    },
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Identity header */}
      <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <a
              href="/applications"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
              aria-label="Back to Applications"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <h1 className="text-xl font-bold text-slate-900">Application #{app.id}</h1>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {student ? (
              <a
                href={`/students/${student.id}`}
                className="font-semibold text-brand-600 hover:underline"
              >
                {app.student}
              </a>
            ) : (
              <span className="font-semibold text-slate-700">{app.student}</span>
            )}
            <span className="text-slate-400"> · {app.studentNo}</span>
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-600">
            <GraduationCap className="h-4 w-4 text-slate-400" />
            {app.university} — {app.course}
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-700">Status:</span>
            <span
              className="rounded-md px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: statusColor, color: pickTextColor(statusColor) }}
            >
              {status}
            </span>
            <StatusMenu current={status} onPick={changeStatus} />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Assigned:</span>
            <span className={assignedTo ? 'text-slate-700' : 'text-rose-600'}>
              {assignedTo ?? 'Unassigned'}
            </span>
            <button
              type="button"
              onClick={() => setAssigning(true)}
              aria-label="Re-assign staff"
              title="Re-assign staff"
              className="text-brand-600 hover:text-brand-700"
            >
              <UserRoundPen className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[1fr_20rem]">
        {/* Left column */}
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="text-lg font-bold text-slate-800">Application Details</h2>
            <div className="mt-4 rounded-lg border border-slate-200 p-5">
              <DetailGrid
                rows={[
                  ['Application ID', String(app.id)],
                  ['Date Created', app.dateCreated],
                  ['Student', app.student],
                  ['Study Country', app.country],
                  ['University', app.university],
                  ['Course', app.course],
                  ['Intake', app.intake],
                  ['Applied Through', app.appliedThrough],
                  ['Agent', app.agent ?? undefined],
                ]}
              />
              <hr className="my-5 border-slate-200" />
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <span
                    className="mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: statusColor, color: pickTextColor(statusColor) }}
                  >
                    {status}
                  </span>
                </div>
                <Detail label="Assigned to Staff" value={assignedTo ?? 'Unassigned'} />
                <Detail label="Branch" value={app.branch} />
              </div>
            </div>
          </section>

          <RecordsSection
            title="Documents"
            headers={['Name', 'Type', 'Uploaded', 'Status']}
            onCreate={() => showToast('Upload document — coming soon')}
          />

          <RecordsSection
            title="Invoices"
            headers={['Date', 'Invoice #', 'Amount']}
            onCreate={() => showToast('Create invoice — coming soon')}
          />

          <section>
            <h2 className="text-lg font-bold text-slate-800">Activity Log</h2>
            <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200 p-5">
              {activities.map((a, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-3',
                    i > 0 && 'pt-4',
                    i < activities.length - 1 && 'pb-4',
                  )}
                >
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
            <span className="font-semibold text-slate-600">Created At:</span> {app.dateCreated}
          </p>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <section className="overflow-hidden rounded-lg border border-slate-200">
            <h2 className="bg-brand-600 px-4 py-3 font-bold text-white">Actions</h2>
            <div className="divide-y divide-slate-100">
              {student && (
                <a
                  href={`/students/${student.id}`}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  <ExternalLink className="h-4 w-4 text-brand-600" />
                  View Student
                </a>
              )}
              <button
                type="button"
                onClick={() => setAssigning(true)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                <UserRoundPen className="h-4 w-4 text-brand-600" />
                Assign Staff
              </button>
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
            id={app.id}
            storageKey="unidest-application-notes"
            onSaved={() => showToast('Note saved')}
          />
        </div>
      </div>

      {/* Assign staff */}
      {assigning && (
        <AssignStaffDialog
          lead={{ id: app.id, name: app.student }}
          title="Application - Assign Staff"
          nameLabel="Student Name"
          assignedTo={assignedTo}
          staff={applicationStaff}
          onClose={() => setAssigning(false)}
          onSave={saveAssignee}
        />
      )}

      {/* Delete confirmation */}
      {deleting &&
        createPortal(
          <ConfirmDialog
            open
            title="Delete this application?"
            message={
              <>
                Application <span className="font-medium text-slate-700">#{app.id}</span> (
                {app.student}) will be removed permanently.
              </>
            }
            confirmLabel="Delete"
            onConfirm={() => {
              deleteApplication(app.id)
              setDeleting(false)
              showSuccessDialog(`Application #${app.id} deleted successfully`)
              navigate('/applications')
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

/** Pencil trigger + "Change Status to" dropdown (same pattern as the list rows). */
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
        <div className="absolute right-0 top-full z-30 mt-1.5 w-60 rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg">
          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Change Status to
          </p>
          {applicationStatuses.map((st) => (
            <button
              key={st.label}
              type="button"
              onClick={() => {
                setOpen(false)
                onPick(st.label)
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50',
                st.label === current ? 'font-semibold text-brand-700' : 'text-slate-700',
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: st.color }} />
              {st.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
