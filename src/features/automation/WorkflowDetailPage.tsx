import { useParams } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { cn } from '../../lib/cn'
import { getWorkflow, matchedUsers, messageCount } from '../../mock/automation'

const ModePill = ({ mode }: { mode: string }) => {
  const color =
    mode === 'Email'
      ? 'bg-sky-50 text-sky-700'
      : mode === 'SMS'
        ? 'bg-violet-50 text-violet-700'
        : 'bg-emerald-50 text-emerald-700'
  return <span className={cn('rounded-md px-2.5 py-1 text-xs font-semibold', color)}>{mode}</span>
}

export default function WorkflowDetailPage() {
  const { id } = useParams()
  const workflow = getWorkflow(Number(id))

  if (!workflow) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Workflow not found.</p>
        <a href="/automation" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Workflows
        </a>
      </div>
    )
  }

  const matched = matchedUsers(workflow.audience)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{workflow.title}</h1>
          <div className="mt-3 space-y-1.5 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-700">Workflow Type:</span> {workflow.type}
            </p>
            <p className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
              <span className="inline-flex items-center gap-2">
                <span className="font-semibold text-slate-700">Mode:</span> <ModePill mode={workflow.mode} />
              </span>
              <span>
                <span className="font-semibold text-slate-700">At:</span> {workflow.at}
              </span>
              <span
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-semibold',
                  workflow.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                )}
              >
                {workflow.status}
              </span>
            </p>
            <p>
              <span className="font-semibold text-slate-700">Created:</span> {workflow.created}
            </p>
          </div>
        </div>
        <a
          href="/automation"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </a>
      </div>

      {/* Target audience */}
      <div className="mt-6 border-t border-slate-200 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-800">Target Audience</h2>
          <p className="inline-flex items-center gap-2 text-slate-700">
            <Users className="h-5 w-5 text-brand-600" />
            Matched Users: <span className="text-xl font-bold text-brand-600">{matched}</span>
          </p>
        </div>
        <div className="mt-3 space-y-1.5 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-700">Target:</span> {workflow.audience.target}
          </p>
          {workflow.audience.status && (
            <p>
              <span className="font-semibold text-slate-700">Status:</span> {workflow.audience.status}
            </p>
          )}
          {workflow.audience.country && (
            <div>
              <p className="font-semibold text-slate-700 underline">Other Criteria</p>
              <p className="mt-0.5">Country Interested:</p>
              <p>{workflow.audience.country}</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="mt-6 border-t border-slate-200 pt-5">
        <h2 className="text-lg font-semibold text-slate-800">Messages ({messageCount(workflow)})</h2>
        <div className="mt-3 space-y-2.5 text-sm">
          {workflow.steps.map((step, i) => (
            <div key={i} className="flex flex-wrap items-center gap-x-8 gap-y-1">
              <span className="font-semibold text-slate-700">{step.schedule}</span>
              <span className="text-slate-600">
                <span className="font-semibold text-slate-700">Send Message:</span> {step.message}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Execution history */}
      <div className="mt-6 border-t border-slate-200 pt-5">
        <h2 className="text-lg font-semibold text-slate-800">Execution History</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Sequence Index</th>
                <th className="px-4 py-3">Message Sent</th>
                <th className="px-4 py-3">Message</th>
              </tr>
            </thead>
            <tbody>
              {workflow.history.map((h, i) => (
                <tr key={i} className="border-b border-slate-100 text-sm text-slate-600">
                  <td className="whitespace-nowrap px-4 py-3">{h.date}</td>
                  <td className="px-4 py-3 tabular-nums">{h.sequenceIndex}</td>
                  <td className="px-4 py-3 tabular-nums">{h.messageSent}</td>
                  <td className="px-4 py-3">{h.message}</td>
                </tr>
              ))}
              {workflow.history.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                    No execution history yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
