import { Users, User, ClipboardList, MessageSquare } from 'lucide-react'
import type { StatCardData } from '../../../mock/dashboard'

const ICONS = {
  leads: Users,
  students: User,
  applications: ClipboardList,
  support: MessageSquare,
} as const

const COLORS: Record<StatCardData['color'], string> = {
  amber: 'bg-amber-100 text-amber-600',
  blue: 'bg-blue-100 text-blue-600',
  sky: 'bg-sky-100 text-sky-600',
  purple: 'bg-purple-100 text-purple-600',
}

export function StatCard({ stat }: { stat: StatCardData }) {
  const Icon = ICONS[stat.key]

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${COLORS[stat.color]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
        <p className="text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}</p>
        <p className="mt-0.5 text-xs text-slate-400">{stat.sublabel}</p>
      </div>
    </div>
  )
}
