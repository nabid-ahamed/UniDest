import { useEffect, type ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  message?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-500/60" onClick={onCancel} />

      <div className="animate-dialog-in relative w-full max-w-md rounded-2xl bg-white px-8 py-10 text-center shadow-xl">
        {/* Warning circle */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-300">
          <span className="text-4xl font-semibold text-amber-400">!</span>
        </div>

        <h2 className="mt-6 text-2xl font-bold text-slate-700">{title}</h2>
        {message && <p className="mt-3 text-slate-500">{message}</p>}

        <div className="mt-8 flex justify-center gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-slate-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-600"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
