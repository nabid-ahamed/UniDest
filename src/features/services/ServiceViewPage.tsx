import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Undo2,
  LayoutGrid,
  User,
  FileText,
  Bell,
  MessageCircle,
  Paperclip,
  Send,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  serviceRequests,
  serviceStatuses,
  serviceStaff,
  updateService,
  nowStamp,
  type ServiceRequest,
} from '../../mock/services'

const TABS = ['Application', 'Profile', 'Documents', 'Reminders', 'Chat'] as const

const TAB_ICONS = {
  Application: LayoutGrid,
  Profile: User,
  Documents: FileText,
  Reminders: Bell,
  Chat: MessageCircle,
} as const

/** Service request detail (route /services/:id) — the demo's "Visa & Services Detail". */
export default function ServiceViewPage() {
  const { id } = useParams()
  const request = serviceRequests.find((r) => r.id === Number(id))

  if (!request) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-slate-500">Service request not found.</p>
        <a
          href="/services"
          className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Back to Additional Services
        </a>
      </div>
    )
  }

  return <ServiceView request={request} />
}

function ServiceView({ request }: { request: ServiceRequest }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Application')
  const [status, setStatus] = useState(request.status)
  const [nextStatus, setNextStatus] = useState('')
  const [notes, setNotes] = useState(request.notes)
  const [message, setMessage] = useState('')
  const [notify, setNotify] = useState('')
  const [fileName, setFileName] = useState('')
  const [messages, setMessages] = useState(request.messages)
  const [activity, setActivity] = useState(request.activity)
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2500)
  }

  const saveNotes = () => {
    updateService({ ...request, status, notes, messages, activity })
    showToast('Notes saved')
  }

  const sendMessage = () => {
    if (!message.trim()) return showToast('Write a message first')
    const entry = {
      text: message.trim(),
      notify: notify || null,
      files: fileName ? [fileName] : [],
      at: nowStamp(),
      by: 'Admin Admin',
    }
    const next = [entry, ...messages]
    setMessages(next)
    updateService({ ...request, status, notes, messages: next, activity })
    setMessage('')
    setNotify('')
    setFileName('')
    if (fileRef.current) fileRef.current.value = ''
    showToast('Message sent to student/agent')
  }

  const updateStatus = () => {
    if (!nextStatus) return showToast('Select a status first')
    const entry = {
      text: `STATUS CHANGED TO: ${nextStatus}${status ? `, Previous Status: ${status}` : ''}`,
      at: `${nowStamp()} · Admin Admin`,
    }
    const nextActivity = [entry, ...activity]
    setStatus(nextStatus)
    setActivity(nextActivity)
    updateService({ ...request, status: nextStatus, notes, messages, activity: nextActivity })
    setNextStatus('')
    showToast(`Status changed to ${nextStatus}`)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {/* Heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Service Request #{request.id}</h1>
        <a
          href="/services"
          aria-label="Back to Additional Services"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700"
        >
          <Undo2 className="h-4 w-4" />
        </a>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex flex-wrap border-b border-slate-200">
        {TABS.map((t) => {
          const Icon = TAB_ICONS[t]
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-t-lg border border-b-0 px-4 py-2.5 text-sm font-semibold transition-colors',
                tab === t
                  ? 'border-slate-200 bg-white text-slate-800 shadow-[0_2px_0_0_#fff]'
                  : 'border-transparent text-slate-500 hover:text-brand-600',
              )}
            >
              <Icon className="h-4 w-4" />
              {t === 'Reminders' ? 'Reminders (0)' : t}
            </button>
          )
        })}
      </div>

      {tab === 'Application' ? (
        <div className="pt-6">
          {/* Top: service info + notes */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <div className="flex items-start justify-between">
                <h2 className="text-2xl font-bold text-slate-800">{request.service}</h2>
              </div>
              <p className="mt-2 text-slate-700">Country: {request.country}</p>
              {request.description && <p className="mt-4 text-slate-700">{request.description}</p>}
              <div className="mt-5">
                <p className="font-bold text-slate-800">{request.studentName}</p>
                <p className="text-slate-600 [overflow-wrap:anywhere]">{request.studentEmail}</p>
                <p className="tabular-nums text-slate-600">{request.studentPhone}</p>
              </div>
              <p className="mt-5 text-slate-700">
                <span className="font-semibold">Current Status:</span>{' '}
                {status || <span className="text-slate-400">--</span>}
              </p>
            </div>
            <div className="space-y-3">
              <p className="flex items-center justify-end gap-1.5 text-sm text-slate-500">
                <User className="h-4 w-4" />
                {request.assignedTo ?? '--'}
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                placeholder="Notes"
                aria-label="Notes"
                className="input"
              />
              <button
                onClick={saveNotes}
                className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Save
              </button>
            </div>
          </div>

          <hr className="my-6 border-slate-200" />

          {/* Message + status update */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Send Message to Student/Agent</h2>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                aria-label="Message"
                className="input"
              />
              <select
                value={notify}
                onChange={(e) => setNotify(e.target.value)}
                aria-label="Select staff and agent to notify"
                className="input"
              >
                <option value="">Select staff and agent to notify</option>
                {serviceStaff.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <div>
                <p className="mb-1.5 text-sm font-semibold text-slate-700">Attach files:</p>
                <input
                  ref={fileRef}
                  type="file"
                  aria-label="Attach files"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-600 hover:file:bg-brand-100"
                />
              </div>
              <div className="flex justify-center">
                <button
                  onClick={sendMessage}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  <Send className="h-4 w-4" /> Send Message
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Update Service Status</h2>
              <p className="text-slate-700">
                <span className="font-semibold">Current Status:</span>{' '}
                {status || <span className="text-slate-400">--</span>}
              </p>
              <div>
                <label htmlFor="sv-status" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Change Status to
                </label>
                <select
                  id="sv-status"
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="input"
                >
                  <option value="">Select</option>
                  {serviceStatuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={updateStatus}
                  className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Update
                </button>
              </div>
            </div>
          </div>

          <hr className="my-6 border-slate-200" />

          {/* History + activity */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Message History</h2>
              {messages.length ? (
                <ul className="mt-4 space-y-3">
                  {messages.map((m, i) => (
                    <li key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                      <p className="whitespace-pre-line text-slate-700">{m.text}</p>
                      {m.files.length > 0 && (
                        <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-brand-600">
                          <Paperclip className="h-3.5 w-3.5" /> {m.files.join(', ')}
                        </p>
                      )}
                      <p className="mt-1.5 text-xs text-slate-500">
                        {m.at} · {m.by}
                        {m.notify && ` · notified ${m.notify}`}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-slate-600">No messages found!</p>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Service Activity</h2>
              {activity.length ? (
                <ul className="mt-4 space-y-3">
                  {activity.map((a, i) => (
                    <li key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                      <p className="text-slate-700">{a.text}</p>
                      <p className="mt-1.5 text-xs italic text-slate-500">{a.at}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-slate-600">No Activity Found</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-slate-500">"{tab}" is still not built yet.</p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[60] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
