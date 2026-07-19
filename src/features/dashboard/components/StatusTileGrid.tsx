import { PieChart } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { AppStatusStat } from '../../../mock/dashboard'

/** Light background → dark text (e.g. the white "Total" tile). */
function isLight(hex: string) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 172
}

export function StatusTileGrid({ items }: { items: AppStatusStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {items.map((s) => {
        const light = isLight(s.color)
        return (
          <div
            key={s.label}
            className={cn(
              'relative overflow-hidden rounded-md p-4 shadow-sm',
              light ? 'border border-slate-200 text-slate-800' : 'text-white',
            )}
            style={{ backgroundColor: s.color }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-bold uppercase leading-tight tracking-wide">
                {s.label}
              </p>
              <PieChart className="h-4 w-4 shrink-0 opacity-80" />
            </div>
            <p className="mt-2 text-2xl font-bold">{s.count.toLocaleString()}</p>
          </div>
        )
      })}
    </div>
  )
}
