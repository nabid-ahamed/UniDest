import { NavLink } from 'react-router-dom'
import { GraduationCap, Menu, Home, Bell, BookOpenCheck } from 'lucide-react'
import { cn } from '../lib/cn'
import { useUI } from '../store/ui'
import { CheckInTimer } from './CheckInTimer'
import { AdminMenu } from './AdminMenu'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/students', label: 'Students' },
  { to: '/applications', label: 'Applications' },
]

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-50 text-brand-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  )
}

export function Header() {
  const toggleSidebar = useUI((s) => s.toggleSidebar)

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <NavLink to="/dashboard" className="flex items-center gap-2 pr-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="hidden text-xl font-extrabold tracking-tight text-brand-700 sm:inline">
            UniDest
          </span>
        </NavLink>

        {/* Hamburger — opens the full sidebar */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop quick nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          <NavLink to="/dashboard" className={navClass} aria-label="Home">
            <Home className="h-5 w-5" />
          </NavLink>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <CheckInTimer />

          <button
            type="button"
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          <button
            type="button"
            className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:block"
            aria-label="Guide"
          >
            <BookOpenCheck className="h-5 w-5" />
          </button>

          <AdminMenu />
        </div>
      </div>
    </header>
  )
}
