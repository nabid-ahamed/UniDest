import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Phone, Send, Menu, ChevronDown, UserRound, LogOut } from 'lucide-react'
import { useAuth } from '../../store/auth'
import { currentStudent } from '../../mock/student/portal'

const SUPPORT_PHONE = '+880 1700-000000'
const SUPPORT_EMAIL = 'support@globaled.com'

/**
 * Student portal top bar. Brand-blue strip with support contact on the left and
 * the account menu (avatar + dropdown) on the right; a hamburger toggles the
 * sidebar drawer on mobile. Structure follows the EduCtrl cn4 reference.
 */
export function StudentHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const navigate = useNavigate()
  const logout = useAuth((s) => s.logout)
  const student = currentStudent()
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const initial = (student.name.trim()[0] ?? 'S').toUpperCase()

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const signOut = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-brand-600 px-4 text-white sm:px-6">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-lg p-1.5 hover:bg-white/15 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Support contact */}
      <div className="flex items-center gap-5 text-sm font-semibold">
        <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-white/90">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
            <Phone className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">{SUPPORT_PHONE}</span>
        </a>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-2 hover:text-white/90">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
            <Send className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">{SUPPORT_EMAIL}</span>
        </a>
      </div>

      {/* Account menu */}
      <div ref={ref} className="relative ml-auto">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-white/15"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-brand-900">
            {initial}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-slate-700 shadow-lg">
            <div className="border-b border-slate-100 px-4 py-2.5">
              <p className="truncate text-sm font-semibold text-slate-800">{student.name}</p>
              <p className="truncate text-xs text-slate-400">{student.email}</p>
            </div>
            <Link
              to="/portal/account"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
            >
              <UserRound className="h-4 w-4 text-slate-400" /> My Account
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
