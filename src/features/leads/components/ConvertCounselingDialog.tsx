import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { DateTimePicker } from '../../../components/DateTimePicker'
import type { Lead } from '../../../mock/leads'

/**
 * "Convert Lead to Counselling" modal — shown when a lead's status is changed
 * to Counseling. Requires a counsellor and a counselling date & time.
 */
export function ConvertCounselingDialog({
  lead,
  counsellors,
  initialCounsellor,
  onClose,
  onUpdate,
}: {
  lead: Lead
  counsellors: string[]
  /** Pre-selects the current assignee so re-opening works as "modify". */
  initialCounsellor?: string | null
  onClose: () => void
  onUpdate: (counsellor: string, when: Date) => void
}) {
  const [counsellor, setCounsellor] = useState(initialCounsellor ?? '')
  const [when, setWhen] = useState<Date | null>(null)
  const [errors, setErrors] = useState<{ counsellor?: string; when?: string }>({})

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
    if (!counsellor) next.counsellor = 'Please select a counsellor.'
    if (!when) next.when = 'Please pick a date & time.'
    setErrors(next)
    if (Object.keys(next).length) return
    if (!when) return
    onUpdate(counsellor, when)
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4">
      <div className="animate-fade-in absolute inset-0 bg-slate-500/60" onClick={onClose} />

      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="convert-title"
        className="animate-dialog-in relative my-16 w-full max-w-xl rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="convert-title" className="text-lg font-bold text-slate-800">
            Convert Lead to Counselling
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
          <p className="text-sm text-slate-600">
            {lead.name} <span className="text-slate-400">(#{lead.id})</span>
          </p>

          <label htmlFor="counsellor" className="mt-5 block text-sm font-semibold text-slate-700">
            Select Counsellor <span className="text-rose-600">*</span>
          </label>
          <select
            id="counsellor"
            value={counsellor}
            onChange={(e) => {
              setCounsellor(e.target.value)
              setErrors((prev) => ({ ...prev, counsellor: undefined }))
            }}
            aria-invalid={!!errors.counsellor}
            aria-describedby={errors.counsellor ? 'counsellor-error' : undefined}
            className={cn(
              'mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2',
              errors.counsellor
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
                : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30',
            )}
          >
            <option value="">Select</option>
            {counsellors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.counsellor && (
            <p id="counsellor-error" role="alert" className="mt-1.5 text-sm text-rose-600">
              {errors.counsellor}
            </p>
          )}

          <label htmlFor="counsel-when" className="mt-5 block text-sm font-semibold text-slate-700">
            Counselling Date &amp; Time <span className="text-rose-600">*</span>
          </label>
          <div className="mt-1.5">
            <DateTimePicker
              id="counsel-when"
              value={when}
              onChange={(next) => {
                setWhen(next)
                setErrors((prev) => ({ ...prev, when: undefined }))
              }}
              invalid={!!errors.when}
              describedBy={errors.when ? 'when-error' : undefined}
            />
          </div>
          {errors.when && (
            <p id="when-error" role="alert" className="mt-1.5 text-sm text-rose-600">
              {errors.when}
            </p>
          )}

          <div className="mt-8 flex justify-center">
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Update
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  )
}
