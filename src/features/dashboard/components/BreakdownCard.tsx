import type { Breakdown, StatusTone } from '../../../mock/dashboard'

const TONE_BAR: Record<StatusTone, string> = {
  pending: 'bg-status-pending',
  progress: 'bg-status-progress',
  review: 'bg-status-review',
  success: 'bg-status-success',
  danger: 'bg-status-danger',
  neutral: 'bg-status-neutral',
  info: 'bg-status-info',
  total: 'bg-status-total',
}

export function BreakdownCard({ title, items }: { title: string; items: Breakdown[] }) {
  const max = Math.max(...items.map((i) => i.count), 1)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((i) => (
          <li key={i.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{i.label}</span>
              <span className="font-semibold tabular-nums text-slate-800">
                {i.count.toLocaleString()}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${TONE_BAR[i.tone]}`}
                style={{ width: `${(i.count / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
