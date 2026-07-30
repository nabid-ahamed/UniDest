import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronRight } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { FollowUpBuckets } from '../../../mock/dashboard'

const TABS = [
  { key: 'today', label: 'Today', empty: 'No follow-ups for today!' },
  { key: 'due', label: 'Due', empty: 'No overdue follow-ups.' },
  { key: 'upcoming', label: 'Upcoming', empty: 'No upcoming follow-ups.' },
] as const

type TabKey = (typeof TABS)[number]['key']

export function FollowUpCard({ title, buckets }: { title: string; buckets: FollowUpBuckets }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>('today')
  const active = TABS.find((t) => t.key === tab)!
  const items = buckets[tab]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>

      <div className="mt-3 flex gap-4 border-b border-slate-200">
        {TABS.map((t) => {
          const count = buckets[t.key].length
          return (
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
              {count > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-xs font-semibold tabular-nums',
                    tab === t.key ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">{active.empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100">
          {items.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => f.href && navigate(f.href)}
                disabled={!f.href}
                className={cn(
                  'group flex w-full items-center justify-between gap-3 rounded-lg py-3 pl-1 pr-1 text-left transition-colors',
                  f.href
                    ? 'hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
                    : 'cursor-default',
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-brand-700">
                    {f.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">{f.detail}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
                  {f.when}
                  {f.href && (
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-brand-500" />
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
