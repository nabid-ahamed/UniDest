import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronDown } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { cn } from '../../../lib/cn'
import type { TrendPoint } from '../../../mock/dashboard'

interface Series {
  key: keyof Omit<TrendPoint, 'month'>
  name: string
  color: string
}

const SERIES: Series[] = [
  { key: 'students', name: 'Students', color: '#14b8a6' },
  { key: 'leads', name: 'Leads', color: '#f59e0b' },
]

const TIMEFRAMES = [
  { label: 'Last 3 Months', months: 3 },
  { label: 'Last 6 Months', months: 6 },
  { label: 'Last 12 Months', months: 12 },
] as const

// Minimal shape of the props recharts passes to a custom Tooltip `content`.
// Typed locally so we don't depend on recharts' generic TooltipProps, whose
// exported shape varies between versions and broke the production build.
interface TooltipEntry {
  dataKey?: string | number
  name?: string | number
  value?: number | string
  color?: string
}
interface TrendTooltipProps {
  active?: boolean
  label?: string | number
  payload?: TooltipEntry[]
}

/** Floating tooltip card styled like the reference (title + coloured rows). */
function TrendTooltip({ active, payload, label }: TrendTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-sm font-bold text-slate-800">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="mt-1.5 flex items-center gap-2 text-sm text-slate-600">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-bold text-slate-800">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

/** Timeframe picker button + dropdown. */
function TimeframeMenu({
  value,
  onChange,
}: {
  value: (typeof TIMEFRAMES)[number]
  onChange: (t: (typeof TIMEFRAMES)[number]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        <CalendarDays className="h-4 w-4 text-slate-400" />
        {value.label}
        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {TIMEFRAMES.map((t) => (
            <button
              key={t.label}
              type="button"
              role="option"
              aria-selected={t.label === value.label}
              onClick={() => {
                onChange(t)
                setOpen(false)
              }}
              className={cn(
                'block w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-brand-50 hover:text-brand-600',
                t.label === value.label ? 'font-semibold text-brand-600' : 'text-slate-700',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function TrendAreaCard({
  title,
  data,
  height = 280,
}: {
  title: string
  data: TrendPoint[]
  height?: number
}) {
  const [timeframe, setTimeframe] = useState<(typeof TIMEFRAMES)[number]>(TIMEFRAMES[2])
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const chartData = useMemo(() => data.slice(-timeframe.months), [data, timeframe])
  const visible = SERIES.filter((s) => !hidden.has(s.key))

  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      // Keep at least one series on the chart.
      else if (SERIES.length - next.size > 1) next.add(key)
      return next
    })

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Header: title + timeframe */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <TimeframeMenu value={timeframe} onChange={setTimeframe} />
      </div>

      {/* Clickable series toggles (cross out to hide) */}
      <div className="mt-3 flex flex-wrap items-center gap-4">
        {SERIES.map((s) => {
          const off = hidden.has(s.key)
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              aria-pressed={!off}
              className="group inline-flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <span
                className={cn('h-3 w-3 rounded-full border-2 transition-colors')}
                style={{ borderColor: s.color, background: off ? 'transparent' : s.color }}
              />
              <span className={cn(off ? 'text-slate-400 line-through' : 'text-slate-600 group-hover:text-slate-800')}>
                {s.name}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex-1" style={{ minHeight: height }}>
        <ResponsiveContainer width="100%" height="100%" debounce={200}>
          <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -4, bottom: 0 }}>
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              padding={{ left: 8, right: 8 }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
            {visible.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2.5}
                fill={`url(#fill-${s.key})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-center text-xs text-slate-500">{timeframe.label}</p>
    </div>
  )
}
