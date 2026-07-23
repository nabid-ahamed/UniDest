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
  '/invoices/university': 'University Invoices',
  '/invoices/student': 'Student Invoices',
  '/referral/signups': 'Student Referral Signups',
  '/referral/payout': 'Referral Payout',
  '/analytics': 'Analytics',
  '/automation': 'Automation - Workflows',
  '/staff': 'Staff',
  '/courses': 'University Course Management',
  '/course-categories': 'Course Categories',
  '/universities': 'Universities',
  '/student-resources': 'Student Resources',
  '/media-library': 'Media Library',
  '/announcements': 'Announcements',
  '/user-management': 'User Management',
}

// Multi-level trails for nested pages.
const TRAILS: Record<string, Crumb[]> = {
  '/leads/new': [{ label: 'Lead Management', to: '/leads' }, { label: 'Add New Lead' }],
  '/broadcast/history': [{ label: 'Broadcast', to: '/broadcast' }, { label: 'Broadcast History' }],
  '/invoices/student/new': [
    { label: 'Student Invoices', to: '/invoices/student' },
    { label: 'New Invoice' },
  ],
  '/automation/campaigns': [{ label: 'Automation - Campaigns' }],
  '/automation/create/workflow': [
    { label: 'Automation - Workflows', to: '/automation' },
    { label: 'New Workflow' },
  ],
  '/automation/create/campaign': [
    { label: 'Automation - Campaigns', to: '/automation/campaigns' },
    { label: 'New Campaign' },
  ],
  '/staff/new': [{ label: 'Staff', to: '/staff' }, { label: 'Add Staff' }],
  '/courses/new': [{ label: 'University Course Management', to: '/courses' }, { label: 'Add Course' }],
  '/universities/new': [{ label: 'Universities', to: '/universities' }, { label: 'Add University' }],
  '/student-resources/categories': [
    { label: 'Student Resources', to: '/student-resources' },
    { label: 'Categories' },
  ],
  '/announcements/new': [{ label: 'Announcements', to: '/announcements' }, { label: 'Create Announcement' }],
  '/user-management/new': [{ label: 'User Management', to: '/user-management' }, { label: 'Create User' }],
}

// Dynamic (parameterised) routes that a static map can't cover.
function dynamicTrail(pathname: string): Crumb[] | null {
  if (/^\/leads\/\d+$/.test(pathname))
    return [{ label: 'Lead Management', to: '/leads' }, { label: 'View' }]
  if (/^\/leads\/\d+\/edit$/.test(pathname))
    return [{ label: 'Lead Management', to: '/leads' }, { label: 'Edit Profile' }]
  if (/^\/invoices\/student\/\d+\/edit$/.test(pathname))
    return [{ label: 'Student Invoices', to: '/invoices/student' }, { label: 'Edit Invoice' }]
  if (/^\/services\/\d+$/.test(pathname))
    return [
      { label: 'Additional Services', to: '/services' },
      { label: 'Visa & Services Detail' },
    ]
  if (/^\/students\/\d+$/.test(pathname))
    return [{ label: 'Student Management', to: '/students' }, { label: 'View' }]
  if (/^\/automation\/workflow\/\d+$/.test(pathname))
    return [{ label: 'Automation - Workflows', to: '/automation' }, { label: 'Workflow Detail' }]
  if (/^\/automation\/campaign\/\d+$/.test(pathname))
    return [{ label: 'Automation - Campaigns', to: '/automation/campaigns' }, { label: 'Campaign Detail' }]
  if (/^\/staff\/\d+$/.test(pathname))
    return [{ label: 'Staff', to: '/staff' }, { label: 'View' }]
  if (/^\/staff\/\d+\/edit$/.test(pathname))
    return [{ label: 'Staff', to: '/staff' }, { label: 'Edit Staff' }]
  if (/^\/courses\/\d+$/.test(pathname))
    return [{ label: 'University Course Management', to: '/courses' }, { label: 'Course Detail' }]
  if (/^\/courses\/\d+\/edit$/.test(pathname))
    return [{ label: 'University Course Management', to: '/courses' }, { label: 'Edit Course' }]
  if (/^\/universities\/\d+$/.test(pathname))
    return [{ label: 'Universities', to: '/universities' }, { label: 'University Detail' }]
  if (/^\/universities\/\d+\/edit$/.test(pathname))
    return [{ label: 'Universities', to: '/universities' }, { label: 'Edit University' }]
  if (/^\/media-library\/\d+$/.test(pathname))
    return [{ label: 'Media Library', to: '/media-library' }, { label: 'Media Details' }]
  if (/^\/announcements\/\d+$/.test(pathname))
    return [{ label: 'Announcements', to: '/announcements' }, { label: 'View' }]
  if (/^\/announcements\/\d+\/edit$/.test(pathname))
    return [{ label: 'Announcements', to: '/announcements' }, { label: 'Edit Announcement' }]
  if (/^\/user-management\/\d+$/.test(pathname))
    return [{ label: 'User Management', to: '/user-management' }, { label: 'View' }]
  if (/^\/user-management\/\d+\/edit$/.test(pathname))
    return [{ label: 'User Management', to: '/user-management' }, { label: 'Edit User' }]
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
