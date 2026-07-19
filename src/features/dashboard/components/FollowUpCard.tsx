import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { FollowUpBuckets } from '../../../mock/dashboard'

const TABS = [
  { key: 'today', label: 'Today' },
  { key: 'due', label: 'Due' },
  { key: 'upcoming', label: 'Upcoming' },
] as const

type TabKey = (typeof TABS)[number]['key']

export function FollowUpCard({ title, buckets }: { title: string; buckets: FollowUpBuckets }) {
  const [tab, setTab] = useState<TabKey>('today')
  const items = buckets[tab]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>

      <div className="mt-3 flex gap-4 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-1 pb-2 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            <CalendarDays className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">No follow-ups for today!</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100">
          {items.map((f) => (
            <li key={f.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{f.name}</p>
                <p className="text-xs text-slate-500">{f.detail}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">{f.when}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
