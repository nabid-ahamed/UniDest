import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, RefreshCw } from 'lucide-react'

/**
 * "Change Password" modal from the lead row's gear menu — matches the reference
 * (/auth/user/:id/lead/password/change): new + confirm password, with a
 * generator. Prototype: no password is stored; it just validates + confirms.
 */
export function ChangePasswordDialog({
  lead,
  onClose,
  onSave,
}: {
  lead: { id: number; name: string; email: string }
  onClose: () => void
  onSave: () => void
}) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
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
    if (pw.length < 6) return setError('Password must be at least 6 characters.')
    if (pw !== pw2) return setError('Passwords do not match.')
    onSave()
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4">
      <div className="animate-fade-in absolute inset-0 bg-slate-500/60" onClick={onClose} />

      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pw-title"
        className="animate-dialog-in relative my-16 w-full max-w-lg rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="pw-title" className="text-lg font-bold text-slate-800">
            Change Password
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
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">User</label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
              {lead.name} · {lead.email}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">New Password</label>
              <button
                type="button"
                onClick={() => {
                  const g = Math.random().toString(36).slice(-8)
                  setPw(g)
                  setPw2(g)
                  setError('')
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                <RefreshCw className="h-3 w-3" /> Generate
              </button>
            </div>
            <input
              value={pw}
              onChange={(e) => {
                setPw(e.target.value)
                setError('')
              }}
              className="input"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Confirm Password</label>
            <input
              value={pw2}
              onChange={(e) => {
                setPw2(e.target.value)
                setError('')
              }}
              className="input"
              placeholder="Re-enter new password"
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}
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
            Change Password
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
