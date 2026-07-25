import { UserPlus, GraduationCap, FileText, Megaphone, CalendarClock } from 'lucide-react'
import { cn } from '../../lib/cn'
import { relativeTime, type AppNotification, type NotificationCategory } from '../../mock/notifications'

/** Icon + colour per category — shared by the bell dropdown and the full page. */
export const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; icon: typeof UserPlus; iconBg: string; iconColor: string }
> = {
  lead: { label: 'Lead', icon: UserPlus, iconBg: 'bg-brand-50', iconColor: 'text-brand-600' },
  student: { label: 'Student', icon: GraduationCap, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  application: { label: 'Application', icon: FileText, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  announcement: { label: 'Announcement', icon: Megaphone, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  webinar: { label: 'Webinar', icon: CalendarClock, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
}

/**
 * One notification row. Renders as an anchor so it works in both the dropdown
 * and the page; `onOpen` marks it read before the browser follows the link.
 */
export function NotificationItem({
  n,
  read,
  onOpen,
  compact = false,
}: {
  n: AppNotification
  read: boolean
  onOpen: () => void
  compact?: boolean
}) {
  const meta = CATEGORY_META[n.category]
  const Icon = meta.icon
  return (
    <a
      href={n.link}
      onClick={onOpen}
      className={cn(
        'flex items-start gap-3 transition-colors',
        compact ? 'px-4 py-3' : 'rounded-lg px-4 py-3.5',
        read ? 'hover:bg-slate-50' : 'bg-brand-50/40 hover:bg-brand-50',
      )}
    >
      <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', meta.iconBg)}>
        <Icon className={cn('h-4 w-4', meta.iconColor)} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn('truncate text-sm', read ? 'font-medium text-slate-700' : 'font-bold text-slate-900')}>
            {n.title}
          </p>
          {!read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-label="Unread" />}
        </div>
        <p className="mt-0.5 truncate text-sm text-slate-500">{n.message}</p>
        <p className="mt-1 text-xs text-slate-400">{relativeTime(n.time)}</p>
      </div>
    </a>
  )
}
