import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { Lead } from '../../../mock/leads'

/**
 * "Lead - Assign Staff" modal. Pre-selects the lead's current owner so the
 * dialog doubles as re-assignment.
 */
export function AssignStaffDialog({
  lead,
  assignedTo,
  staff,
  onClose,
  onSave,
}: {
  lead: Lead
  assignedTo: string | null
  staff: string[]
  onClose: () => void
  onSave: (member: string) => void
}) {
  const [value, setValue] = useState(assignedTo ?? '')
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
    if (!value) {
      setError('Please choose a staff member.')
      return
    }
    onSave(value)
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4">
      <div className="animate-fade-in absolute inset-0 bg-slate-500/60" onClick={onClose} />

      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-title"
        className="animate-dialog-in relative my-16 w-full max-w-lg rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="assign-title" className="text-lg font-bold text-slate-800">
            Lead - Assign Staff
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
          <p className="text-sm font-semibold text-slate-700">Lead Name</p>
          <p className="mt-1 text-sm text-slate-600">
            {lead.name} <span className="text-slate-400">(#{lead.id})</span>
          </p>

          <label htmlFor="assign-to" className="mt-5 block text-sm font-semibold text-slate-700">
            Assign To
          </label>
          <select
            id="assign-to"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError('')
            }}
            aria-invalid={!!error}
            aria-describedby={error ? 'assign-error' : undefined}
            className={cn(
              'mt-1.5 w-full max-w-sm rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2',
              error
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
                : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30',
            )}
          >
            <option value="">- Select Staff -</option>
            {staff.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {error && (
            <p id="assign-error" role="alert" className="mt-1.5 text-sm text-rose-600">
              {error}
            </p>
          )}

          <div className="mt-8 flex justify-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-500 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  )
}
