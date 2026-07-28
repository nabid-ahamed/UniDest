import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { appDocStatuses, appDocTypes } from '../../../mock/applicationRecords'

/** Shared modal chrome for the small "Add …" record dialogs. */
function Dialog({
  title,
  onClose,
  onSubmit,
  children,
}: {
  title: string
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  children: React.ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4">
      <div className="animate-fade-in absolute inset-0 bg-slate-500/60" onClick={onClose} />
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        className="animate-dialog-in relative my-16 w-full max-w-lg rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-6">{children}</div>
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
            Add
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

export interface DocumentInput {
  name: string
  type: string
  status: string
}

/** "Add Document" — name + type + status. */
export function AddDocumentDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (input: DocumentInput) => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState(appDocTypes[0] as string)
  const [status, setStatus] = useState(appDocStatuses[0] as string)
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Please enter a document name.')
    onSubmit({ name: name.trim(), type, status })
  }

  return (
    <Dialog title="Add Document" onClose={onClose} onSubmit={submit}>
      <div>
        <label htmlFor="doc-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
          Document Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="doc-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          className="input"
          placeholder="e.g. Offer Letter.pdf"
        />
      </div>
      <div>
        <label htmlFor="doc-type" className="mb-1.5 block text-sm font-semibold text-slate-700">
          Type
        </label>
        <select id="doc-type" value={type} onChange={(e) => setType(e.target.value)} className="input">
          {appDocTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="doc-status" className="mb-1.5 block text-sm font-semibold text-slate-700">
          Status
        </label>
        <select
          id="doc-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input"
        >
          {appDocStatuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </Dialog>
  )
}

export interface InvoiceInput {
  number: string
  currency: string
  amount: string
}

const CURRENCIES = ['USD', 'GBP', 'EUR', 'AUD', 'CAD', 'BDT']

/** "Create Invoice" — invoice # (auto-suggested) + currency + amount. */
export function AddInvoiceDialog({
  suggestedNumber,
  onClose,
  onSubmit,
}: {
  suggestedNumber: string
  onClose: () => void
  onSubmit: (input: InvoiceInput) => void
}) {
  const [number, setNumber] = useState(suggestedNumber)
  const [currency, setCurrency] = useState('USD')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!number.trim()) return setError('Please enter an invoice number.')
    const value = Number(amount)
    if (!amount.trim() || Number.isNaN(value) || value <= 0)
      return setError('Please enter a valid amount.')
    onSubmit({ number: number.trim(), currency, amount: value.toFixed(2) })
  }

  return (
    <Dialog title="Create Invoice" onClose={onClose} onSubmit={submit}>
      <div>
        <label htmlFor="inv-number" className="mb-1.5 block text-sm font-semibold text-slate-700">
          Invoice # <span className="text-rose-500">*</span>
        </label>
        <input
          id="inv-number"
          value={number}
          onChange={(e) => {
            setNumber(e.target.value)
            setError('')
          }}
          className="input"
        />
      </div>
      <div className="grid grid-cols-[8rem_1fr] gap-3">
        <div>
          <label htmlFor="inv-cur" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Currency
          </label>
          <select
            id="inv-cur"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="input"
          >
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="inv-amt" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Amount <span className="text-rose-500">*</span>
          </label>
          <input
            id="inv-amt"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setError('')
            }}
            className="input"
            placeholder="0.00"
          />
        </div>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </Dialog>
  )
}
