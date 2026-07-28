import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { leads } from '../../mock/leads'
import { templatesFor } from '../../mock/messageTemplates'
import { showSuccessDialog } from '../../store/successDialog'

/**
 * Send SMS page (route /leads/:id/sms) — the "Send sms" action from the lead
 * detail Actions panel redirects here, matching the reference
 * (Dashboard / Broadcast / SMS User → "Send SMS"). Simpler than the email page:
 * User + Mobile, a template selector and a single message box. Prototype: no real send.
 */
export default function SendSmsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const lead = leads.find((l) => l.id === Number(id))

  const smsTemplates = useMemo(() => templatesFor('sms'), [])
  const [templateId, setTemplateId] = useState('')
  const [message, setMessage] = useState('')

  if (!lead) {
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
    showSuccessDialog(`SMS sent to ${lead.name} (${lead.phone}).`, 'SMS Sent')
    navigate(`/leads/${lead.id}`)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold text-slate-800">Send SMS</h1>

      <div className="mt-4 space-y-1.5 text-sm">
        <p className="text-slate-600">
          <span className="font-semibold text-slate-700">User:</span> {lead.name}
        </p>
        <p className="text-slate-600">
          <span className="font-semibold text-slate-700">Mobile:</span> {lead.phone || '—'}
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
          onClick={() => navigate(`/leads/${lead.id}`)}
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
