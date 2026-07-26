import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, GraduationCap, Clock, Send, Paperclip } from 'lucide-react'
import { cn } from '../../lib/cn'
import { StatusPill } from './components/StatusPill'
import { SectionHead } from './components/SectionHead'
import { getApplication } from '../../mock/applications'
import { currentStudent, documentRequests, documentStatusColor } from '../../mock/student/portal'
import { loadMessages, sendMessage, type AppMessage } from '../../mock/student/applicationMessages'

export default function StudentApplicationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const app = getApplication(Number(id))

  // Guard: students only see their own applications.
  if (!app || app.studentNo !== currentStudent().studentNo) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-slate-500">Application not found.</p>
        <button
          type="button"
          onClick={() => navigate('/portal/applications')}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Applications
        </button>
      </div>
    )
  }

  const docs = documentRequests.filter((d) => d.applicationRef === `University Application #${app.id}`)

  const [messages, setMessages] = useState<AppMessage[]>(() => loadMessages(app.id))
  const [draft, setDraft] = useState('')

  const send = () => {
    if (!draft.trim()) return
    setMessages(sendMessage(app.id, currentStudent().name, draft.trim()))
    setDraft('')
  }

  // Activity timeline derived from the application record.
  const activity = [
    { title: 'Application created', at: app.dateCreated, note: `Application #${app.id} created successfully` },
    { title: `APPLICATION STATUS CHANGED TO: ${app.status}`, at: app.dateCreated, note: '' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-700">University Application #{app.id}</h1>
        <button
          type="button"
          onClick={() => navigate('/portal/applications')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <div className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-brand-600">{app.course}</h2>
          <p className="text-lg text-slate-700">
            <span className="font-semibold text-brand-600">{app.university}</span>, {app.country}
          </p>
          <StatusPill label={app.status} color={app.statusColor} />
        </div>

        {/* Document Requests */}
        <section className="space-y-4">
          <SectionHead>Document Requests</SectionHead>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm font-semibold text-slate-600">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Document Requested</th>
                  <th className="px-4 py-3">Upload Date</th>
                  <th className="px-4 py-3">File</th>
                </tr>
              </thead>
              <tbody>
                {docs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                      No Record Found
                    </td>
                  </tr>
                ) : (
                  docs.map((d) => {
                    const uploaded = d.status === 'Uploaded'
                    return (
                      <tr key={d.id} className="border-b border-slate-100 text-sm odd:bg-slate-50/60">
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{d.requestedAt}</td>
                        <td className="px-4 py-3 font-medium text-slate-700 [overflow-wrap:anywhere]">{d.document}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {uploaded ? d.requestedAt : '--'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill label={d.status} color={documentStatusColor(d.status)} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Message History */}
        <section className="space-y-4">
          <SectionHead>Message History</SectionHead>

          <div className="max-h-80 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            {messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No messages yet.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={cn('flex', m.fromStaff ? 'justify-start' : 'justify-end')}>
                  <div
                    className={cn(
                      'max-w-md rounded-xl px-4 py-3 text-sm shadow-sm',
                      m.fromStaff ? 'bg-white text-slate-700' : 'bg-brand-50 text-slate-800',
                    )}
                  >
                    <p className="font-semibold text-slate-800">{m.sender}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{m.at}</p>
                    <p className="mt-1.5 [overflow-wrap:anywhere]">{m.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Send message to staff */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Send Message to Staff</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a Message…"
                rows={3}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <button
                type="button"
                onClick={send}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                <Send className="h-4 w-4" /> Send Message
              </button>
            </div>
            <AttachFiles />
          </div>
        </section>

        {/* Application Activity */}
        <section className="space-y-4">
          <SectionHead>University Application Activity</SectionHead>
          <ol className="space-y-6">
            {activity.map((a, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-bold text-slate-800">
                    <GraduationCap className="h-5 w-5 shrink-0 text-brand-600" /> {a.title}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <Clock className="h-3.5 w-3.5" /> {a.at}
                  </p>
                  {a.note && <p className="mt-1 text-sm text-slate-600 [overflow-wrap:anywhere]">{a.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}

/** "Attach files" chooser (matches the reference; attachment is display-only). */
function AttachFiles() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      >
        <Paperclip className="h-4 w-4" /> Attach files
      </button>
      <span className="text-sm text-slate-500">{name || 'No file chosen'}</span>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          setName(files.length ? files.map((f) => f.name).join(', ') : '')
        }}
      />
    </div>
  )
}
