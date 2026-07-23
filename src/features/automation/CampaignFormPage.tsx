import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Mail,
  MessageSquare,
  Send,
  Calculator,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { Field } from '../../components/DataTableUI'
import {
  audienceTargets,
  statusOptionsFor,
  allCountries,
  matchedUsers,
  messageVariables,
  addCampaign,
  type AudienceTarget,
} from '../../mock/automation'

const RTE_ACTIONS = [
  { cmd: 'bold', icon: Bold, label: 'Bold' },
  { cmd: 'italic', icon: Italic, label: 'Italic' },
  { cmd: 'underline', icon: Underline, label: 'Underline' },
  { cmd: 'insertUnorderedList', icon: List, label: 'Bulleted list' },
  { cmd: 'insertOrderedList', icon: ListOrdered, label: 'Numbered list' },
  { cmd: 'undo', icon: Undo2, label: 'Undo' },
  { cmd: 'redo', icon: Redo2, label: 'Redo' },
]

const SMS_LIMIT = 160

export default function CampaignFormPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState<AudienceTarget>('Leads')
  const [status, setStatus] = useState('')
  const [country, setCountry] = useState('')
  const [showMatched, setShowMatched] = useState(false)
  const [mode, setMode] = useState<'Email' | 'SMS'>('Email')
  const [smsText, setSmsText] = useState('')
  const [runAt, setRunAt] = useState('')
  const [testTo, setTestTo] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState('')
  const editorRef = useRef<HTMLDivElement>(null)

  const matched = useMemo(
    () => matchedUsers({ target, status, country }),
    [target, status, country],
  )

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const currentMessage = () => (mode === 'Email' ? (editorRef.current?.innerText ?? '') : smsText)

  const create = (sendNow: boolean) => {
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = 'Please enter a title.'
    if (!currentMessage().trim()) next.message = 'Please write a message.'
    if (!sendNow && !runAt) next.runAt = 'Pick a date & time or use Send Now.'
    setErrors(next)
    if (Object.keys(next).length) return

    const scheduledAt = sendNow
      ? 'Just now'
      : new Date(runAt)
          .toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })
          .replace(/\//g, '-')
          .toUpperCase()

    addCampaign({
      title: title.trim(),
      status: sendNow ? 'Sent' : 'Queued',
      scheduledAt,
      mode,
      sentTo: sendNow ? matched : 0,
      audience: { target, status, country },
      message: currentMessage().trim(),
    })
    navigate('/automation/campaigns')
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Add New Campaign</h1>
        <a
          href="/automation/campaigns"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </a>
      </div>

      <div className="mt-6 max-w-3xl space-y-5">
        {/* Title */}
        <div>
          <label htmlFor="cp-title" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Title <span className="text-rose-600">*</span>
          </label>
          <input
            id="cp-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setErrors((p) => ({ ...p, title: '' }))
            }}
            className={cn('input', errors.title && 'border-rose-500')}
          />
          {errors.title && (
            <p role="alert" className="mt-1.5 text-sm text-rose-600">
              {errors.title}
            </p>
          )}
        </div>

        {/* Target audience */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Target Audience *">
            <select
              value={target}
              onChange={(e) => {
                setTarget(e.target.value as AudienceTarget)
                setStatus('')
                setShowMatched(false)
              }}
              className="input"
            >
              {audienceTargets.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setShowMatched(false)
              }}
              className="input"
            >
              <option value="">- Any -</option>
              {statusOptionsFor(target).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Country Interested">
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value)
                setShowMatched(false)
              }}
              className="input"
            >
              <option value="">- Any -</option>
              {allCountries.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Matched audience */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
          <p className="text-sm text-slate-600">
            Matched Audience:{' '}
            {showMatched ? (
              <span className="font-bold text-brand-600">{matched}</span>
            ) : (
              <span className="text-slate-400">—</span>
            )}
          </p>
          <button
            type="button"
            onClick={() => setShowMatched(true)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
          >
            <Calculator className="h-4 w-4" /> Calculate
          </button>
        </div>

        {/* Email / SMS */}
        <div className="flex items-center gap-6">
          {(['Email', 'SMS'] as const).map((t) => (
            <label key={t} className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-800">
              <input
                type="radio"
                name="cp_mode"
                checked={mode === t}
                onChange={() => {
                  setMode(t)
                  setErrors((p) => ({ ...p, message: '' }))
                }}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="inline-flex items-center gap-1.5">
                {t === 'Email' ? <Mail className="h-4 w-4 text-brand-600" /> : <MessageSquare className="h-4 w-4 text-brand-600" />}
                {t}
              </span>
            </label>
          ))}
        </div>

        {/* Message composer */}
        {mode === 'Email' ? (
          <div
            className={cn(
              'overflow-hidden rounded-lg border',
              errors.message ? 'border-rose-500' : 'border-slate-300',
            )}
          >
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
              {RTE_ACTIONS.map((a) => (
                <button
                  key={a.cmd}
                  type="button"
                  aria-label={a.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editorRef.current?.focus()
                    document.execCommand(a.cmd)
                  }}
                  className="rounded p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
                >
                  <a.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <div
              ref={editorRef}
              contentEditable
              role="textbox"
              aria-multiline="true"
              aria-label="Campaign message"
              suppressContentEditableWarning
              onInput={() => setErrors((p) => ({ ...p, message: '' }))}
              className="min-h-56 whitespace-pre-wrap px-4 py-3 text-sm text-slate-800 focus:outline-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
            />
          </div>
        ) : (
          <div>
            <textarea
              value={smsText}
              onChange={(e) => {
                setSmsText(e.target.value)
                setErrors((p) => ({ ...p, message: '' }))
              }}
              rows={5}
              aria-label="Campaign SMS message"
              className={cn('input', errors.message && 'border-rose-500')}
            />
            <p
              className={cn(
                'mt-1 text-right text-xs',
                smsText.length > SMS_LIMIT ? 'font-semibold text-rose-600' : 'text-slate-500',
              )}
            >
              {smsText.length}/{SMS_LIMIT} characters
              {smsText.length > SMS_LIMIT && ` · ${Math.ceil(smsText.length / SMS_LIMIT)} SMS parts`}
            </p>
          </div>
        )}
        {errors.message && (
          <p role="alert" className="text-sm text-rose-600">
            {errors.message}
          </p>
        )}

        {/* Variables note */}
        <div className="rounded-lg bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-slate-700">Note:</p>
          <p className="mt-0.5 text-slate-600">Following variables can be used in the message content:</p>
          <ul className="mt-2 space-y-0.5">
            {messageVariables.map((v) => (
              <li key={v.token} className="text-slate-600">
                <span className="font-mono font-semibold text-brand-600">{v.token}</span> — {v.desc}
              </li>
            ))}
          </ul>
        </div>

        {/* Test message */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-700">Test campaign message</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="cp-test" className="text-sm font-medium text-slate-600">
              Send To:
            </label>
            <input
              id="cp-test"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="email@example.com"
              className="input flex-1"
            />
            <button
              type="button"
              onClick={() =>
                testTo.trim()
                  ? showToast(`Test message sent to ${testTo.trim()}`)
                  : showToast('Enter a recipient for the test')
              }
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Send className="h-4 w-4" /> Send Message
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Note: Any personalization variables will be replaced with blank in this message.
          </p>
        </div>

        {/* Run at / Send now */}
        <div>
          <label htmlFor="cp-runat" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Run at <span className="text-rose-600">*</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="cp-runat"
              type="datetime-local"
              value={runAt}
              onChange={(e) => {
                setRunAt(e.target.value)
                setErrors((p) => ({ ...p, runAt: '' }))
              }}
              className={cn('input sm:w-64', errors.runAt && 'border-rose-500')}
            />
            <span className="text-sm text-slate-500">OR</span>
            <button
              type="button"
              onClick={() => create(true)}
              className="rounded-lg bg-slate-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
            >
              Send Now
            </button>
          </div>
          {errors.runAt && (
            <p role="alert" className="mt-1.5 text-sm text-rose-600">
              {errors.runAt}
            </p>
          )}
        </div>

        <div className="flex justify-center gap-3 border-t border-slate-100 pt-5">
          <button
            onClick={() => create(false)}
            className="rounded-lg bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Create
          </button>
          <a
            href="/automation/campaigns"
            className="rounded-lg border border-slate-300 bg-white px-8 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </a>
        </div>
      </div>

      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[120] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
