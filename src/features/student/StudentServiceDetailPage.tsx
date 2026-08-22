import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Paperclip, Wrench, Clock } from 'lucide-react'
import { cn } from '../../lib/cn'
import { StatusPill } from './components/StatusPill'
import { SectionHead } from './components/SectionHead'
import {
  useServiceRequest,
  useReplyServiceRequest,
  type ApiServiceRequest,
} from '../../lib/api'

/**
 * Route entry: loads the service request and renders the body separately so
 * hooks stay out of the conditional path — and the `key` remounts it per id, so
 * draft state resets between requests.
 *
 * Ownership is enforced by the API: a student requesting someone else's service
 * gets a 403, so `service` is null here. The previous client-side comparison
 * against a shared mock list was not a guard at all.
 */
export default function StudentServiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: service, isPending } = useServiceRequest(id ? Number(id) : undefined)

  if (isPending) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-slate-500">Loading service request…</p>
      </div>
    )
  }

  if (!service) {
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

  return <ServiceDetail key={service.id} service={service} />
}

function ServiceDetail({ service }: { service: ApiServiceRequest }) {
  const navigate = useNavigate()
  const reply = useReplyServiceRequest()
  const [draft, setDraft] = useState('')

  // The thread comes from the server and the cache is invalidated on reply, so
  // there is no local copy to drift out of sync with it.
  const messages = service.messages

  const send = () => {
    const body = draft.trim()
    if (!body || reply.isPending) return
    reply.mutate({ id: service.id, body })
    setDraft('')
  }

  // Timeline: a derived "created" entry plus each staff reply. The server keeps
  // a full activity log; this view shows the parts a student cares about.
  const activity = [
    { text: 'Service request created', at: service.dateCreated },
    ...messages.filter((m) => m.fromStaff).map((m) => ({ text: `Reply from ${m.by}`, at: m.at })),
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
            <StatusPill label={service.status} color={service.statusColor} />
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
              messages.map((m) => {
                const mine = !m.fromStaff
                return (
                  <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
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
                disabled={reply.isPending}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
              >
                <Send className="h-4 w-4" /> {reply.isPending ? 'Sending…' : 'Send Message'}
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
