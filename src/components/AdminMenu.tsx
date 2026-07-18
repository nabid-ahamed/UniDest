import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, User, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../store/auth'

/** "Admin ▾" dropdown in the header. */
export function AdminMenu() {
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initial = (user?.name || 'A').charAt(0).toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs text-white">
          {initial}
        </span>
        <span className="hidden capitalize sm:inline">{user?.name || 'Admin'}</span>
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
          <button className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <User className="h-4 w-4 text-slate-400" /> My profile
          </button>
          <button className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
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
    </div>
  )
}
