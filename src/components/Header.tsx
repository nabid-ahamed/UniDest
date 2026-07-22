import { useEffect, useRef } from 'react'
import { Menu, Bell, BookOpenCheck } from 'lucide-react'
import { useUI } from '../store/ui'
import { CheckInTimer } from './CheckInTimer'
import { AdminMenu } from './AdminMenu'
import logo from '../assets/globaled-logo.png'

export function Header() {
  const toggleSidebar = useUI((s) => s.toggleSidebar)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  // Publish the hamburger *icon's* right edge as --sidebar-w so the open sidebar
  // ends flush with the visible glyph. We measure the <svg>, not the button —
  // the button's p-2 padding would push the edge ~8px past the icon. Measured
  // rather than hard-coded because the logo width (and so the hamburger's
  // position) shifts with font loading and zoom.
  useEffect(() => {
    const apply = () => {
      const icon = hamburgerRef.current?.querySelector('svg') ?? hamburgerRef.current
      const rect = icon?.getBoundingClientRect()
      if (rect) {
        document.documentElement.style.setProperty('--sidebar-w', `${Math.round(rect.right)}px`)
      }
    }
    apply()
    window.addEventListener('resize', apply)
    document.fonts?.ready.then(apply).catch(() => {})
    return () => window.removeEventListener('resize', apply)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
        {/* Logo — full page refresh to dashboard */}
        <a href="/dashboard" className="flex items-center pr-1">
          {/* width/height attrs keep the aspect ratio reserved before the file
              loads, so the measured hamburger position doesn't shift. */}
          <img
            src={logo}
            alt="GlobalEd — IELTS & Study Abroad Consultancy"
            width={1198}
            height={294}
            className="h-9 w-auto sm:h-10"
          />
        </a>

        {/* Hamburger — opens the full sidebar */}
        <button
          ref={hamburgerRef}
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
