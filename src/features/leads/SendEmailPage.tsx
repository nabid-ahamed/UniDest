import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  List,
  ListOrdered,
  Image as ImageIcon,
  Table,
  Quote,
  Code,
  Paperclip,
} from 'lucide-react'
import { leads } from '../../mock/leads'
import { templatesFor } from '../../mock/messageTemplates'
import { showSuccessDialog } from '../../store/successDialog'

/** Default signature appended to a new email (matches the reference layout). */
const SIGNATURE = '\n\nThank You,\nGourav Kumar\nGlobalEd Support'
const FROM = 'Portal <no-reply@globaled.inbox.mailtrap.io>'

/**
 * Send Email page (route /leads/:id/email) — the "Send email" action from the
 * lead detail Actions panel redirects here, matching the reference
 * (Dashboard / Broadcast / Mail User → "Send Email"). Prototype: no real send.
 */
export default function SendEmailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const lead = leads.find((l) => l.id === Number(id))

  const emailTemplates = useMemo(() => templatesFor('email'), [])
  const [templateId, setTemplateId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState(SIGNATURE)
  const [files, setFiles] = useState<File[]>([])

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
    const t = emailTemplates.find((x) => String(x.id) === value)
    if (t) {
      setSubject(t.subject || '')
      setBody(`${t.body}${SIGNATURE}`)
    }
  }

  const send = () => {
    if (!subject.trim()) {
      showSuccessDialog('Please add a subject before sending.', 'Subject Required')
      return
    }
    if (!body.trim()) {
      showSuccessDialog('Please write a message before sending.', 'Message Required')
      return
    }
    showSuccessDialog(`Email sent to ${lead.name} (${lead.email}).`, 'Email Sent')
    navigate(`/leads/${lead.id}`)
  }

  const toolbar = [Bold, Italic, Underline, LinkIcon, List, ListOrdered, ImageIcon, Table, Quote, Code]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold text-slate-800">Send Email</h1>

      <div className="mt-4 space-y-1.5 text-sm">
        <p className="text-slate-600">
          <span className="font-semibold text-slate-700">To:</span> {lead.name}{' '}
          <span className="text-slate-400">&lt;{lead.email}&gt;</span>
        </p>
        <p className="text-slate-600">
          <span className="font-semibold text-slate-700">From:</span> {FROM}
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
          {emailTemplates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subject */}
      <div className="mt-5">
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="input"
          placeholder="Subject"
        />
      </div>

      {/* Message with a lightweight rich-text toolbar (visual only — prototype) */}
      <div className="mt-5">
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Message</label>
        <div className="overflow-hidden rounded-lg border border-slate-300">
          <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
            <select className="mr-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600" aria-label="Format">
              <option>Paragraph</option>
              <option>Heading 1</option>
              <option>Heading 2</option>
            </select>
            {toolbar.map((Icon, i) => (
              <button
                key={i}
                type="button"
                className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
                tabIndex={-1}
                aria-label="Formatting"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="block w-full resize-y border-0 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-0"
            placeholder="Write your message…"
          />
        </div>
      </div>

      {/* Attachments */}
      <div className="mt-5">
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Attachments</label>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-500 transition-colors hover:bg-slate-50">
          <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-3 py-1 font-medium text-slate-600">
            <Paperclip className="h-4 w-4" /> Choose Files
          </span>
          <span>{files.length ? files.map((f) => f.name).join(', ') : 'No file chosen'}</span>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
        </label>
        <p className="mt-1.5 text-xs text-slate-400">Note: File size limit is 5MB</p>
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
