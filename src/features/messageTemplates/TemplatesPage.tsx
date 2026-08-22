import { useMemo, useState } from 'react'
import { showSuccessDialog } from '../../store/successDialog'
import { Search, Plus, Pencil, Trash2, Lock, Mail, MessageSquare, Zap } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ExportButtons } from '../../components/ExportButtons'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { HighlightMatch } from '../../components/ui/HighlightMatch'
import {
  channelMeta,
  templatesFor,
  toggleTemplate,
  deleteTemplate,
  getEvent,
  type TemplateChannel,
  type MessageTemplate,
} from '../../mock/messageTemplates'

const CHANNEL_ICON: Record<TemplateChannel, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: Zap,
}

/** Shared list screen for Email / SMS / WhatsApp templates. */
export default function TemplatesPage({ channel }: { channel: TemplateChannel }) {
  const meta = channelMeta[channel]
  const Icon = CHANNEL_ICON[channel]
  const [rev, setRev] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [confirm, setConfirm] = useState<MessageTemplate | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return templatesFor(channel)
      .filter((t) => !statusFilter || (statusFilter === 'Enabled') === t.enabled)
      .filter((t) => !q || `${t.name} ${t.subject} ${t.body} ${t.details}`.toLowerCase().includes(q))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, search, statusFilter, rev])

  const exportHeader = meta.hasSubject
    ? [meta.nameLabel, 'Subject', 'Details', 'Status']
    : [meta.nameLabel, meta.messageLabel, 'Details', 'Status']
  const exportRows = filtered.map((t) => [
    t.name,
    meta.hasSubject ? t.subject : t.body,
    t.details || '—',
    t.enabled ? 'Enabled' : 'Disabled',
  ])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Icon className="h-5 w-5 text-brand-500" /> {meta.label}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Event templates fire automatically from other modules; custom ones you can send anytime.
          </p>
        </div>
        <a
          href={`/message-templates/${channel}/new`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add New
        </a>
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto py-1.5">
            <option value="">All Status</option>
            <option>Enabled</option>
            <option>Disabled</option>
          </select>
          <ExportButtons title={meta.label} filename={`${channel}-templates`} header={exportHeader} rows={exportRows} onDone={showToast} />
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            aria-label="Search templates"
            className="input w-full pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">{meta.nameLabel}</th>
              <th className="px-4 py-3">{meta.hasSubject ? 'Subject' : meta.messageLabel}</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const ev = getEvent(t.eventKey)
              return (
                <tr key={t.id} className="border-b border-slate-100 align-top text-sm">
                  <td className="max-w-[220px] px-4 py-3.5">
                    <a href={`/message-templates/${channel}/${t.id}/edit`} className="font-semibold text-slate-800 hover:text-brand-600 hover:underline [overflow-wrap:anywhere]">
                      <HighlightMatch text={t.name} query={search} />
                    </a>
                    {t.system && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                        <Lock className="h-2.5 w-2.5" /> EVENT
                      </span>
                    )}
                  </td>
                  <td className="max-w-md px-4 py-3.5 text-slate-600">
                    {meta.hasSubject ? (
                      t.subject ? <HighlightMatch text={t.subject} query={search} /> : '—'
                    ) : (
                      <span className="line-clamp-2 [overflow-wrap:anywhere]">
                        <HighlightMatch text={t.body} query={search} />
                      </span>
                    )}
                  </td>
                  <td className="max-w-xs px-4 py-3.5 text-slate-500">
                    {ev ? (
                      <span>
                        <HighlightMatch text={t.details} query={search} />{' '}
                        <a href={ev.route} className="font-semibold text-brand-600 hover:underline">
                          ({ev.module})
                        </a>
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => { toggleTemplate(t.id); setRev((n) => n + 1) }}
                      title="Click to toggle"
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                        t.enabled ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-500 hover:bg-slate-300',
                      )}
                    >
                      {t.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`/message-templates/${channel}/${t.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </a>
                      {t.system ? (
                        <span
                          title="Event template — can't be deleted"
                          className="inline-flex h-[30px] w-8 items-center justify-center rounded-md border border-slate-200 text-slate-300"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirm(t)}
                          aria-label="Delete template"
                          className="inline-flex h-[30px] w-8 items-center justify-center rounded-md bg-rose-600 text-white transition-colors hover:bg-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  No templates found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-slate-500">Showing {filtered.length} of {templatesFor(channel).length} templates</p>

      <ConfirmDialog
        open={confirm !== null}
        title="Delete template"
        message={`Delete "${confirm?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            const ok = deleteTemplate(confirm.id)
            if (ok) showSuccessDialog('Template deleted successfully')
            else showToast("Event template can't be deleted")
            setConfirm(null)
            setRev((n) => n + 1)
          }
        }}
      />

      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[120] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
