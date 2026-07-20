import type { SimpleStat } from '../../../mock/dashboard'

export function StatTile({ stat }: { stat: SimpleStat }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-2xl font-bold tabular-nums text-slate-900">
        {stat.value.toLocaleString()}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
    </div>
  )
}
