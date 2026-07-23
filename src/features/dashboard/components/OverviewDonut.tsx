import { useRef, useState, type MouseEvent } from 'react'
import { cn } from '../../../lib/cn'
import { dashboardStats, type StatCardData } from '../../../mock/dashboard'

// Hex accents matching each StatCard colour.
const HEX: Record<StatCardData['color'], string> = {
  blue: '#3b82f6',
  emerald: '#10b981',
  orange: '#f97316',
  purple: '#a855f7',
  rose: '#f43f5e',
}

interface Item {
  key: string
  name: string
  value: number
  color: string
}

const ALL: Item[] = dashboardStats.map((s) => ({
  key: s.key,
  name: s.sublabel,
  value: s.value,
  color: HEX[s.color],
}))

// Fixed viewBox — scales with the container, labels never clip.
// Ring proportions follow the reference: thick band, small centre hole (~⅓).
const VBW = 1000
const VBH = 600
const CX = 475
const CY = 300
const R_OUT = 275
const R_IN = 102
const R_LABEL = R_OUT + 26

/** angleDeg: 0 = top, increasing clockwise. */
function polar(r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function arcPath(a1: number, a2: number) {
  const p1 = polar(R_OUT, a1)
  const p2 = polar(R_OUT, a2)
  const p3 = polar(R_IN, a2)
  const p4 = polar(R_IN, a1)
  const large = a2 - a1 > 180 ? 1 : 0
  return `M${p1.x} ${p1.y} A${R_OUT} ${R_OUT} 0 ${large} 1 ${p2.x} ${p2.y} L${p3.x} ${p3.y} A${R_IN} ${R_IN} 0 ${large} 0 ${p4.x} ${p4.y} Z`
}

/** Push labels apart vertically so none overlap (min gap between centres). */
function spread<T extends { y: number }>(list: T[]): T[] {
  const MIN = 46
  list.sort((a, b) => a.y - b.y)
  for (let i = 1; i < list.length; i++) {
    if (list[i].y - list[i - 1].y < MIN) list[i].y = list[i - 1].y + MIN
  }
  const overflow = list.length ? list[list.length - 1].y - (VBH - 26) : 0
  if (overflow > 0) list.forEach((l) => (l.y -= overflow))
  list.forEach((l) => (l.y = Math.max(26, l.y)))
  return list
}

export function OverviewDonut() {
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [tip, setTip] = useState<{ key: string; x: number; y: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<number | undefined>(undefined)

  const visible = ALL.filter((s) => !hidden.has(s.key))
  const total = visible.reduce((n, s) => n + s.value, 0)
  const pct = (v: number) => (total ? (v / total) * 100 : 0)

  // Hovering a slice OR its label highlights the slice and shows a details box.
  const showTip = (key: string, e: MouseEvent) => {
    window.clearTimeout(hideTimer.current)
    const rect = wrapRef.current?.getBoundingClientRect()
    setActiveKey(key)
    if (rect) setTip({ key, x: e.clientX - rect.left, y: e.clientY - rect.top })
  }
  // Defer the clear so moving from one slice to the next cancels it — the
  // highlight (border + pop) then flows smoothly between slices instead of blinking.
  const hideTip = () => {
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => {
      setActiveKey(null)
      setTip(null)
    }, 90)
  }
  const tipItem = tip ? ALL.find((s) => s.key === tip.key) : undefined

  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else if (ALL.length - next.size > 1) next.add(key)
      return next
    })

  // Put the biggest slice on the left and cluster the rest on the right wedge,
  // so 85%-style skew stays readable.
  const big = visible.reduce((a, b) => (b.value > a.value ? b : a), visible[0])
  const others = visible.filter((s) => s.key !== big.key)
  const othersSum = others.reduce((n, s) => n + s.value, 0)
  const smallsSweep = total ? (othersSum / total) * 360 : 0
  const order = [big, ...others].filter(Boolean)

  let cursor = 90 + smallsSweep / 2
  const arcs = order.map((s) => {
    const sweep = total ? (s.value / total) * 360 : 0
    const a1 = cursor
    const a2 = cursor + sweep
    const mid = a1 + sweep / 2
    cursor = a2
    const g = Math.min(0.4, sweep / 3)
    return { ...s, a1: a1 + g, a2: a2 - g, mid }
  })

  // De-overlapped label anchor points, per side.
  const labels = arcs.map((a) => {
    const p = polar(R_LABEL, a.mid)
    return { ...a, onRight: p.x >= CX, y: p.y }
  })
  const positioned = [
    ...spread(labels.filter((l) => l.onRight)),
    ...spread(labels.filter((l) => !l.onRight)),
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h3 className="text-lg font-bold text-slate-800">Statistics Overview</h3>
      <p className="mt-0.5 text-sm text-slate-500">Distribution across all records — hover a slice for details.</p>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:py-4">
        {/* Donut (hand-rolled SVG so labels never clip or overlap) */}
        <div ref={wrapRef} className="relative w-full lg:flex-1">
          <svg
            viewBox={`0 0 ${VBW} ${VBH}`}
            className="h-auto w-full"
            role="img"
            aria-label="Statistics distribution donut chart"
          >
            {arcs.map((a) => {
              const on = activeKey === a.key
              return (
                <path
                  key={a.key}
                  d={arcPath(a.a1, a.a2)}
                  fill={a.color}
                  fillOpacity={!activeKey || on ? 1 : 0.4}
                  stroke="#fff"
                  strokeWidth={1}
                  className="cursor-pointer"
                  style={{ transition: 'fill-opacity 220ms ease' }}
                  onMouseEnter={(e) => showTip(a.key, e)}
                  onMouseMove={(e) => showTip(a.key, e)}
                  onMouseLeave={hideTip}
                />
              )
            })}

            {/* Single highlight border that rotates around to the active slice, so
                moving between slices makes the border sweep into place. */}
            {(() => {
              const a = arcs.find((x) => x.key === activeKey)
              if (!a) return null
              const w = a.a2 - a.a1
              return (
                <path
                  d={arcPath(90 - w / 2, 90 + w / 2)} // drawn centred at the top, then rotated
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  strokeLinejoin="round"
                  className="pointer-events-none"
                  style={{
                    transformBox: 'view-box',
                    transformOrigin: `${CX}px ${CY}px`,
                    transform: `rotate(${a.mid - 90}deg)`,
                    transition: 'transform 620ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              )
            })()}
            {positioned.map((l) => {
              // Elbow leader line (like the reference): poke straight out from the
              // slice edge, then a short horizontal shelf into the label — keeps the
              // crowded cluster tidy.
              const A = polar(R_OUT, l.mid) // on the ring
              const B = polar(R_OUT + 18, l.mid) // radial poke-out (elbow)
              const colX = l.onRight ? CX + R_OUT + 46 : CX - R_OUT - 46 // shelf end
              const tx = l.onRight ? colX + 6 : colX - 6
              const anchor = l.onRight ? 'start' : 'end'
              const dim = activeKey !== null && activeKey !== l.key
              const p = pct(l.value)
              return (
                <g
                  key={l.key}
                  opacity={dim ? 0.35 : 1}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={(e) => showTip(l.key, e)}
                  onMouseMove={(e) => showTip(l.key, e)}
                  onMouseLeave={hideTip}
                >
                  <polyline
                    points={`${A.x},${A.y} ${B.x},${B.y} ${colX},${l.y}`}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth={2}
                  />
                  <text x={tx} y={l.y - 6} textAnchor={anchor} fontSize={17} fontWeight={700} fill="#334155">
                    {l.name}
                  </text>
                  <text x={tx} y={l.y + 15} textAnchor={anchor} fontSize={15} fill="#64748b">
                    {p < 10 ? p.toFixed(1) : Math.round(p)}%
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Floating details tooltip — reference style (name, amount, percentage). */}
          {tip && tipItem && (
            <div
              className="animate-fade-in pointer-events-none absolute left-0 top-0 z-10 min-w-44 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg"
              style={{
                transform: `translate(${Math.min(tip.x + 16, (wrapRef.current?.clientWidth ?? 0) - 190)}px, ${tip.y + 16}px)`,
                transition: 'transform 260ms ease-out',
              }}
            >
              <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: tipItem.color }} />
                {tipItem.name}
              </p>
              <p className="mt-1.5 text-sm text-slate-600">
                Count: <span className="font-bold text-slate-800">{tipItem.value.toLocaleString()}</span>
              </p>
              <p className="text-sm text-slate-600">
                Percentage: <span className="font-bold text-slate-800">{pct(tipItem.value).toFixed(1)}%</span>
              </p>
            </div>
          )}
        </div>

        {/* Legend at the far right — click to cross an item out and hide its slice. */}
        <ul className="space-y-4 lg:shrink-0 lg:pr-4">
          {ALL.map((s) => {
            const off = hidden.has(s.key)
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => toggle(s.key)}
                  onMouseEnter={() => !off && setActiveKey(s.key)}
                  onMouseLeave={() => setActiveKey(null)}
                  aria-pressed={!off}
                  className="group flex items-center gap-3 text-left"
                >
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: off ? '#94a3b8' : s.color }} />
                  <span
                    className={cn(
                      'text-[15px] transition-colors',
                      off ? 'text-slate-400 line-through' : 'text-slate-700 group-hover:text-slate-900',
                    )}
                  >
                    {s.name}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
