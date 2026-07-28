import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../../lib/cn'

/**
 * "Transfer Branch" modal from the lead row's gear menu. Pre-selects the lead's
 * current branch so it doubles as a re-transfer. Mirrors AssignStaffDialog.
 */
export function TransferBranchDialog({
  lead,
  current,
  branches,
  onClose,
  onSave,
}: {
  lead: { id: number; name: string }
  current: string
  branches: string[]
  onClose: () => void
  onSave: (branch: string) => void
}) {
  const [value, setValue] = useState(current ?? '')
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
      setError('Please choose a branch.')
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
        aria-labelledby="transfer-title"
        className="animate-dialog-in relative my-16 w-full max-w-lg rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="transfer-title" className="text-lg font-bold text-slate-800">
            Lead - Transfer Branch
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

          <label htmlFor="transfer-to" className="mt-5 block text-sm font-semibold text-slate-700">
            Transfer To Branch
          </label>
          <select
            id="transfer-to"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError('')
            }}
            aria-invalid={!!error}
            aria-describedby={error ? 'transfer-error' : undefined}
            className={cn(
              'mt-1.5 w-full max-w-sm rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2',
              error
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
                : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30',
            )}
          >
            <option value="">- Select Branch -</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {error && (
            <p id="transfer-error" role="alert" className="mt-1.5 text-sm text-rose-600">
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
