import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { studentNav } from './studentNav'
import { currentStudent } from '../../mock/student/portal'
import logo from '../../assets/globaled-logo.png'

/**
 * Student portal sidebar. Fixed white rail on desktop; slides in as a drawer on
 * mobile (`open` / `onClose`). Structure follows the EduCtrl cn4 reference —
 * logo, "Welcome <name>", a "STUDENT MENU" label, then the icon menu — but uses
 * our brand blue and NavLink routing.
 */
export function StudentSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const student = currentStudent()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 border-l-[3px] px-4 py-2.5 text-[14px] font-medium transition-colors',
      isActive
        ? 'border-brand-600 bg-brand-50 text-brand-700'
        : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    )

  return (
    <>
      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand + welcome */}
        <div className="relative border-b border-slate-200 px-5 py-4 text-center">
          <a href="/portal" className="inline-flex items-center justify-center">
            <img
              src={logo}
              alt="GlobalEd — Student Portal"
              width={1198}
              height={294}
              className="h-9 w-auto"
            />
          </a>
          <p className="mt-2 text-sm text-slate-500">
            Welcome <span className="font-semibold text-slate-800">{student.name}</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-3">
          <p className="px-5 pb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Student Menu</p>
          {studentNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={onClose} className={linkClass}>
              <Icon className="h-5 w-5 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
