import { useEffect, useRef, useState } from 'react'
import { Clock, LogIn, LogOut } from 'lucide-react'
import { cn } from '../lib/cn'

/** Staff attendance check-in with a running timer (mock, front-end only). */
export function CheckInTimer() {
  const [checkedIn, setCheckedIn] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (checkedIn) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [checkedIn])

  const toggle = () => {
    if (checkedIn) {
      setCheckedIn(false)
      setSeconds(0)
    } else {
      setCheckedIn(true)
    }
  }

  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  const display = seconds >= 3600 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold tabular-nums sm:flex',
          checkedIn ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500',
        )}
      >
        <Clock className="h-4 w-4" />
        {display}
      </div>
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-colors',
          checkedIn ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand-600 hover:bg-brand-700',
        )}
      >
        {checkedIn ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
        <span className="hidden sm:inline">{checkedIn ? 'Check-out' : 'Check-in'}</span>
      </button>
    </div>
  )
}
