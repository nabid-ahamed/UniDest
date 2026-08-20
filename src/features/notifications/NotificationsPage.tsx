import { useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  useNotificationFeed,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationCategory,
} from '../../lib/api'
import { NotificationItem } from './NotificationItem'
import { CATEGORY_META } from './categoryMeta'

const TABS = ['All', 'Unread'] as const
type Tab = (typeof TABS)[number]

const CATEGORY_FILTERS: { value: NotificationCategory | ''; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'lead', label: 'Leads' },
  { value: 'student', label: 'Students' },
  { value: 'application', label: 'Applications' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'webinar', label: 'Webinars' },
]

export default function NotificationsPage() {
  const { data: all = [], isPending } = useNotificationFeed(60)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const [tab, setTab] = useState<Tab>('All')
  const [category, setCategory] = useState<NotificationCategory | ''>('')

  // `read` arrives per item from the server, so no local read-set is needed.
  const unreadCount = all.filter((n) => !n.read).length

  const filtered = all.filter((n) => {
    if (tab === 'Unread' && n.read) return false
    if (category && n.category !== category) return false
    return true
  })

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Activity from across your leads, students, applications and more.
          </p>
        </div>
        <button
          type="button"
          onClick={() => markAllRead.mutate()}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CheckCheck className="h-4 w-4" /> Mark all read
        </button>
      </div>

      {/* Controls */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
                tab === t ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              {t}
              {t === 'Unread' && unreadCount > 0 && (
                <span
                  className={cn(
                    'ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-bold',
                    tab === t ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-600',
                  )}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_FILTERS.map((c) => (
            <button
              key={c.value || 'all'}
              onClick={() => setCategory(c.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                category === c.value
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              {c.value ? CATEGORY_META[c.value].label + 's' : c.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
        {filtered.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <Bell className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-600">
              {isPending
                ? 'Loading notifications…'
                : tab === 'Unread'
                  ? 'No unread notifications.'
                  : 'No notifications yet.'}
            </p>
            <p className="mt-1 text-sm text-slate-400">New activity will appear here.</p>
          </div>
        ) : (
          filtered.map((n) => (
            <NotificationItem
              key={n.id}
              n={n}
              read={n.read}
              onOpen={() => markRead.mutate(n.id)}
              compact
            />
          ))
        )}
      </div>
    </div>
  )
}
