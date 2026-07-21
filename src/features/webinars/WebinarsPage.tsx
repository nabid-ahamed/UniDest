import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { PlusCircle, Eye, SquarePen, Users, Trash2, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { DotsLoader } from '../../components/DataTableUI'
import { DateTimePicker, formatDateTime } from '../../components/DateTimePicker'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { SuccessDialog } from '../../components/ui/SuccessDialog'
import {
  webinars as initialWebinars,
  webinarAudienceTypes,
  saveWebinars,
  type Webinar,
} from '../../mock/webinars'

export default function WebinarsPage() {
  const [rows, setRows] = useState<Webinar[]>(initialWebinars)
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Webinar | null>(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [toast, setToast] = useState('')

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

  const addWebinar = (w: Omit<Webinar, 'id' | 'enrolledUsers'>) => {
    setRows((prev) => {
      const next = [
        { ...w, id: Math.max(0, ...prev.map((x) => x.id)) + 1, enrolledUsers: null },
        ...prev,
      ]
      saveWebinars(next)
      return next
    })
    setCreateOpen(false)
    setSuccessMsg('Webinar Created Successfully')
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setRows((prev) => {
      const next = prev.filter((w) => w.id !== deleteTarget.id)
      saveWebinars(next)
      return next
    })
    setDeleteTarget(null)
    setSuccessMsg('Webinar Deleted Successfully')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5 sm:px-6">
          <h1 className="text-xl font-bold text-slate-900">Webinar &amp; Events</h1>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <PlusCircle className="h-4 w-4" /> Create
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto px-4 pb-5 sm:px-6 xl:overflow-x-visible">
          <table className="w-full min-w-[820px] border border-slate-200">
            <thead>
              <tr className="border-b border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Venue</th>
                <th className="px-4 py-3">Audience Type</th>
                <th className="px-4 py-3">Enrolled Users</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16">
                    <DotsLoader />
                  </td>
                </tr>
              ) : rows.length > 0 ? (
                rows.map((w) => (
                  <tr
                    key={w.id}
                    className="border-b border-slate-100 align-top text-sm odd:bg-slate-50/70 hover:bg-brand-50/40"
                  >
                    <td className="max-w-md px-4 py-4 font-medium text-slate-800">{w.topic}</td>
                    <td className="whitespace-nowrap px-4 py-4 tabular-nums text-slate-600">
                      {w.date}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{w.venue}</td>
                    <td className="px-4 py-4 text-slate-600">{w.audienceType}</td>
                    <td className="px-4 py-4 tabular-nums text-slate-600">
                      {w.enrolledUsers ?? '--'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <ActionIcon
                          icon={Eye}
                          label="View"
                          onClick={() => window.location.assign(`/webinars/${w.id}`)}
                          className="border-brand-300 text-brand-600 hover:border-brand-600 hover:bg-brand-600 hover:text-white"
                        />
                        <ActionIcon
                          icon={SquarePen}
                          label="Edit"
                          onClick={() => window.location.assign(`/webinars/${w.id}/edit`)}
                          className="border-sky-300 text-sky-600 hover:border-sky-600 hover:bg-sky-600 hover:text-white"
                        />
                        <ActionIcon
                          icon={Users}
                          label="Enrolled users"
                          onClick={() => window.location.assign(`/webinars/${w.id}/enrolled`)}
                          className="border-emerald-300 text-emerald-600 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
                        />
                        <ActionIcon
                          icon={Trash2}
                          label="Delete"
                          onClick={() => setDeleteTarget(w)}
                          className="border-rose-300 text-rose-600 hover:border-rose-600 hover:bg-rose-600 hover:text-white"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No webinars or events yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create webinar */}
      {createOpen && (
        <CreateWebinarDialog onClose={() => setCreateOpen(false)} onCreate={addWebinar} />
      )}

      {/* Delete confirmation */}
      {deleteTarget &&
        createPortal(
          <ConfirmDialog
            open
            title="Delete this webinar?"
            message={
              <>
                <span className="font-medium text-slate-700">{deleteTarget.topic}</span> will be
                removed permanently.
              </>
            }
            confirmLabel="Delete"
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />,
          document.body,
        )}

      {/* Success */}
      {successMsg &&
        createPortal(
          <SuccessDialog open message={successMsg} onOk={() => setSuccessMsg('')} />,
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

function ActionIcon({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: typeof Eye
  label: string
  onClick: () => void
  className?: string
}) {
  // Instant CSS tooltip — the native title attribute takes ~1s to appear.
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
          className,
        )}
      >
        <Icon className="h-4 w-4" />
      </button>
      <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-slate-700 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </div>
  )
}

/** "Create Webinar/Event" modal — topic, date & time, venue, audience type. */
function CreateWebinarDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (w: { topic: string; date: string; venue: string; audienceType: Webinar['audienceType'] }) => void
}) {
  const [topic, setTopic] = useState('')
  const [when, setWhen] = useState<Date | null>(null)
  const [venue, setVenue] = useState('')
  const [audience, setAudience] = useState<Webinar['audienceType']>('Student')
  const [errors, setErrors] = useState<{ topic?: string; when?: string; venue?: string }>({})

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!topic.trim()) next.topic = 'Please enter a topic.'
    if (!when) next.when = 'Please pick a date & time.'
    if (!venue.trim()) next.venue = 'Please enter a venue.'
    setErrors(next)
    if (Object.keys(next).length || !when) return
    onCreate({ topic: topic.trim(), date: formatDateTime(when), venue: venue.trim(), audienceType: audience })
  }

  const fieldClass = (invalid: boolean) =>
    cn(
      'mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2',
      invalid
        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
        : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30',
    )

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4">
      <div className="animate-fade-in absolute inset-0 bg-slate-500/60" onClick={onClose} />

      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-webinar-title"
        className="animate-dialog-in relative my-16 w-full max-w-xl rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="create-webinar-title" className="text-lg font-bold text-slate-800">
            Create Webinar / Event
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <label htmlFor="webinar-topic" className="block text-sm font-semibold text-slate-700">
            Topic <span className="text-rose-600">*</span>
          </label>
          <input
            id="webinar-topic"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value)
              setErrors((prev) => ({ ...prev, topic: undefined }))
            }}
            placeholder="e.g. Study in Canada — Info Session"
            aria-invalid={!!errors.topic}
            className={fieldClass(!!errors.topic)}
          />
          {errors.topic && (
            <p role="alert" className="mt-1.5 text-sm text-rose-600">
              {errors.topic}
            </p>
          )}

          <label htmlFor="webinar-when" className="mt-5 block text-sm font-semibold text-slate-700">
            Date &amp; Time <span className="text-rose-600">*</span>
          </label>
          <div className="mt-1.5">
            <DateTimePicker
              id="webinar-when"
              value={when}
              onChange={(next) => {
                setWhen(next)
                setErrors((prev) => ({ ...prev, when: undefined }))
              }}
              invalid={!!errors.when}
            />
          </div>
          {errors.when && (
            <p role="alert" className="mt-1.5 text-sm text-rose-600">
              {errors.when}
            </p>
          )}

          <label htmlFor="webinar-venue" className="mt-5 block text-sm font-semibold text-slate-700">
            Venue <span className="text-rose-600">*</span>
          </label>
          <input
            id="webinar-venue"
            value={venue}
            onChange={(e) => {
              setVenue(e.target.value)
              setErrors((prev) => ({ ...prev, venue: undefined }))
            }}
            placeholder="Online / branch name"
            aria-invalid={!!errors.venue}
            className={fieldClass(!!errors.venue)}
          />
          {errors.venue && (
            <p role="alert" className="mt-1.5 text-sm text-rose-600">
              {errors.venue}
            </p>
          )}

          <label htmlFor="webinar-audience" className="mt-5 block text-sm font-semibold text-slate-700">
            Audience Type
          </label>
          <select
            id="webinar-audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value as Webinar['audienceType'])}
            className={fieldClass(false)}
          >
            {webinarAudienceTypes.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>

          <div className="mt-8 flex justify-center">
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Create
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  )
}
