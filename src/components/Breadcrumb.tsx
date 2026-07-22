import { Link, useLocation } from 'react-router-dom'

type Crumb = { label: string; to?: string }

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Lead Management',
  '/students': 'Student Management',
  '/applications': 'Applications',
  '/webinars': 'Webinar',
  '/course-finder': 'Course Finder',
  '/broadcast': 'Broadcast',
  '/services': 'Additional Services',
}

// Multi-level trails for nested pages.
const TRAILS: Record<string, Crumb[]> = {
  '/leads/new': [{ label: 'Lead Management', to: '/leads' }, { label: 'Add New Lead' }],
  '/broadcast/history': [{ label: 'Broadcast', to: '/broadcast' }, { label: 'Broadcast History' }],
}

// Dynamic (parameterised) routes that a static map can't cover.
function dynamicTrail(pathname: string): Crumb[] | null {
  if (/^\/leads\/\d+$/.test(pathname))
    return [{ label: 'Lead Management', to: '/leads' }, { label: 'View' }]
  if (/^\/leads\/\d+\/edit$/.test(pathname))
    return [{ label: 'Lead Management', to: '/leads' }, { label: 'Edit Profile' }]
  if (/^\/services\/\d+$/.test(pathname))
    return [
      { label: 'Additional Services', to: '/services' },
      { label: 'Visa & Services Detail' },
    ]
  if (/^\/students\/\d+$/.test(pathname))
    return [{ label: 'Student Management', to: '/students' }, { label: 'View' }]
  if (/^\/webinars\/\d+$/.test(pathname))
    return [{ label: 'Webinar', to: '/webinars' }, { label: 'View Webinar' }]
  if (/^\/webinars\/\d+\/edit$/.test(pathname))
    return [{ label: 'Webinar', to: '/webinars' }, { label: 'Edit Webinar' }]
  if (/^\/webinars\/\d+\/enrolled$/.test(pathname))
    return [{ label: 'Webinar', to: '/webinars' }, { label: 'Enrolled Users' }]
  return null
}

export function Breadcrumb() {
  const { pathname } = useLocation()
  const isDashboard = pathname === '/dashboard'
  const trail: Crumb[] =
    TRAILS[pathname] ??
    dynamicTrail(pathname) ??
    (TITLES[pathname] ? [{ label: TITLES[pathname] }] : [])

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
