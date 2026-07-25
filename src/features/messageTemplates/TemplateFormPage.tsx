import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Save, Zap, Tag } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Toggle } from '../cms/components/Toggle'
import {
  channels,
  channelMeta,
  mergeTags,
  formatTag,
  getTemplate,
  getEvent,
  addTemplate,
  updateTemplate,
  type TemplateChannel,
} from '../../mock/messageTemplates'

export default function TemplateFormPage() {
  const params = useParams()
  const channel = (channels.includes(params.channel as TemplateChannel) ? params.channel : 'email') as TemplateChannel
  const meta = channelMeta[channel]
  const editing = params.id != null
  const existing = editing ? getTemplate(Number(params.id)) : undefined

  const [name, setName] = useState(existing?.name ?? '')
  const [subject, setSubject] = useState(existing?.subject ?? '')
  const [body, setBody] = useState(existing?.body ?? '')
  const [enabled, setEnabled] = useState(existing?.enabled ?? true)
  const [error, setError] = useState('')
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const isSystem = existing?.system ?? false
  const ev = getEvent(existing?.eventKey ?? null)

  if (editing && !existing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Template not found.</p>
        <a href={`/message-templates/${channel}`} className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to {meta.label}
        </a>
      </div>
    )
  }

  const insertTag = (token: string) => {
    const tag = formatTag(channel, token)
    const el = bodyRef.current
    if (!el) {
      setBody((b) => b + tag)
      return
    }
    const start = el.selectionStart ?? body.length
    const end = el.selectionEnd ?? body.length
    const next = body.slice(0, start) + tag + body.slice(end)
    setBody(next)
    // Restore caret just after the inserted tag.
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = el.selectionEnd = start + tag.length
    })
  }

  const onSave = () => {
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (!body.trim()) {
      setError('Message body is required.')
      return
    }
    if (editing && existing) {
      updateTemplate(existing.id, { name, subject, body, enabled })
    } else {
      addTemplate({ channel, name, subject, body, enabled })
    }
    window.location.href = `/message-templates/${channel}`
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">
          {editing ? 'Edit' : 'Add'} {meta.nameLabel} Template
        </h1>
        <a
          href={`/message-templates/${channel}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </a>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
      )}

      {ev && (
        <div className="flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-slate-600">
          <Zap className="h-4 w-4 text-brand-500" />
          <span>
            Fires automatically: <span className="font-semibold text-slate-800">{ev.details}</span> —{' '}
            <a href={ev.route} className="font-semibold text-brand-600 hover:underline">
              open {ev.module}
            </a>
          </span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        {/* Main */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-semibold text-slate-700">{meta.nameLabel} Name *</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSystem}
              className="input disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              placeholder="Template name"
            />
            {isSystem && <p className="mt-1 text-xs text-slate-400">Event templates keep their system name.</p>}
          </div>

          {meta.hasSubject && (
            <div>
              <label htmlFor="subject" className="mb-1 block text-sm font-semibold text-slate-700">Subject</label>
              <input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="input" placeholder="Email subject line" />
            </div>
          )}

          <div>
            <label htmlFor="body" className="mb-1 block text-sm font-semibold text-slate-700">{meta.messageLabel} *</label>
            <textarea
              id="body"
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={meta.hasSubject ? 12 : 8}
              className="input resize-y font-mono text-[13px]"
              placeholder="Write the message. Click a merge tag on the right to insert it."
            />
          </div>

          <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
            <Toggle checked={enabled} onChange={setEnabled} label="Enabled" />
            <span className="text-sm font-medium text-slate-700">{enabled ? 'Enabled' : 'Disabled'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onSave}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Save className="h-4 w-4" /> {editing ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </div>

        {/* Merge tags */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Tag className="h-4 w-4 text-brand-500" /> Merge Tags
          </h3>
          <p className="mt-1 text-xs text-slate-500">Click to insert. Each resolves to a real record field.</p>
          <div className="mt-3 space-y-1.5">
            {mergeTags.map((m) => (
              <button
                key={m.token}
                type="button"
                onClick={() => insertTag(m.token)}
                className="group flex w-full items-center justify-between gap-2 rounded-md border border-slate-200 px-2.5 py-1.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50"
                title={m.desc}
              >
                <code className={cn('text-xs font-semibold', 'text-brand-600')}>{formatTag(channel, m.token)}</code>
                <span className="truncate text-[11px] text-slate-400 group-hover:text-slate-500">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
