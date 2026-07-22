import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  History,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  X,
  Send,
  Mail,
  MessageSquare,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { MultiSelect } from '../../components/MultiSelect'
import { Field } from '../../components/DataTableUI'
import {
  targetGroups,
  leadStatuses,
  studentStatuses,
  allCountries,
  emailTemplates,
  smsTemplates,
  resolveRecipients,
  addBroadcast,
} from '../../mock/broadcast'

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

export default function BroadcastPage() {
  const [target, setTarget] = useState('')
  const [country, setCountry] = useState('')
  const [leadStatusSel, setLeadStatusSel] = useState<string[]>([])
  const [studentStatusSel, setStudentStatusSel] = useState<string[]>([])
  const [excludeAgentStudents, setExcludeAgentStudents] = useState(false)
  const [msgType, setMsgType] = useState<'email' | 'sms' | ''>('')
  const [emailTemplate, setEmailTemplate] = useState('')
  const [subject, setSubject] = useState('')
  const [smsTemplate, setSmsTemplate] = useState('')
  const [smsText, setSmsText] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toast, setToast] = useState('')
  const editorRef = useRef<HTMLDivElement>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 3000)
  }

  const applyEmailTemplate = (name: string) => {
    setEmailTemplate(name)
    const t = emailTemplates.find((x) => x.name === name)
    if (!t) return
    setSubject(t.subject)
    if (editorRef.current) editorRef.current.innerText = t.body
  }

  const applySmsTemplate = (name: string) => {
    setSmsTemplate(name)
    const t = smsTemplates.find((x) => x.name === name)
    if (t) setSmsText(t.body)
  }

  const recipients = resolveRecipients({
    target,
    country,
    leadStatusSel,
    studentStatusSel,
    excludeAgentStudents,
  })

  const continueClicked = () => {
    const next: Record<string, string> = {}
    if (!target) next.target = 'Please select a target group.'
    if (!msgType) next.msgType = 'Please choose Email or SMS.'
    if (msgType === 'email') {
      if (!subject.trim()) next.subject = 'Please enter a subject.'
      if (!editorRef.current?.innerText.trim()) next.message = 'Please write a message.'
    }
    if (msgType === 'sms' && !smsText.trim()) next.message = 'Please write a message.'
    setErrors(next)
    if (Object.keys(next).length) return
    if (recipients.length === 0) {
      showToast('No recipients match the selected filters')
      return
    }
    setConfirmOpen(true)
  }

  const send = () => {
    const message = msgType === 'email' ? (editorRef.current?.innerText ?? '') : smsText
    addBroadcast({
      dateTime: new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
      })
        .format(new Date())
        .replace(' ', ' ') +
        ', ' +
        new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          .format(new Date())
          .toLowerCase()
          .replace(' ', ''),
      type: msgType as 'email' | 'sms',
      subject: msgType === 'email' ? subject.trim() : '--',
      message,
      sentTo: recipients,
      staff: 'Admin Admin',
    })
    setConfirmOpen(false)
    showToast(`Broadcast sent to ${recipients.length} recipient(s)`)
    // Reset the form.
    setTarget('')
    setCountry('')
    setLeadStatusSel([])
    setStudentStatusSel([])
    setExcludeAgentStudents(false)
    setMsgType('')
    setEmailTemplate('')
    setSubject('')
    setSmsTemplate('')
    setSmsText('')
    if (editorRef.current) editorRef.current.innerHTML = ''
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {/* Heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Broadcast</h1>
        <a
          href="/broadcast/history"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <History className="h-4 w-4" /> Broadcast History
        </a>
      </div>

      <div className="mt-6 max-w-4xl space-y-5">
        {/* Target group */}
        <div>
          <label htmlFor="bc-target" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Target Group
          </label>
          <select
            id="bc-target"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value)
              setErrors((p) => ({ ...p, target: '' }))
            }}
            className={cn('input', errors.target && 'border-rose-500')}
          >
            <option value="">Select Target Group</option>
            {targetGroups.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          {errors.target && (
            <p role="alert" className="mt-1.5 text-sm text-rose-600">
              {errors.target}
            </p>
          )}
        </div>

        {/* Conditional filters */}
        {target === 'Leads' && (
          <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2">
            <Field label="Country Interested">
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="input">
                <option value="">Country Interested to Study In</option>
                <option>-ANY-</option>
                {allCountries.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Lead Status">
              <MultiSelect
                options={leadStatuses.map((s) => s.label)}
                selected={leadStatusSel}
                onChange={setLeadStatusSel}
                placeholder="- Any status -"
              />
            </Field>
          </div>
        )}
        {target === 'Students' && (
          <div className="grid grid-cols-1 items-end gap-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2">
            <Field label="Student Status">
              <MultiSelect
                options={studentStatuses.map((s) => s.label)}
                selected={studentStatusSel}
                onChange={setStudentStatusSel}
                placeholder="- Any status -"
              />
            </Field>
            <label className="flex items-center gap-2 pb-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={excludeAgentStudents}
                onChange={(e) => setExcludeAgentStudents(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Exclude agent students
            </label>
          </div>
        )}
        {target && (
          <p className="text-sm text-slate-500">
            Matching recipients:{' '}
            <span className="font-semibold text-brand-600">{recipients.length}</span>
          </p>
        )}

        {/* Email / SMS */}
        <div>
          <div className="flex items-center gap-6">
            {(['email', 'sms'] as const).map((t) => (
              <label key={t} className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-800">
                <input
                  type="radio"
                  name="msg_type"
                  checked={msgType === t}
                  onChange={() => {
                    setMsgType(t)
                    setErrors((p) => ({ ...p, msgType: '', message: '', subject: '' }))
                  }}
                  className="h-4 w-4 accent-brand-600"
                />
                {t === 'email' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-brand-600" /> Email
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-brand-600" /> SMS
                  </span>
                )}
              </label>
            ))}
          </div>
          {errors.msgType && (
            <p role="alert" className="mt-1.5 text-sm text-rose-600">
              {errors.msgType}
            </p>
          )}
        </div>

        {/* Email composer */}
        {msgType === 'email' && (
          <div className="space-y-4">
            <Field label="Template">
              <select
                value={emailTemplate}
                onChange={(e) => applyEmailTemplate(e.target.value)}
                className="input"
                aria-label="Email template"
              >
                <option value="">Choose a template OR Type the message</option>
                {emailTemplates.map((t) => (
                  <option key={t.name}>{t.name}</option>
                ))}
              </select>
            </Field>
            <div>
              <label htmlFor="bc-subject" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Subject
              </label>
              <input
                id="bc-subject"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value)
                  setErrors((p) => ({ ...p, subject: '' }))
                }}
                className={cn('input', errors.subject && 'border-rose-500')}
              />
              {errors.subject && (
                <p role="alert" className="mt-1.5 text-sm text-rose-600">
                  {errors.subject}
                </p>
              )}
            </div>
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
                aria-label="Broadcast message"
                suppressContentEditableWarning
                onInput={() => setErrors((p) => ({ ...p, message: '' }))}
                className="min-h-72 whitespace-pre-wrap px-4 py-3 text-sm text-slate-800 focus:outline-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
              />
            </div>
          </div>
        )}

        {/* SMS composer */}
        {msgType === 'sms' && (
          <div className="space-y-4">
            <Field label="Template">
              <select
                value={smsTemplate}
                onChange={(e) => applySmsTemplate(e.target.value)}
                className="input"
                aria-label="SMS template"
              >
                <option value="">Choose a template OR Type the message</option>
                {smsTemplates.map((t) => (
                  <option key={t.name}>{t.name}</option>
                ))}
              </select>
            </Field>
            <div>
              <label htmlFor="bc-sms" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Message
              </label>
              <textarea
                id="bc-sms"
                value={smsText}
                onChange={(e) => {
                  setSmsText(e.target.value)
                  setErrors((p) => ({ ...p, message: '' }))
                }}
                rows={5}
                className={cn('input', errors.message && 'border-rose-500')}
              />
              <p
                className={cn(
                  'mt-1 text-right text-xs',
                  smsText.length > SMS_LIMIT ? 'font-semibold text-rose-600' : 'text-slate-500',
                )}
              >
                {smsText.length}/{SMS_LIMIT} characters
                {smsText.length > SMS_LIMIT &&
                  ` · ${Math.ceil(smsText.length / SMS_LIMIT)} SMS parts`}
              </p>
            </div>
          </div>
        )}
        {errors.message && (
          <p role="alert" className="text-sm text-rose-600">
            {errors.message}
          </p>
        )}

        <div className="flex justify-center pt-2">
          <button
            onClick={continueClicked}
            className="rounded-lg bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Continue
          </button>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="animate-fade-in absolute inset-0 bg-slate-500/60" onClick={() => setConfirmOpen(false)} />
            <div className="animate-dialog-in relative w-full max-w-lg rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-800">Confirm Broadcast</h2>
                <button
                  onClick={() => setConfirmOpen(false)}
                  aria-label="Close"
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3 px-6 py-5 text-sm">
                <p>
                  <span className="font-semibold text-slate-700">Type:</span>{' '}
                  <span className="uppercase">{msgType}</span>
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Target:</span> {target}
                  {target === 'Leads' && country && country !== '-ANY-' && ` · ${country}`}
                  {target === 'Leads' && leadStatusSel.length > 0 && ` · ${leadStatusSel.join(', ')}`}
                  {target === 'Students' && studentStatusSel.length > 0 && ` · ${studentStatusSel.join(', ')}`}
                </p>
                {msgType === 'email' && (
                  <p>
                    <span className="font-semibold text-slate-700">Subject:</span> {subject}
                  </p>
                )}
                <p>
                  <span className="font-semibold text-slate-700">Recipients:</span>{' '}
                  <span className="font-bold text-brand-600">{recipients.length}</span>
                </p>
                <div className="max-h-28 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 [overflow-wrap:anywhere]">
                  {recipients.join(', ')}
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={send}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  <Send className="h-4 w-4" /> Send Broadcast
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Toast */}
      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[110] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
