import { useRef, useState, type ComponentType, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
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
      { label: 'Additional Services', icon: Layers, to: '/services' },
      { label: 'Course Finder', icon: Search, to: '/course-finder' },
      { label: 'Broadcast', icon: Radio, to: '/broadcast' },
      { label: 'Webinar & Events', icon: CalendarDays, to: '/webinars' },
      {
        label: 'Invoices',
        icon: FileText,
        children: [
          { label: 'University Invoices', to: '/invoices/university' },
          { label: 'Student Invoices', to: '/invoices/student' },
        ],
      },
      {
        label: 'Referral',
        icon: Share2,
        children: [
          { label: 'Referral Signups', to: '/referral/signups' },
          { label: 'Referral Payout', to: '/referral/payout' },
        ],
      },
      { label: 'Analytics', icon: LineChart, to: '/analytics' },
      { label: 'Automation', icon: Zap, to: '/automation' },
      { label: 'Staff', icon: User, to: '/staff' },
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

// No `truncate`/`whitespace-nowrap`: long labels wrap onto a second line so
// every menu item stays fully readable (WCAG: prefer wrapping over truncation).
const itemBase =
  'group flex w-full items-center gap-2.5 rounded-lg py-2.5 text-[13px] font-medium leading-snug transition-colors'
const itemIdle = 'text-slate-300 hover:bg-slate-800 hover:text-white'
const itemActive = 'bg-brand-600 text-white'
// No colour of its own — inherits the row's text colour so the icon always
// matches the label (idle, hover and active all stay one uniform shade).
const iconClass = 'h-5 w-5 shrink-0'

function SidebarItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  onNavigate: () => void
}) {
  // True when the current page is one of this item's children.
  const childActive = item.children?.some((c) => c.to && c.to === window.location.pathname) ?? false
  // Start open on a child page so the submenu stays expanded across the
  // full-page navigations between children.
  const [expanded, setExpanded] = useState(() => childActive)
  const [tip, setTip] = useState<{ top: number; center: number; left: number } | null>(null)
  // Deferred hide so the mouse can travel from the icon into the flyout submenu
  // without it vanishing in the gap.
  const hideTimer = useRef<number | undefined>(undefined)
  const Icon = item.icon
  // Always left-align with px-3 so collapsed icons sit under the header logo icon.
  const rowClass = cn(itemBase, 'px-3')
  // In the collapsed rail, drop the hover background so no light box appears
  // behind a single icon on hover — only the text colour brightens.
  const idle = collapsed ? 'text-slate-300 hover:text-white' : itemIdle

  const showTip = (e: MouseEvent<HTMLElement>) => {
    if (!collapsed) return
    window.clearTimeout(hideTimer.current)
    const r = e.currentTarget.getBoundingClientRect()
    // The row is pinned to the full open width, so r.right sits ~240px out.
    // Anchor the flyout to the *visible* rail edge (the clipped <aside>) so it
    // butts right up against the icon instead of floating far to the right.
    const rail = e.currentTarget.closest('aside')?.getBoundingClientRect().right ?? r.right
    setTip({ top: r.top, center: r.top + r.height / 2, left: rail })
  }
  const hideTip = () => {
    hideTimer.current = window.setTimeout(() => setTip(null), 120)
  }
  const keepTip = () => window.clearTimeout(hideTimer.current)
  const hoverProps = { onMouseEnter: showTip, onMouseLeave: hideTip }

  const tooltip = !(collapsed && tip)
    ? null
    : createPortal(
        item.children ? (
          // Flyout submenu: parent label as a header + the child links.
          <div
            style={{ top: tip.top, left: tip.left }}
            onMouseEnter={keepTip}
            onMouseLeave={hideTip}
            className="fixed z-[70] min-w-52 overflow-hidden rounded-r-lg bg-slate-900 py-2 shadow-xl"
          >
            <p className="px-4 pb-1.5 pt-1 text-sm font-semibold text-slate-400">{item.label}</p>
            <div className="space-y-0.5 px-2">
              {item.children.map((child) =>
                child.to ? (
                  <a
                    key={child.label}
                    href={child.to}
                    onClick={onNavigate}
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full border-[1.5px] border-current opacity-70" />
                    {child.label}
                  </a>
                ) : (
                  <button
                    key={child.label}
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full border-[1.5px] border-current opacity-70" />
                    {child.label}
                  </button>
                ),
              )}
            </div>
          </div>
        ) : (
          // Plain label tooltip for leaf items.
          <div
            style={{ top: tip.center, left: tip.left }}
            className="pointer-events-none fixed z-[70] -translate-y-1/2 whitespace-nowrap rounded-r-lg bg-slate-900 py-2.5 pl-6 pr-5 text-sm font-medium text-white shadow-lg"
          >
            {item.label}
          </div>
        ),
        document.body,
      )

  // Expandable item (has children)
  if (item.children) {
    return (
      <div>
        <button
          type="button"
          onClick={() => !collapsed && setExpanded((v) => !v)}
          // In the collapsed rail there's no inline submenu, so light up the
          // parent icon itself when you're on one of its child pages.
          className={cn(rowClass, collapsed && childActive ? itemActive : idle)}
          {...hoverProps}
        >
          <Icon className={iconClass} />
          {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
          {!collapsed && (
            <ChevronDown
              className={cn(
                'h-5 w-5 shrink-0 transition-transform duration-300 ease-in-out',
                expanded && 'rotate-180',
              )}
            />
          )}
        </button>
        {!collapsed && (
          <div
            className={cn(
              'grid transition-all duration-300 ease-in-out',
              expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
            )}
          >
            <div className="overflow-hidden">
              <div className="mt-1 space-y-1 pl-5">
            {item.children.map((child) =>
              child.to ? (
                <a
                  key={child.label}
                  href={child.to}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors',
                    window.location.pathname === child.to
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                  )}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full border-[1.5px] border-current opacity-70" />
                  {child.label}
                </a>
              ) : (
                <button
                  key={child.label}
                  type="button"
                  className="flex w-full items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full border-[1.5px] border-current opacity-70" />
                  {child.label}
                </button>
              ),
            )}
              </div>
            </div>
          </div>
        )}
        {tooltip}
      </div>
    )
  }

  // Real routed item — full page redirect/refresh on click.
  if (item.to) {
    const active = window.location.pathname === item.to
    return (
      <>
        <a
          href={item.to}
          onClick={onNavigate}
          {...hoverProps}
          className={cn(rowClass, active ? itemActive : idle)}
        >
          <Icon className={iconClass} />
          {!collapsed && <span>{item.label}</span>}
        </a>
        {tooltip}
      </>
    )
  }

  // Placeholder item (not wired yet)
  return (
    <>
      <button type="button" className={cn(rowClass, idle)} {...hoverProps}>
        <Icon className={iconClass} />
        {!collapsed && <span>{item.label}</span>}
      </button>
      {tooltip}
    </>
  )
}

export function Sidebar() {
  const open = useUI((s) => s.sidebarOpen)
  const close = useUI((s) => s.closeSidebar)
  const collapsed = !open

  // Close on navigation only on small screens; keep it open on desktop.
  const handleNavigate = () => {
    if (window.innerWidth < 1024) close()
  }

  return (
    <>
      {/* Backdrop — mobile only */}
      <div
        onClick={close}
        className={cn(
          'fixed inset-x-0 bottom-0 top-16 z-20 bg-slate-900/50 transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* Sidebar: overlay drawer on mobile, collapsible rail on desktop */}
      <aside
        // When open, width comes from --sidebar-w (the hamburger's right edge,
        // measured in Header) so the panel lines up exactly under the icon.
        style={open ? { width: 'var(--sidebar-w, 15rem)' } : undefined}
        className={cn(
          'fixed left-0 top-16 z-30 flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-slate-900 shadow-xl transition-all duration-300',
          open ? 'translate-x-0' : '-translate-x-full', // mobile slide in/out
          'lg:translate-x-0', // desktop always visible
          !open && 'w-60 lg:w-[68px]', // collapsed rail reaches up to the "U" of UniDest
        )}
      >
        <nav
          // Pinned to the open width in BOTH states. If it tracked the panel's
          // animating width instead, every label would re-wrap each frame while
          // the sidebar slides open — that reflow is what looked like a stutter.
          style={{ width: 'var(--sidebar-w, 15rem)' }}
          className={cn(
            'flex-1 shrink-0 overflow-x-hidden overflow-y-auto px-3 pb-4 pt-6',
            collapsed ? 'no-scrollbar' : 'sidebar-scroll',
          )}
        >
          {NAV.map((group) => (
            <div key={group.title} className="mb-4">
              {!collapsed && (
                <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-wider text-white">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <SidebarItem
                    key={item.label}
                    item={item}
                    collapsed={collapsed}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
