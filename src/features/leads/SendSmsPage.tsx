import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { templatesFor } from '../../mock/messageTemplates'
import { showSuccessDialog } from '../../store/successDialog'
import { useMessageRecipient } from '../broadcast/useMessageRecipient'

/**
 * Send SMS page — the "Send sms" action from a lead OR application detail
 * Actions panel redirects here (routes /leads/:id/sms and /applications/:id/sms),
 * matching the reference (Broadcast / SMS User → "Send SMS"). The recipient is
 * resolved from the route. Prototype: no real send.
 */
export default function SendSmsPage() {
  const navigate = useNavigate()
  const recipient = useMessageRecipient()

  const smsTemplates = useMemo(() => templatesFor('sms'), [])
  const [templateId, setTemplateId] = useState('')
  const [message, setMessage] = useState('')

  if (!recipient) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-slate-500">Recipient not found.</p>
        <button
          onClick={() => navigate('/leads')}
          className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Back to Lead Management
        </button>
      </div>
    )
  }

  const applyTemplate = (value: string) => {
    setTemplateId(value)
    const t = smsTemplates.find((x) => String(x.id) === value)
    if (t) setMessage(t.body)
  }

  const send = () => {
    if (!message.trim()) {
      showSuccessDialog('Please write a message before sending.', 'Message Required')
      return
    }
    showSuccessDialog(`SMS sent to ${recipient.name} (${recipient.phone}).`, 'SMS Sent')
    navigate(recipient.backTo)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold text-slate-800">Send SMS</h1>

      <div className="mt-4 space-y-1.5 text-sm">
        <p className="text-slate-600">
          <span className="font-semibold text-slate-700">User:</span> {recipient.name}
        </p>
        <p className="text-slate-600">
          <span className="font-semibold text-slate-700">Mobile:</span> {recipient.phone || '—'}
        </p>
      </div>

      {/* Template selector */}
      <div className="mt-6">
        <select
          value={templateId}
          onChange={(e) => applyTemplate(e.target.value)}
          className="input"
          aria-label="Select a template"
        >
          <option value="">Select a template or type message</option>
          {smsTemplates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700">Message</label>
          <span className="text-xs text-slate-400">{message.length} characters</span>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="input"
          placeholder="Message"
        />
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          onClick={() => navigate(recipient.backTo)}
          className="rounded-lg border border-slate-300 bg-white px-6 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={send}
          className="rounded-lg bg-brand-600 px-8 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Send
        </button>
      </div>
    </div>
  )
}
