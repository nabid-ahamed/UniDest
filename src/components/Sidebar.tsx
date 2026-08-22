import { useEffect, useRef, useState, type ComponentType, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import {
  Layers,
  LayoutGrid,
  Users,
  Contact,
  ClipboardList,
  LifeBuoy,
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
  AppWindow,
  Megaphone,
  Mail,
  UserCog,
  Import,
  Database,
  ShieldCheck,
  Settings,
  ChevronDown,
  Handshake,
} from 'lucide-react'
import { cn } from '../lib/cn'
import { useUI } from '../store/ui'
import { useAuth } from '../store/auth'

/** Top-level nav items hidden from Staff users (kept for Admin). */
const STAFF_HIDDEN_ITEMS = new Set(['Referral', 'Agents', 'Staff', 'Backups', 'Roles', 'Settings'])
/** Submenu children hidden from Staff (e.g. CMS keeps only Blog Posts / Pages / Newsletter). */
const STAFF_HIDDEN_CHILDREN = new Set(['Home Page', 'Countries', 'Menu Manager'])

type IconType = ComponentType<{ className?: string }>

// A nav target is active on its own page AND on any nested route beneath it —
// e.g. "/courses" stays active on "/courses/34" or "/courses/34/edit". `path`
// is the reactive pathname from the router, so the highlight follows both full
// page loads AND client-side navigations (e.g. the breadcrumb's <Link>).
function pathIsActive(path: string, to: string): boolean {
  return path === to || path.startsWith(to + '/')
}

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
      { label: 'Support Tickets', icon: LifeBuoy, to: '/support-tickets' },
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
      {
        label: 'Agents',
        icon: Handshake,
        children: [
          { label: 'All Agents', to: '/agents' },
          { label: 'Referrals', to: '/agents/referrals' },
          { label: 'Agent Invoices', to: '/agents/invoices' },
        ],
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
          { label: 'Courses', to: '/courses' },
          { label: 'Course Categories', to: '/course-categories' },
          { label: 'Universities', to: '/universities' },
        ],
      },
      { label: 'Student Resources', icon: UploadCloud, to: '/student-resources' },
      { label: 'Media Library', icon: Image, to: '/media-library' },
      {
        label: 'CMS',
        icon: AppWindow,
        children: [
          { label: 'Home Page', to: '/cms/home-page' },
          { label: 'Countries', to: '/cms/countries' },
          { label: 'Blog Posts', to: '/cms/blog' },
          { label: 'Pages', to: '/cms/pages' },
          { label: 'Menu Manager', to: '/cms/menu' },
          { label: 'Newsletter', to: '/cms/newsletter' },
        ],
      },
      { label: 'Announcements', icon: Megaphone, to: '/announcements' },
      {
        label: 'Message Templates',
        icon: Mail,
        children: [
          { label: 'Email Templates', to: '/message-templates/email' },
          { label: 'SMS Templates', to: '/message-templates/sms' },
          { label: 'Whatsapp Templates', to: '/message-templates/whatsapp' },
          { label: 'Canned Responses', to: '/message-templates/canned' },
        ],
      },
      { label: 'User Management', icon: UserCog, to: '/user-management' },
      { label: 'Import', icon: Import, to: '/import' },
      { label: 'Backups', icon: Database, to: '/backups' },
      { label: 'Roles', icon: ShieldCheck, to: '/roles' },
      { label: 'Settings', icon: Settings, to: '/settings' },
    ],
  },
]

// Labels stay on a single line (`whitespace-nowrap` on each label span); the
// nav is `overflow-x-hidden` so the rare over-long label is clipped rather than
// wrapping to a second row.
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
  pathname,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  pathname: string
  onNavigate: () => void
}) {
  // True when the current page is one of this item's children (or a sub-route of
  // one, e.g. a course detail page under the "Courses" child).
  const childActive = item.children?.some((c) => c.to && pathIsActive(pathname, c.to)) ?? false
  const leafActive = item.to ? pathIsActive(pathname, item.to) : false
  // Start open on a child page so the submenu stays expanded across the
  // full-page navigations between children.
  const [expanded, setExpanded] = useState(() => childActive)
  // On each full-page load, bring the active row into view so a menu deep in
  // the list (e.g. Course Management in the System group) isn't left off-screen.
  const scrollRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (leafActive || childActive) scrollRef.current?.scrollIntoView({ block: 'center' })
    // Run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
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
      <div className="w-full" ref={(el) => { scrollRef.current = el }}>
        <button
          type="button"
          onClick={() => !collapsed && setExpanded((v) => !v)}
          // In the collapsed rail there's no inline submenu, so light up the
          // parent icon itself when you're on one of its child pages.
          className={cn(rowClass, collapsed && childActive ? itemActive : idle)}
          {...hoverProps}
        >
          <Icon className={iconClass} />
          {/* Single-line label at its natural width; `ml-auto` on the chevron
              eats the leftover space so every arrow parks at the far-right edge
              in one column, giving each label the full row before it. */}
          {!collapsed && (
            <span className="whitespace-nowrap text-left">{item.label}</span>
          )}
          {!collapsed && (
            <ChevronDown
              className={cn(
                'ml-auto h-5 w-5 shrink-0 transition-transform duration-300 ease-in-out',
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
                    child.to && pathIsActive(pathname, child.to)
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
    return (
      <>
        <a
          ref={(el) => { scrollRef.current = el }}
          href={item.to}
          onClick={onNavigate}
          {...hoverProps}
          className={cn(rowClass, leafActive ? itemActive : idle)}
        >
          <Icon className={iconClass} />
          {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
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
        {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
      </button>
      {tooltip}
    </>
  )
}

export function Sidebar() {
  const open = useUI((s) => s.sidebarOpen)
  const close = useUI((s) => s.closeSidebar)
  const collapsed = !open
  // Reactive pathname so the active highlight follows client-side navigations
  // (e.g. clicking "Dashboard" in the breadcrumb), not just full page loads.
  const { pathname } = useLocation()

  // Staff see a trimmed nav — hide whole items and specific submenu children that
  // aren't part of their workspace.
  const isStaff = useAuth((s) => s.user?.role === 'Staff')
  const groups = isStaff
    ? NAV.map((g) => ({
        ...g,
        items: g.items
          .filter((i) => !STAFF_HIDDEN_ITEMS.has(i.label))
          .map((i) =>
            i.children
              ? { ...i, children: i.children.filter((c) => !STAFF_HIDDEN_CHILDREN.has(c.label)) }
              : i,
          ),
      })).filter((g) => g.items.length > 0)
    : NAV

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
          {groups.map((group) => (
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
                    pathname={pathname}
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
