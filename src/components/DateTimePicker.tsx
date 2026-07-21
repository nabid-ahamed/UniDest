import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Home,
  CalendarClock,
} from 'lucide-react'
import { cn } from '../lib/cn'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface TimeSlot {
  label: string
  hour: number
}

/** Hourly slots, 8:00 AM – 10:00 PM. */
const TIME_SLOTS: TimeSlot[] = Array.from({ length: 15 }, (_, i) => {
  const hour = 8 + i
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return { label: `${h12}:00 ${hour < 12 ? 'AM' : 'PM'}`, hour }
})

export function formatDateTime(d: Date): string {
  const date = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(d)
  return `${date}, ${time}`
}

/**
 * Date & time field with a custom popover: calendar (month/year dropdowns,
 * prev/next arrows, home = jump to today) plus an hourly time list on the
 * right, styled after the reference picker. The value resolves once both a
 * day and a time are chosen.
 */
export function DateTimePicker({
  id,
  value,
  onChange,
  invalid,
  describedBy,
  placeholder = 'Select date & time',
}: {
  id?: string
  value: Date | null
  onChange: (next: Date) => void
  invalid?: boolean
  describedBy?: string
  placeholder?: string
}) {
  const today = useMemo(() => new Date(), [])
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState((value ?? today).getFullYear())
  const [viewMonth, setViewMonth] = useState((value ?? today).getMonth())
  const [selDay, setSelDay] = useState<{ y: number; m: number; d: number } | null>(
    value ? { y: value.getFullYear(), m: value.getMonth(), d: value.getDate() } : null,
  )
  const [selHour, setSelHour] = useState<number | null>(value ? value.getHours() : null)
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // 6 fixed weeks so the grid never changes height while browsing months.
  const cells = useMemo(() => {
    const startDow = new Date(viewYear, viewMonth, 1).getDay()
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(viewYear, viewMonth, 1 - startDow + i)
      return {
        y: date.getFullYear(),
        m: date.getMonth(),
        d: date.getDate(),
        inMonth: date.getMonth() === viewMonth,
      }
    })
  }, [viewYear, viewMonth])

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 1 + i)

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const goHome = () => {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  const commit = (day: typeof selDay, hour: number | null) => {
    if (day && hour !== null) {
      onChange(new Date(day.y, day.m, day.d, hour, 0))
      setOpen(false)
    }
  }

  const pickDay = (c: (typeof cells)[number]) => {
    const day = { y: c.y, m: c.m, d: c.d }
    setSelDay(day)
    if (!c.inMonth) {
      setViewYear(c.y)
      setViewMonth(c.m)
    }
    commit(day, selHour)
  }

  const pickHour = (hour: number) => {
    setSelHour(hour)
    commit(selDay, hour)
  }

  const isSel = (c: (typeof cells)[number]) =>
    selDay && selDay.y === c.y && selDay.m === c.m && selDay.d === c.d
  const isToday = (c: (typeof cells)[number]) =>
    c.y === today.getFullYear() && c.m === today.getMonth() && c.d === today.getDate()

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2.5 text-left text-sm focus:outline-none focus:ring-2',
          invalid
            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30',
        )}
      >
        <span className={value ? 'text-slate-800' : 'text-slate-500'}>
          {value ? formatDateTime(value) : placeholder}
        </span>
        <CalendarClock className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 flex rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          {/* Calendar */}
          <div className="w-64">
            <div className="flex items-center justify-between px-1 pb-2">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  aria-label="Previous month"
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goHome}
                  aria-label="Go to current month"
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <Home className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  aria-label="Month"
                  className="cursor-pointer rounded border-none bg-transparent py-0.5 pl-1 pr-5 text-sm font-semibold text-slate-800 focus:ring-1 focus:ring-brand-500"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  aria-label="Year"
                  className="cursor-pointer rounded border-none bg-transparent py-0.5 pl-1 pr-5 text-sm font-semibold text-slate-800 underline underline-offset-2 focus:ring-1 focus:ring-brand-500"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-0.5 rounded-md bg-slate-50 p-1">
              {DOW.map((d) => (
                <span
                  key={d}
                  className="py-1 text-center text-xs font-semibold text-slate-500"
                >
                  {d}
                </span>
              ))}
              {cells.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickDay(c)}
                  className={cn(
                    'mx-auto flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors',
                    isSel(c)
                      ? 'bg-brand-600 font-semibold text-white'
                      : c.inMonth
                        ? 'text-slate-700 hover:bg-brand-50 hover:text-brand-700'
                        : 'text-slate-300 hover:bg-slate-100',
                    !isSel(c) && isToday(c) && 'ring-1 ring-inset ring-brand-400',
                  )}
                >
                  {c.d}
                </button>
              ))}
            </div>
          </div>

          {/* Time list */}
          <div className="ml-2 flex w-28 flex-col">
            <button
              type="button"
              onClick={() => listRef.current?.scrollBy({ top: -108, behavior: 'smooth' })}
              aria-label="Earlier times"
              className="flex justify-center rounded p-0.5 text-slate-500 hover:bg-slate-100"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <div ref={listRef} className="max-h-56 flex-1 overflow-y-auto">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t.hour}
                  type="button"
                  onClick={() => pickHour(t.hour)}
                  className={cn(
                    'block w-full border-b border-slate-100 px-2 py-1.5 text-left text-sm last:border-b-0',
                    t.hour === selHour
                      ? 'bg-brand-600 font-semibold text-white'
                      : 'text-slate-700 hover:bg-brand-50 hover:text-brand-700',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => listRef.current?.scrollBy({ top: 108, behavior: 'smooth' })}
              aria-label="Later times"
              className="flex justify-center rounded p-0.5 text-slate-500 hover:bg-slate-100"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
