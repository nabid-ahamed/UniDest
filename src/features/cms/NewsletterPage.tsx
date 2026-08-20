import { useMemo, useState } from 'react'
import { showSuccessDialog } from '../../store/successDialog'
import { Search, Trash2, Mail, Users } from 'lucide-react'
import { ExportButtons } from '../../components/ExportButtons'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useSubscribers, useUnsubscribe, type ApiSubscriber } from '../../lib/api'

export default function NewsletterPage() {
  const { data: subscribers = [], isPending } = useSubscribers()
  const unsubscribe = useUnsubscribe()
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState<ApiSubscriber | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return subscribers.filter((s) => !q || `${s.email} ${s.name}`.toLowerCase().includes(q))
  }, [subscribers, search])

  const exportRows = filtered.map((s) => [s.email, s.subscribedAt, s.name])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Newsletter Subscribers</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <Users className="h-4 w-4 text-slate-400" />
            {filtered.length} total subscriber{filtered.length === 1 ? '' : 's'}
          </p>
        </div>
        <ExportButtons
          title="Newsletter Subscribers"
          filename="newsletter-subscribers"
          header={['Email', 'Subscribed At', 'Name']}
          rows={exportRows}
          onDone={showToast}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or name..."
            aria-label="Search subscribers"
            className="input w-full pl-9"
          />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="w-12 px-4 py-3">#</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Subscribed At</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id} className="border-b border-slate-100 text-sm">
                <td className="px-4 py-3.5 text-slate-500">{i + 1}</td>
                <td className="px-4 py-3.5">
                  <a href={`mailto:${s.email}`} className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-brand-600 [overflow-wrap:anywhere]">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {s.email}
                  </a>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{s.subscribedAt}</td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className="text-slate-600">{s.name || '—'}</span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    onClick={() => setConfirm(s)}
                    aria-label="Delete subscriber"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-rose-600 text-white transition-colors hover:bg-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  {isPending ? 'Loading subscribers…' : 'No subscribers found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title="Delete subscriber"
        message={`Remove "${confirm?.email}" from the newsletter list?`}
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            unsubscribe.mutate(confirm.id)
            showSuccessDialog('Subscriber removed successfully', 'Removed!')
            setConfirm(null)
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
