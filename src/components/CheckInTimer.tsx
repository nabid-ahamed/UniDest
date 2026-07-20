import { useEffect, useRef, useState, type ComponentType } from 'react'
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  X,
  ChevronDown,
  Coffee,
  Utensils,
  Timer,
  Play,
  Loader2,
} from 'lucide-react'
import { cn } from '../lib/cn'
import { useAttendance } from '../store/attendance'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { OtherBreakDialog } from './ui/OtherBreakDialog'
import { SuccessDialog } from './ui/SuccessDialog'
import { AlertDialog } from './ui/AlertDialog'

type IconType = ComponentType<{ className?: string }>

interface Toast {
  message: string
  type: 'in' | 'out' | 'break'
}

interface Break {
  label: string
  icon: IconType
  duration: number // seconds
  startedAt: number // ms timestamp
}

const TOAST_BG: Record<Toast['type'], string> = {
  in: '#10b981',
  out: '#475569',
  break: '#f59e0b',
}

const BREAKS = [
  { label: 'Short Break', hint: '15 Min', icon: Coffee, duration: 15 * 60 },
  { label: 'Meal Break', hint: '1 Hr', icon: Utensils, duration: 60 * 60 },
  { label: 'Other Break', hint: 'Custom', icon: Timer, duration: 30 * 60 },
]

const formatTime = (total: number) => {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${String(h).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`
}

/** Staff attendance: persisted check-in timer, breaks, check-out confirm + toast. */
export function CheckInTimer() {
  const checkedIn = useAttendance((s) => s.checkedIn)
  const checkInAt = useAttendance((s) => s.checkInAt)
  const checkInAction = useAttendance((s) => s.checkIn)
  const checkOutAction = useAttendance((s) => s.checkOut)
  const addPausedMs = useAttendance((s) => s.addPausedMs)

  const [brk, setBrk] = useState<Break | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [toast, setToast] = useState<Toast | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [otherOpen, setOtherOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationAlert, setLocationAlert] = useState(false)
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const onBreak = brk !== null

  // Tick every second while checked in (drives both the work timer and break countdown).
  useEffect(() => {
    if (!checkedIn) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [checkedIn])

  // Derived times (timestamp-based → survive refresh).
  const workSec = !checkInAt
    ? 0
    : brk
      ? Math.max(0, Math.floor((brk.startedAt - checkInAt) / 1000))
      : Math.max(0, Math.floor((now - checkInAt) / 1000))
  const breakRemaining = brk
    ? Math.max(0, brk.duration - Math.floor((now - brk.startedAt) / 1000))
    : 0

  const endBreak = (silent = false) => {
    if (!brk) return
    addPausedMs(Date.now() - brk.startedAt)
    setBrk(null)
    if (!silent) showToast({ message: 'Welcome back!', type: 'in' })
  }

  // Auto-end break when the countdown reaches zero.
  useEffect(() => {
    if (brk && breakRemaining <= 0) endBreak(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brk, breakRemaining])

  // Close the break menu on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => () => {
    if (toastRef.current) clearTimeout(toastRef.current)
  }, [])

  const showToast = (t: Toast) => {
    setToast(t)
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3500)
  }

  const checkIn = () => {
    if (!navigator.geolocation) {
      setLocationAlert(true)
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        checkInAction({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setNow(Date.now())
        showToast({ message: 'You have Clocked-In!', type: 'in' })
      },
      () => {
        setLocating(false)
        setLocationAlert(true)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const checkOut = () => {
    setConfirmOpen(false)
    setBrk(null)
    checkOutAction()
    setSuccessOpen(true)
  }

  const beginBreak = (label: string, icon: IconType, durationSec: number, hint: string) => {
    setBrk({ label, icon, duration: durationSec, startedAt: Date.now() })
    setNow(Date.now())
    showToast({ message: `${label} started (${hint})`, type: 'break' })
  }

  const onBreakItem = (b: (typeof BREAKS)[number]) => {
    setMenuOpen(false)
    if (b.label === 'Other Break') {
      setOtherOpen(true)
    } else {
      beginBreak(b.label, b.icon, b.duration, b.hint)
    }
  }

  const BreakIcon = brk?.icon

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Work timer pill */}
        <div
          className={cn(
            'hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold tabular-nums sm:flex',
            checkedIn ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500',
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          {formatTime(workSec)}
        </div>

        {/* Break countdown pill */}
        {brk && BreakIcon && (
          <div className="hidden items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[13px] font-semibold tabular-nums text-amber-600 sm:flex">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(breakRemaining)}
            <BreakIcon className="h-3.5 w-3.5" />
          </div>
        )}

        {/* Action button */}
        {!checkedIn ? (
          <button
            type="button"
            onClick={checkIn}
            disabled={locating}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-600 bg-white px-3 py-1.5 text-[13px] font-semibold text-brand-600 transition-colors hover:bg-brand-600 hover:text-white disabled:opacity-70 sm:min-w-[104px]"
          >
            {locating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogIn className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{locating ? 'Locating…' : 'Check-in'}</span>
          </button>
        ) : onBreak ? (
          <button
            type="button"
            onClick={() => endBreak()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500 bg-white px-3 py-1.5 text-[13px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white"
          >
            <Play className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">I&apos;m Back</span>
          </button>
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-600 bg-white px-3 py-1.5 text-[13px] font-semibold text-brand-600 transition-colors hover:bg-brand-600 hover:text-white"
            >
              <span className="hidden sm:inline">Check-out/ Break</span>
              <LogOut className="h-3.5 w-3.5 sm:hidden" />
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', menuOpen && 'rotate-180')} />
            </button>

            {menuOpen && (
              <div className="absolute left-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {BREAKS.map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => onBreakItem(b)}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <b.icon className="h-4 w-4 shrink-0 text-brand-600" />
                    <span className="font-semibold">{b.label}</span>
                    <span className="text-slate-500">({b.hint})</span>
                  </button>
                ))}
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    setConfirmOpen(true)
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Check-out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          key={toast.message}
          className="animate-toast-in fixed right-4 top-20 z-50 flex items-center gap-3 overflow-hidden rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg"
          style={{ backgroundColor: TOAST_BG[toast.type] }}
          role="status"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-white/80 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="animate-toast-progress absolute bottom-0 left-0 h-1 bg-white/40" />
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        message="Do you want to check-out?"
        confirmLabel="Check-out"
        onConfirm={checkOut}
        onCancel={() => setConfirmOpen(false)}
      />

      <OtherBreakDialog
        open={otherOpen}
        onConfirm={(durationSec, hint) => {
          setOtherOpen(false)
          beginBreak('Other Break', Timer, durationSec, hint)
        }}
        onCancel={() => setOtherOpen(false)}
      />

      <SuccessDialog
        open={successOpen}
        message="You have Clocked-Out!"
        onOk={() => setSuccessOpen(false)}
      />

      <AlertDialog
        open={locationAlert}
        title="Location required"
        message="Please allow location access to check in, then try again."
        onOk={() => setLocationAlert(false)}
      />
    </>
  )
}
