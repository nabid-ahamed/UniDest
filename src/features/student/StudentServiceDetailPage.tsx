import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Paperclip, Wrench, Clock } from 'lucide-react'
import { cn } from '../../lib/cn'
import { StatusPill } from './components/StatusPill'
import { SectionHead } from './components/SectionHead'
import { currentStudent, serviceStatusColor } from '../../mock/student/portal'
import { serviceRequests, updateService, nowStamp, type ServiceMessage } from '../../mock/services'

export default function StudentServiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const me = currentStudent()
  const service = serviceRequests.find((r) => r.id === Number(id))

  // Guard: students only see their own service requests.
  if (!service || (service.studentEmail !== me.email && service.studentName !== me.name)) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-slate-500">Service request not found.</p>
        <button
          type="button"
          onClick={() => navigate('/portal/services')}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Additional Services
        </button>
      </div>
    )
  }

  const [messages, setMessages] = useState<ServiceMessage[]>(service.messages)
  const [draft, setDraft] = useState('')

  const send = () => {
    if (!draft.trim()) return
    const next: ServiceMessage[] = [
      ...messages,
      { text: draft.trim(), notify: null, files: [], at: nowStamp(), by: me.name },
    ]
    setMessages(next)
    updateService({ ...service, messages: next })
    setDraft('')
  }

  // Timeline: a derived "created" entry + the request's own activity log.
  const activity = [
    { text: 'Service request created', at: service.dateCreated },
    ...service.activity,
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-700">Service Application #{service.id}</h1>
        <button
          type="button"
          onClick={() => navigate('/portal/services')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <div className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Service info */}
        <div className="space-y-2 text-slate-700">
          <p className="text-lg">
            <span className="font-bold">Service:</span>{' '}
            <span className="font-bold text-brand-600">{service.service}</span>
          </p>
          <p className="text-lg">
            <span className="font-bold">Country:</span> {service.country || '--'}
          </p>
          <p className="flex items-center gap-2 text-lg">
            <span className="font-bold">Status:</span>{' '}
            {service.status ? (
              <StatusPill label={service.status} color={serviceStatusColor(service.status)} />
            ) : (
              '--'
            )}
          </p>
          {service.description && (
            <p className="pt-1 text-sm text-slate-600 [overflow-wrap:anywhere]">{service.description}</p>
          )}
        </div>

        {/* Message History */}
        <section className="space-y-4">
          <SectionHead>Message History</SectionHead>

          <div className="max-h-80 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            {messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No messages found!</p>
            ) : (
              messages.map((m, i) => {
                const mine = m.by === me.name
                return (
                  <div key={i} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-md rounded-xl px-4 py-3 text-sm shadow-sm',
                        mine ? 'bg-brand-50 text-slate-800' : 'bg-white text-slate-700',
                      )}
                    >
                      <p className="font-semibold text-slate-800">{m.by}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{m.at}</p>
                      <p className="mt-1.5 [overflow-wrap:anywhere]">{m.text}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

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

        {/* Service Application Activity */}
        <section className="space-y-4">
          <SectionHead>Service Application Activity</SectionHead>
          <ol className="space-y-6">
            {activity.map((a, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="mb-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <Clock className="h-3.5 w-3.5" /> {a.at}
                  </p>
                  <p className="flex items-center gap-2 font-bold text-slate-800 [overflow-wrap:anywhere]">
                    <Wrench className="h-5 w-5 shrink-0 text-brand-600" /> {a.text}
                  </p>
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
