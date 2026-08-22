import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Download, Trash2, Upload } from 'lucide-react'
import {
  agentsApi,
  useAgent,
  useAgentCommissions,
  useAgentReferrals,
  useInviteAgent,
  useRemoveAgentDocument,
  useUpdateAgent,
  useUploadAgentDocument,
  type AgentDocumentSlot,
  type ApiAgent,
} from '../../lib/api'

/** The three document slots, with the field on the agent that holds each key. */
const DOCUMENT_SLOTS: { slot: AgentDocumentSlot; label: string; field: keyof ApiAgent }[] = [
  { slot: 'logo', label: 'Logo', field: 'logoUrl' },
  { slot: 'idProof', label: 'ID proof', field: 'idProofUrl' },
  { slot: 'incorporationCert', label: 'Incorporation certificate', field: 'incorporationCertUrl' },
]

export default function AgentDetailPage() {
  const id = Number(useParams().id)
  const { data: agent, isLoading } = useAgent(id)
  const { data: referrals = [] } = useAgentReferrals({ agentId: String(id) })
  const { data: commissions = [] } = useAgentCommissions({ agentId: String(id) })
  const update = useUpdateAgent()
  const invite = useInviteAgent()
  const [inviteResult, setInviteResult] = useState<{ reset: boolean; password: string } | null>(null)

  if (isLoading) return <p className="text-sm text-slate-500">Loading agent...</p>
  if (!agent) return <p className="text-sm text-rose-600">Agent not found.</p>

  // Names, not ids: "Branch ID 3" makes the reader do a lookup the server
  // already did.
  const facts: [string, string][] = [
    ['First name', agent.firstName],
    ['Last name', agent.lastName],
    ['Email', agent.email],
    ['Mobile', agent.phone],
    ['Country', agent.country],
    ['State', agent.state],
    ['City', agent.city],
    ['Category', agent.category],
    ['Address', agent.address],
    ['Branch', agent.branch || '—'],
    ['Point of contact', agent.pointOfContact ?? 'Not assigned'],
    ['Commission rate', `${agent.commissionRate}%`],
    ['Joined', agent.joined],
  ]

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Link to="/agents" className="text-sm font-semibold text-brand-600 hover:underline">
        ← Back to agents
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{agent.company || 'Independent partner'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/agents/${id}/edit`}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Edit profile
            </Link>
            <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {agent.status}
            </span>
          </div>
        </div>

        <dl className="mt-6 grid gap-x-6 gap-y-5 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-slate-500">{label}</dt>
              <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
                {value || '—'}
              </dd>
            </div>
          ))}
        </dl>

        {/* Portal account */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Portal account</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {agent.userId ? 'Invited — login active' : 'Not invited'}
              </p>
            </div>
            <button
              type="button"
              disabled={invite.isPending || !agent.email}
              title={agent.email ? undefined : 'Add an email address first'}
              onClick={() =>
                invite.mutate(id, {
                  onSuccess: (r) => setInviteResult({ reset: r.reset, password: r.tempPassword }),
                })
              }
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {invite.isPending
                ? 'Working…'
                : agent.userId
                  ? 'Resend invitation'
                  : 'Send invitation'}
            </button>
          </div>

          {invite.error && (
            <p className="mt-3 text-sm text-rose-600">{(invite.error as Error).message}</p>
          )}

          {/* Shown once. There is no mail transport yet, so the operator has to
              pass this on themselves. */}
          {inviteResult && (
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
              <p className="font-semibold text-amber-900">
                {inviteResult.reset ? 'Password reset' : 'Account created'} — give the agent this
                one-time password:
              </p>
              <code className="mt-1 block break-all font-mono text-amber-900">
                {inviteResult.password}
              </code>
              <p className="mt-1 text-xs text-amber-800">
                It is not stored and will not be shown again.
              </p>
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <h2 className="text-sm font-bold text-slate-900">Documents</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {DOCUMENT_SLOTS.map((doc) => (
              <DocumentSlot
                key={doc.slot}
                agentId={id}
                slot={doc.slot}
                label={doc.label}
                storedKey={String(agent[doc.field] ?? '')}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={agent.canSubmitApplications}
              onChange={(event) =>
                update.mutate({ id, patch: { canSubmitApplications: event.target.checked } })
              }
            />{' '}
            Allow application submission
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={agent.autoConvertReferrals}
              onChange={(event) =>
                update.mutate({ id, patch: { autoConvertReferrals: event.target.checked } })
              }
            />{' '}
            Auto-convert referrals
          </label>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Referrals ({referrals.length})</h2>
            <Link
              to={`/agents/referrals?agentId=${id}`}
              className="text-sm font-semibold text-brand-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {referrals.slice(0, 5).map((row) => (
              <div
                key={`${row.type}-${row.id}`}
                className="flex items-center justify-between border-b border-slate-100 py-2 text-sm"
              >
                <span className="font-semibold text-slate-700">{row.name}</span>
                <span className="text-slate-500">{row.status}</span>
              </div>
            ))}
            {referrals.length === 0 && <p className="text-sm text-slate-500">No referrals yet.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Commissions ({commissions.length})</h2>
            <Link
              to={`/agents/invoices?agentId=${id}`}
              className="text-sm font-semibold text-brand-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {commissions.slice(0, 5).map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between border-b border-slate-100 py-2 text-sm"
              >
                <span className="font-semibold text-slate-700">
                  #{row.id} · {row.student}
                </span>
                <span className="text-slate-600">
                  {row.currency} {row.amount.toFixed(2)}
                </span>
              </div>
            ))}
            {commissions.length === 0 && (
              <p className="text-sm text-slate-500">No commissions yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * One document slot: upload, download, replace, remove.
 *
 * Downloads go through the authenticated API route rather than a plain link —
 * the file is never served from a static mount, so a bare href would 401.
 */
function DocumentSlot({
  agentId,
  slot,
  label,
  storedKey,
}: {
  agentId: number
  slot: AgentDocumentSlot
  label: string
  storedKey: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadAgentDocument()
  const remove = useRemoveAgentDocument()
  const [error, setError] = useState('')
  const present = Boolean(storedKey)

  const pick = (file: File | undefined) => {
    if (!file) return
    setError('')
    upload.mutate(
      { id: agentId, slot, file },
      { onError: (e) => setError((e as Error).message) },
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="mt-1 truncate text-xs text-slate-500" title={storedKey}>
        {present ? storedKey : 'No file uploaded'}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <Upload className="h-3.5 w-3.5" />
          {upload.isPending ? 'Uploading…' : present ? 'Replace' : 'Upload'}
        </button>

        {present && (
          <>
            <button
              type="button"
              onClick={() =>
                agentsApi
                  .downloadDocument(agentId, slot, storedKey)
                  .catch((e: Error) => setError(e.message))
              }
              className="inline-flex items-center gap-1 rounded-md border border-brand-300 px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
            <button
              type="button"
              onClick={() => remove.mutate({ id: agentId, slot })}
              disabled={remove.isPending}
              aria-label={`Remove ${label}`}
              className="inline-flex items-center rounded-md border border-rose-300 p-1 text-rose-600 hover:bg-rose-50 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
