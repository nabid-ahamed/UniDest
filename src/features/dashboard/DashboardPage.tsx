import { useState } from 'react'
import { useAuth } from '../../store/auth'
import { useDashboard, useDashboardBranches } from '../../lib/api'
import { StatCard } from './components/StatCard'
import { CollapsibleSection } from './components/CollapsibleSection'
import { ChartCard } from './components/ChartCard'
import { TrendAreaCard } from './components/TrendAreaCard'
import { OverviewDonut } from './components/OverviewDonut'
import { FollowUpCard } from './components/FollowUpCard'
import { RemindersCard } from './components/RemindersCard'
import { BreakdownCard } from './components/BreakdownCard'
import { StatTile } from './components/StatTile'
import { StatusTileGrid } from './components/StatusTileGrid'
import type { TrendPoint, DailyPoint } from '../../mock/dashboard'

/** Filter sentinel, not a real branch — the API treats it as "no filter". */
const ALL_BRANCH = 'All Branch'

function ChartsRow({ trend, applications }: { trend: TrendPoint[]; applications: DailyPoint[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <TrendAreaCard title="Students & Leads" data={trend} height={280} />
      </div>
      <div className="grid gap-4">
        <ChartCard title="Applications" subtitle="Last 7 Days" data={applications} color="#8b5cf6" height={280} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const user = useAuth((s) => s.user)
  const [branch, setBranch] = useState(ALL_BRANCH)

  // All datasets scoped to the selected branch. "All Branch" is the full total.
  const { data, isPending, isError } = useDashboard(branch)
  const { data: branches } = useDashboardBranches()
  // Keep the filter usable while its own request is in flight.
  const branchOptions = branches ?? [ALL_BRANCH]

  if (isPending) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-slate-500">Loading dashboard…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-12 text-center shadow-sm">
        <p className="font-semibold text-rose-700">Could not load the dashboard.</p>
        <p className="mt-1 text-sm text-rose-600">Check that the API is running, then reload.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900">
          Welcome back, <span className="capitalize">{user?.name || 'Admin'}</span> !
        </h1>
        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          aria-label="Filter dashboard by branch"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {branchOptions.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((s) => (
          <StatCard key={s.key} stat={s} />
        ))}
      </div>

      {/* Charts */}
      <ChartsRow trend={data.monthlyTrend} applications={data.applicationsDaily} />

      {/* Statistics overview donut */}
      <OverviewDonut stats={data.stats} />

      {/* Follow-ups */}
      <CollapsibleSection title="Follow-ups">
        <div className="grid gap-4 lg:grid-cols-2">
          <FollowUpCard title="Lead Follow-ups" buckets={data.leadFollowups} />
          <FollowUpCard title="Student Follow-ups" buckets={data.studentFollowups} />
        </div>
      </CollapsibleSection>

      {/* Reminders */}
      <CollapsibleSection title="Reminders">
        <RemindersCard reminders={data.reminders} />
      </CollapsibleSection>

      {/* Study abroad stats */}
      <CollapsibleSection title="Study Abroad Stats">
        <p className="mb-3 text-sm font-semibold text-slate-600">University Applications</p>
        <StatusTileGrid items={data.applicationStatusStats} />
      </CollapsibleSection>

      {/* Students */}
      <CollapsibleSection title="Students">
        <StatusTileGrid items={data.studentStatusStats} />
      </CollapsibleSection>

      {/* Leads */}
      <CollapsibleSection title="Leads">
        <StatusTileGrid items={data.leadStatusStats} />
      </CollapsibleSection>

      {/* Tickets */}
      <CollapsibleSection title="Tickets" defaultOpen={false}>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="grid grid-cols-2 gap-4 lg:col-span-2">
            {data.ticketSummary.map((s) => (
              <StatTile key={s.label} stat={s} />
            ))}
          </div>
          <BreakdownCard title="By Priority" items={data.ticketsByPriority} />
        </div>
      </CollapsibleSection>

      {/* Your stats */}
      <CollapsibleSection title="Your Stats" defaultOpen={false}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.yourStats.map((s) => (
            <StatTile key={s.label} stat={s} />
          ))}
        </div>
      </CollapsibleSection>
    </div>
  )
}
