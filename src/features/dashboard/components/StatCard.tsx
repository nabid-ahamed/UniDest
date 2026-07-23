import { Users, User, ClipboardList, MessageSquare, UserCog } from 'lucide-react'
import type { StatCardData } from '../../../mock/dashboard'

const ICONS = {
  leads: Users,
  students: User,
  applications: ClipboardList,
  support: MessageSquare,
  staff: UserCog,
} as const

interface Palette {
  strip: string // left accent bar
  card: string // gradient tint of the card background (paired with `to-white`)
  iconTile: string // gradient fill of the icon tile
  iconShadow: string // coloured glow under the icon tile
  value: string // big number
  label: string // uppercase sub-label
  blob: string // faint decorative corner circle
  hoverRing: string // ring colour on hover
  hoverShadow: string // coloured lift shadow on hover
}

// Each accent keeps white text on the icon tile ≥ 4.5:1 and uses the 600/700
// shade for the number/label so it clears WCAG AA on the light card.
const COLORS: Record<StatCardData['color'], Palette> = {
  blue: {
    strip: 'bg-blue-500',
    card: 'from-blue-50',
    iconTile: 'from-blue-400 to-blue-600',
    iconShadow: 'shadow-blue-500/30',
    value: 'text-blue-600',
    label: 'text-blue-500',
    blob: 'bg-blue-200/30',
    hoverRing: 'hover:ring-blue-200',
    hoverShadow: 'hover:shadow-blue-500/20',
  },
  emerald: {
    strip: 'bg-emerald-500',
    card: 'from-emerald-50',
    iconTile: 'from-emerald-400 to-emerald-600',
    iconShadow: 'shadow-emerald-500/30',
    value: 'text-emerald-600',
    label: 'text-emerald-600',
    blob: 'bg-emerald-200/30',
    hoverRing: 'hover:ring-emerald-200',
    hoverShadow: 'hover:shadow-emerald-500/20',
  },
  orange: {
    strip: 'bg-orange-500',
    card: 'from-orange-50',
    iconTile: 'from-orange-400 to-orange-600',
    iconShadow: 'shadow-orange-500/30',
    value: 'text-orange-600',
    label: 'text-orange-500',
    blob: 'bg-orange-200/30',
    hoverRing: 'hover:ring-orange-200',
    hoverShadow: 'hover:shadow-orange-500/20',
  },
  purple: {
    strip: 'bg-purple-500',
    card: 'from-purple-50',
    iconTile: 'from-purple-400 to-purple-600',
    iconShadow: 'shadow-purple-500/30',
    value: 'text-purple-600',
    label: 'text-purple-500',
    blob: 'bg-purple-200/30',
    hoverRing: 'hover:ring-purple-200',
    hoverShadow: 'hover:shadow-purple-500/20',
  },
  rose: {
    strip: 'bg-rose-500',
    card: 'from-rose-50',
    iconTile: 'from-rose-400 to-rose-600',
    iconShadow: 'shadow-rose-500/30',
    value: 'text-rose-600',
    label: 'text-rose-500',
    blob: 'bg-rose-200/30',
    hoverRing: 'hover:ring-rose-200',
    hoverShadow: 'hover:shadow-rose-500/20',
  },
}

export function StatCard({ stat }: { stat: StatCardData }) {
  const Icon = ICONS[stat.key]
  const c = COLORS[stat.color]

  return (
    <div
      className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br ${c.card} to-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl ${c.hoverRing} ${c.hoverShadow} motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
    >
      {/* Ash overlay — wipes across the whole card from left to right on hover. */}
      <span
        className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-slate-300/50 transition-transform duration-300 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
        aria-hidden="true"
      />
      {/* Decorative corner bubble — grows on hover, sits above the ash wipe. */}
      <span
        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full ${c.blob} transition-transform duration-500 ease-out group-hover:scale-150 motion-reduce:transform-none`}
        aria-hidden="true"
      />
      {/* Left accent strip — fades out as the ash overlay wipes in. */}
      <span
        className={`absolute inset-y-0 left-0 w-1.5 ${c.strip} transition-opacity duration-300 group-hover:opacity-0`}
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-4 py-6 pl-7 pr-5">
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${c.iconTile} text-white shadow-lg ${c.iconShadow} transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-110 motion-reduce:transform-none`}
        >
          <Icon className="h-8 w-8" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className={`text-3xl font-extrabold leading-none tabular-nums ${c.value}`}>
            {stat.value.toLocaleString()}
          </p>
          <p className={`mt-2 text-xs font-bold uppercase leading-tight tracking-wide ${c.label}`}>
            {stat.sublabel}
          </p>
        </div>
      </div>
    </div>
  )
}
