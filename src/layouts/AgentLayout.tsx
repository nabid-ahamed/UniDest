import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { BriefcaseBusiness, FileText, LayoutDashboard, Menu, Search, Users, X } from 'lucide-react'
import { useAuth } from '../store/auth'

const links = [
  { to: '/agent/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/agent/students', label: 'Students', icon: Users },
  { to: '/agent/applications', label: 'Applications', icon: FileText },
  { to: '/agent/course-finder', label: 'Course Finder', icon: Search },
  { to: '/agent/webinars', label: 'Webinars', icon: FileText },
  { to: '/agent/commission', label: 'My Commission', icon: FileText },
  { to: '/agent/resources', label: 'Resources', icon: FileText },
  { to: '/agent/invoices', label: 'Invoices', icon: FileText },
  { to: '/agent/services', label: 'Additional Services', icon: FileText },
]

export default function AgentLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const pathname = useLocation().pathname
  return <div className="min-h-screen bg-slate-100 lg:pl-64">
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5"><div className="flex items-center gap-2 font-bold text-slate-900"><BriefcaseBusiness className="h-5 w-5 text-brand-600" /> Agent Portal</div><button onClick={() => setOpen(false)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Close menu"><X className="h-5 w-5" /></button></div>
      <nav className="space-y-1 p-3">{links.map(({ to, label, icon: Icon }) => <Link key={to} to={to} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${pathname === to ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}><Icon className="h-4 w-4" />{label}</Link>)}</nav>
      <div className="absolute inset-x-3 bottom-4 border-t border-slate-200 pt-4"><p className="truncate px-3 text-sm font-semibold text-slate-800">{user?.name}</p><p className="truncate px-3 text-xs text-slate-500">{user?.email}</p><button onClick={logout} className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Sign out</button></div>
    </aside>
    {open && <button className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu overlay" />}
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white px-4 sm:px-6"><button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button><div className="ml-2 text-sm font-semibold text-slate-700">Partner workspace</div></header>
    <main className="px-4 py-6 sm:px-6"><Outlet /></main>
  </div>
}