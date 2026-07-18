import { useEffect } from 'react'

interface SuccessDialogProps {
  open: boolean
  message: string
  okLabel?: string
  onOk: () => void
}

export function SuccessDialog({ open, message, okLabel = 'OK', onOk }: SuccessDialogProps) {
  // Close on Escape / Enter.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onOk()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onOk])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-500/60" onClick={onOk} />

      <div className="animate-dialog-in relative w-full max-w-md rounded-2xl bg-white px-8 py-10 text-center shadow-xl">
        {/* Animated checkmark */}
        <svg viewBox="0 0 52 52" className="mx-auto h-24 w-24">
          <circle className="checkmark-circle" cx="26" cy="26" r="24" />
          <path className="checkmark-check" d="M15 27l7 7 15-15" />
        </svg>

        <h2 className="mt-6 text-xl font-bold text-slate-700">{message}</h2>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onOk}
            className="rounded-lg bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
