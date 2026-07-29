import { useEffect, useRef, useState, type ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, User, Settings, LogOut, ShieldCheck, Briefcase, GraduationCap } from 'lucide-react'
import { useAuth } from '../store/auth'
import { useAttendance } from '../store/attendance'
import { AlertDialog } from './ui/AlertDialog'

/** Per-role chip icon — a distinct logo before the Admin / Staff / Student label. */
const ROLE_ICON: Record<string, ComponentType<{ className?: string }>> = {
  Admin: ShieldCheck,
  Staff: Briefcase,
  Student: GraduationCap,
}

/** "Admin ▾" dropdown in the header. */
export function AdminMenu() {
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const checkedIn = useAttendance((s) => s.checkedIn)
  const [open, setOpen] = useState(false)
  const [blockedAlert, setBlockedAlert] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleLogout = () => {
    setOpen(false)
    // Block sign-out while clocked in — must check out first.
    if (checkedIn) {
      setBlockedAlert(true)
      return
    }
    logout()
    navigate('/login')
  }

  // Show the role in the chip (Admin / Student / Staff), not the name.
  const roleLabel = user?.role === 'Administrator' ? 'Admin' : user?.role || 'Admin'
  const RoleIcon = ROLE_ICON[roleLabel] ?? ShieldCheck

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <RoleIcon className="h-4 w-4" />
        </span>
        <span className="font-bold capitalize text-slate-900">{roleLabel}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold capitalize text-slate-900">
              {user?.name || 'Admin'}
            </p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={() => { setOpen(false); navigate('/profile') }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <User className="h-4 w-4 text-slate-400" /> My profile
          </button>
          <button
            onClick={() => { setOpen(false); navigate('/settings') }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Settings className="h-4 w-4 text-slate-400" /> Settings
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}

      <AlertDialog
        open={blockedAlert}
        title="You are Checked-in"
        message="Please check-out before you can sign out."
        onOk={() => setBlockedAlert(false)}
      />
    </div>
  )
}
