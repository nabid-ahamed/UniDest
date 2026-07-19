import { GraduationCap, Menu, Bell, BookOpenCheck } from 'lucide-react'
import { useUI } from '../store/ui'
import { CheckInTimer } from './CheckInTimer'
import { AdminMenu } from './AdminMenu'

export function Header() {
  const toggleSidebar = useUI((s) => s.toggleSidebar)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
        {/* Logo — full page refresh to dashboard */}
        <a href="/dashboard" className="flex items-center gap-2 pr-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="hidden text-4xl font-extrabold tracking-tight text-brand-700 sm:inline">
            UniDest
          </span>
        </a>

        {/* Hamburger — opens the full sidebar */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

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
