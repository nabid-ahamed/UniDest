import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface OtherBreakDialogProps {
  open: boolean
  onConfirm: (durationSec: number, hint: string) => void
  onCancel: () => void
}

export function OtherBreakDialog({ open, onConfirm, onCancel }: OtherBreakDialogProps) {
  const [value, setValue] = useState('15')
  const [unit, setUnit] = useState<'Min' | 'Hr'>('Min')
  const [notes, setNotes] = useState('')

  // Reset the form each time the dialog opens.
  useEffect(() => {
    if (open) {
      setValue('15')
      setUnit('Min')
      setNotes('')
    }
  }, [open])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const handleOk = () => {
    const n = Math.max(1, Math.floor(Number(value) || 0))
    const durationSec = unit === 'Hr' ? n * 3600 : n * 60
    onConfirm(durationSec, `${n} ${unit}`)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-500/60" onClick={onCancel} />

      <div className="animate-dialog-in relative w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">Other Break</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Duration</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as 'Min' | 'Hr')}
                className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Min">Min</option>
                <option value="Hr">Hr</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add a note (optional)"
              className="w-full resize-y rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-slate-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleOk}
            className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
