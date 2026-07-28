import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { studentStatuses } from '../../../mock/students'
import { followupModes } from '../../../mock/student/followups'

export interface FollowupInput {
  details: string
  mode: string
  status: string
  next: string // raw datetime-local value, or ''
}

/**
 * "Add Follow-up Record" modal — matches the reference dialog: required
 * follow-up details, mode of communication, resulting application status, and
 * an optional next follow-up date/time. Mirrors the project's other row dialogs
 * (TransferBranch / ChangePassword) for chrome and field styling.
 */
export function NewFollowupDialog({
  studentName,
  currentStatus,
  onClose,
  onSubmit,
}: {
  studentName: string
  currentStatus: string
  onClose: () => void
  onSubmit: (input: FollowupInput) => void
}) {
  const [details, setDetails] = useState('')
  const [mode, setMode] = useState('')
  const [status, setStatus] = useState(currentStatus)
  const [next, setNext] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!details.trim()) return setError('Please enter the follow-up details.')
    if (!mode) return setError('Please choose a mode of communication.')
    if (!status) return setError('Please choose an application status.')
    onSubmit({ details: details.trim(), mode, status, next })
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4">
      <div className="animate-fade-in absolute inset-0 bg-slate-500/60" onClick={onClose} />

      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="followup-title"
        className="animate-dialog-in relative my-16 w-full max-w-lg rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="followup-title" className="text-lg font-bold text-slate-800">
            Add Follow-up Record
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

        <div className="space-y-4 px-6 py-6">
          <p className="text-sm text-slate-500">
            Logging a follow-up for <span className="font-medium text-slate-700">{studentName}</span>.
          </p>

          <div>
            <label htmlFor="fu-details" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Follow-up details <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="fu-details"
              value={details}
              onChange={(e) => {
                setDetails(e.target.value)
                setError('')
              }}
              rows={4}
              placeholder="What was discussed?"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <div>
            <label htmlFor="fu-mode" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Mode of communication <span className="text-rose-500">*</span>
            </label>
            <select
              id="fu-mode"
              value={mode}
              onChange={(e) => {
                setMode(e.target.value)
                setError('')
              }}
              className="input"
            >
              <option value="">Select</option>
              {followupModes.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fu-status" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Application status <span className="text-rose-500">*</span>
            </label>
            <select
              id="fu-status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setError('')
              }}
              className="input"
            >
              <option value="">Select</option>
              {studentStatuses.map((s) => (
                <option key={s.label}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fu-next" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Next Follow-up
            </label>
            <input
              id="fu-next"
              type="datetime-local"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="input"
            />
          </div>

          {error && (
            <p role="alert" className={cn('text-sm text-rose-600')}>
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Submit
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
