import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2, RotateCcw, Info } from 'lucide-react'
import {
  getReminderMessages,
  setReminderMessage,
  deleteReminderMessage,
  resetReminderMessages,
} from '../../../mock/reminderMessages'
import { applicationStatuses } from '../../../mock/applications'

/**
 * Editor for the dashboard reminder messages, keyed by application status.
 * Admins add / edit / remove the "next action" line shown for each application
 * on the dashboard's Reminders list. Changes persist to localStorage
 * immediately (via the mock store) and are reflected on the next dashboard load.
 */
export function ReminderMessagesDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved?: (msg: string) => void
}) {
  const [map, setMap] = useState<Record<string, string>>(() => getReminderMessages())
  const [newStatus, setNewStatus] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [error, setError] = useState('')

  const rows = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]))

  // Statuses that don't yet have a message — offered in the "add" dropdown.
  const unused = applicationStatuses.map((s) => s.label).filter((label) => !(label in map))

  const saveRow = (status: string, message: string) => {
    setMap(setReminderMessage(status, message))
    onSaved?.(`Reminder message updated for “${status}”.`)
  }

  const removeRow = (status: string) => {
    setMap(deleteReminderMessage(status))
    onSaved?.(`Reminder message removed for “${status}”.`)
  }

  const addRow = () => {
    const status = newStatus.trim()
    const message = newMessage.trim()
    if (!status) return setError('Pick or type a status.')
    if (!message) return setError('Enter a reminder message.')
    if (status in map) return setError('That status already has a message — edit it below.')
    setMap(setReminderMessage(status, message))
    setNewStatus('')
    setNewMessage('')
    setError('')
    onSaved?.(`Reminder message added for “${status}”.`)
  }

  const doReset = () => {
    setMap(resetReminderMessages())
    onSaved?.('Reminder messages reset to defaults.')
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4">
      <div className="animate-fade-in absolute inset-0 bg-slate-500/60" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reminder messages"
        className="animate-dialog-in relative my-8 w-full max-w-2xl rounded-xl bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Reminder Messages</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              The next-action line shown for each application status on the dashboard reminders.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] space-y-5 overflow-y-auto px-6 py-5">
          {/* Existing rules */}
          <div className="space-y-3">
            {rows.length === 0 && (
              <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500">
                No reminder messages yet. Add one below.
              </p>
            )}
            {rows.map(([status, message]) => (
              <RuleRow
                key={status}
                status={status}
                message={message}
                onSave={(msg) => saveRow(status, msg)}
                onDelete={() => removeRow(status)}
              />
            ))}
          </div>

          {/* Add new */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">Add a message</p>
            <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
                <input
                  list="reminder-status-options"
                  value={newStatus}
                  onChange={(e) => { setNewStatus(e.target.value); setError('') }}
                  className="input w-full"
                  placeholder="Select or type"
                />
                <datalist id="reminder-status-options">
                  {unused.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Message</label>
                <div className="flex items-center gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => { setNewMessage(e.target.value); setError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && addRow()}
                    className="input w-full flex-1"
                    placeholder="e.g. Follow up for the offer letter"
                  />
                  <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                  >
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>
              </div>
            </div>
            {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
          </div>

          <p className="flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            A status with no message shows no reminder (e.g. Withdrawn). Changes appear on the
            dashboard on its next load.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={doReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" /> Reset to defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** One editable status→message row: inline-editable message + delete. */
function RuleRow({
  status,
  message,
  onSave,
  onDelete,
}: {
  status: string
  message: string
  onSave: (message: string) => void
  onDelete: () => void
}) {
  const [value, setValue] = useState(message)
  const dirty = value.trim() !== message

  return (
    <div className="grid gap-3 sm:grid-cols-[12rem_1fr] sm:items-center">
      <span className="truncate text-sm font-semibold text-slate-700" title={status}>
        {status}
      </span>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && dirty && onSave(value)}
          className="input w-full flex-1"
        />
        <button
          type="button"
          onClick={() => onSave(value)}
          disabled={!dirty}
          className="shrink-0 rounded-lg border border-brand-300 bg-white px-3 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50 disabled:opacity-40"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Remove message for ${status}`}
          className="shrink-0 rounded-lg border border-rose-300 bg-white p-2 text-rose-600 transition-colors hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
