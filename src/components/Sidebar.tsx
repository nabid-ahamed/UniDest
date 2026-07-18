import { useState, type ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  Users,
  Contact,
  ClipboardList,
  Layers,
  Search,
  Radio,
  CalendarDays,
  FileText,
  Share2,
  LineChart,
  Zap,
  UsersRound,
  User,
  Plane,
  UploadCloud,
  Image,
  Cloud,
  AppWindow,
  Megaphone,
  Mail,
  UserCog,
  Import,
  Database,
  ShieldCheck,
  Settings,
  ChevronDown,
  GraduationCap,
  X,
} from 'lucide-react'
import { cn } from '../lib/cn'
import { useUI } from '../store/ui'

type IconType = ComponentType<{ className?: string }>

interface NavChild {
  label: string
  to?: string
}
interface NavItem {
  label: string
  icon: IconType
  to?: string
  children?: NavChild[]
}
interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    title: 'General',
    items: [
      { label: 'Dashboard', icon: LayoutGrid, to: '/dashboard' },
      { label: 'Leads', icon: Users, to: '/leads' },
      { label: 'Students', icon: Contact, to: '/students' },
      { label: 'Applications', icon: ClipboardList, to: '/applications' },
      { label: 'Additional Services', icon: Layers },
      { label: 'Course Finder', icon: Search },
      { label: 'Broadcast', icon: Radio },
      { label: 'Webinar & Events', icon: CalendarDays },
      {
        label: 'Invoices',
        icon: FileText,
        children: [{ label: 'All Invoices' }, { label: 'Create Invoice' }],
      },
      {
        label: 'Referral',
        icon: Share2,
        children: [{ label: 'Overview' }, { label: 'Payouts' }],
      },
      { label: 'Analytics', icon: LineChart },
      { label: 'Automation', icon: Zap },
      {
        label: 'Agents',
        icon: UsersRound,
        children: [{ label: 'All Agents' }, { label: 'Add Agent' }],
      },
      {
        label: 'Staff',
        icon: User,
        children: [{ label: 'All Staff' }, { label: 'Add Staff' }],
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'Course Management',
        icon: Plane,
        children: [
          { label: 'Countries' },
          { label: 'Universities' },
          { label: 'Courses' },
        ],
      },
      { label: 'Student Resources', icon: UploadCloud },
      { label: 'Media Library', icon: Image },
      { label: 'Agent Resources', icon: Cloud },
      {
        label: 'CMS',
        icon: AppWindow,
        children: [{ label: 'Pages' }, { label: 'Menus' }],
      },
      { label: 'Announcements', icon: Megaphone },
      {
        label: 'Message Templates',
        icon: Mail,
        children: [{ label: 'Email' }, { label: 'SMS' }, { label: 'WhatsApp' }],
      },
      { label: 'User Management', icon: UserCog },
      { label: 'Import', icon: Import },
      { label: 'Backups', icon: Database },
      { label: 'Roles', icon: ShieldCheck },
      { label: 'Settings', icon: Settings },
    ],
  },
]

const itemBase =
  'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors'
const itemIdle = 'text-slate-300 hover:bg-slate-800 hover:text-white'
const itemActive = 'bg-brand-600 text-white'

function SidebarItem({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const [open, setOpen] = useState(false)
  const Icon = item.icon

  // Expandable item (has children)
  if (item.children) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(itemBase, itemIdle)}
        >
          <Icon className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-200" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown
            className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')}
          />
        </button>
        {open && (
          <div className="mt-1 space-y-1 pl-11">
            {item.children.map((child) =>
              child.to ? (
                <NavLink
                  key={child.label}
                  to={child.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-md px-3 py-2 text-sm',
                      isActive ? 'text-white' : 'text-slate-400 hover:text-white',
                    )
                  }
                >
                  {child.label}
                </NavLink>
              ) : (
                <button
                  key={child.label}
                  type="button"
                  className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-400 hover:text-white"
                >
                  {child.label}
                </button>
              ),
            )}
          </div>
        )}
      </div>
    )
  }

  // Real routed item
  if (item.to) {
    return (
      <NavLink
        to={item.to}
        onClick={onNavigate}
        className={({ isActive }) => cn(itemBase, isActive ? itemActive : itemIdle)}
      >
        <Icon className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-200" />
        <span>{item.label}</span>
      </NavLink>
    )
  }

  // Placeholder item (not wired yet)
  return (
    <button type="button" className={cn(itemBase, itemIdle)}>
      <Icon className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-200" />
      <span>{item.label}</span>
    </button>
  )
}

export function Sidebar() {
  const open = useUI((s) => s.sidebarOpen)
  const close = useUI((s) => s.closeSidebar)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/50 transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* Drawer */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-slate-900 shadow-xl transition-transform',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo bar */}
        <div className="flex h-16 shrink-0 items-center justify-between bg-white px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-brand-700">
              UniDest
            </span>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {NAV.map((group) => (
            <div key={group.title} className="mb-4">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <SidebarItem key={item.label} item={item} onNavigate={close} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
