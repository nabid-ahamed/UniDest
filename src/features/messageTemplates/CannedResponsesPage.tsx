import { useState } from 'react'
import { showSuccessDialog } from '../../store/successDialog'
import { Plus, Pencil, Trash2, MessagesSquare } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { cannedResponses, deleteCanned, toggleCanned, type CannedResponse } from '../../mock/messageTemplates'

export default function CannedResponsesPage() {
  const [rev, setRev] = useState(0)
  const [confirm, setConfirm] = useState<CannedResponse | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  // read `rev` to recompute after mutations
  void rev

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <MessagesSquare className="h-5 w-5 text-brand-500" /> Canned Response Templates
          </h1>
          <p className="mt-1 text-sm text-slate-500">Grouped quick replies your team can insert in the live-chat widget.</p>
        </div>
        <a
          href="/message-templates/canned/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add New
        </a>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Replies</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cannedResponses.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 align-top text-sm">
                <td className="px-4 py-3.5">
                  <a href={`/message-templates/canned/${c.id}/edit`} className="font-semibold text-slate-800 hover:text-brand-600 hover:underline">
                    {c.type}
                  </a>
                </td>
                <td className="max-w-md px-4 py-3.5 text-slate-500">{c.details || '—'}</td>
                <td className="px-4 py-3.5">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{c.responses.length}</span>
                </td>
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => { toggleCanned(c.id); setRev((n) => n + 1) }}
                    title="Click to toggle"
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                      c.enabled ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-500 hover:bg-slate-300',
                    )}
                  >
                    {c.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/message-templates/canned/${c.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </a>
                    <button
                      onClick={() => setConfirm(c)}
                      aria-label="Delete"
                      className="inline-flex h-[30px] w-8 items-center justify-center rounded-md bg-rose-600 text-white transition-colors hover:bg-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {cannedResponses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  No canned responses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title="Delete canned response"
        message={`Delete "${confirm?.type}"? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            deleteCanned(confirm.id)
            showSuccessDialog('Canned response deleted successfully')
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
