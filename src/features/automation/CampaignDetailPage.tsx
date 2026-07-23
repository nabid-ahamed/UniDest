import { useParams } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { cn } from '../../lib/cn'
import { getCampaign, matchedUsers, audienceSummary } from '../../mock/automation'

const statusColor: Record<string, string> = {
  Queued: 'bg-emerald-100 text-emerald-700',
  Sent: 'bg-sky-100 text-sky-700',
  Draft: 'bg-slate-100 text-slate-600',
  Failed: 'bg-rose-100 text-rose-700',
}

export default function CampaignDetailPage() {
  const { id } = useParams()
  const campaign = getCampaign(Number(id))

  if (!campaign) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Campaign not found.</p>
        <a
          href="/automation/campaigns"
          className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline"
        >
          Back to Campaigns
        </a>
      </div>
    )
  }

  const matched = matchedUsers(campaign.audience)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{campaign.title}</h1>
            <span className={cn('rounded-md px-2.5 py-1 text-xs font-semibold', statusColor[campaign.status])}>
              {campaign.status}
            </span>
          </div>
          <div className="mt-3 space-y-1.5 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-700">Mode:</span> {campaign.mode}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Scheduled/Sent At:</span> {campaign.scheduledAt}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Sent To:</span> {campaign.sentTo}
            </p>
          </div>
        </div>
        <a
          href="/automation/campaigns"
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
            Matched Audience: <span className="text-xl font-bold text-brand-600">{matched}</span>
          </p>
        </div>
        <p className="mt-2 text-sm text-slate-600">{audienceSummary(campaign.audience)}</p>
      </div>

      {/* Message */}
      <div className="mt-6 border-t border-slate-200 pt-5">
        <h2 className="text-lg font-semibold text-slate-800">Message</h2>
        <div className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {campaign.message}
        </div>
      </div>
    </div>
  )
}
