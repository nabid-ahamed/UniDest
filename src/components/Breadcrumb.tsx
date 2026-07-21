import { Link, useLocation } from 'react-router-dom'

type Crumb = { label: string; to?: string }

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Lead Management',
  '/students': 'Student Management',
  '/applications': 'Applications',
}

// Multi-level trails for nested pages.
const TRAILS: Record<string, Crumb[]> = {
  '/leads/new': [{ label: 'Lead Management', to: '/leads' }, { label: 'Add New Lead' }],
}

export function Breadcrumb() {
  const { pathname } = useLocation()
  const isDashboard = pathname === '/dashboard'
  const trail: Crumb[] = TRAILS[pathname] ?? (TITLES[pathname] ? [{ label: TITLES[pathname] }] : [])

  return (
    <nav className="mb-4 flex items-center gap-2 text-sm">
      <Link to="/dashboard" className="text-slate-500 transition-colors hover:text-brand-600">
        Dashboard
      </Link>
      {!isDashboard &&
        trail.map((c) => (
          <span key={c.label} className="flex items-center gap-2">
            <span className="text-slate-300">/</span>
            {c.to ? (
              <Link to={c.to} className="text-slate-500 transition-colors hover:text-brand-600">
                {c.label}
              </Link>
            ) : (
              <span className="font-medium text-slate-700">{c.label}</span>
            )}
          </span>
        ))}
    </nav>
  )
}
