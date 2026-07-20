import { PieChart } from 'lucide-react'
import type { AppStatusStat, StatusTone } from '../../../mock/dashboard'

/**
 * Tone → background class. Every token is verified >= 4.5:1 against white text
 * (see tailwind.config.js), so white is always a safe foreground here.
 */
const TONE_BG: Record<StatusTone, string> = {
  pending: 'bg-status-pending',
  progress: 'bg-status-progress',
  review: 'bg-status-review',
  success: 'bg-status-success',
  danger: 'bg-status-danger',
  neutral: 'bg-status-neutral',
  info: 'bg-status-info',
  total: 'bg-status-total',
}

export function StatusTileGrid({ items }: { items: AppStatusStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {items.map((s) => (
        <div
          key={s.label}
          className={`relative overflow-hidden rounded-md p-4 text-white shadow-sm ${TONE_BG[s.tone]}`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-bold uppercase leading-snug tracking-wide">{s.label}</p>
            <PieChart className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">{s.count.toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}
