import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { cn } from '../lib/cn'
import {
  useNotificationFeed,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../lib/api'
import { NotificationItem } from '../features/notifications/NotificationItem'

/** Bell + unread badge in the header, with a dropdown preview of the feed. */
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Read-state now lives on the server and arrives on each item, so the badge
  // matches on every device rather than only the browser that opened it.
  const { data: notifications = [] } = useNotificationFeed()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const preview = notifications.slice(0, 6)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-800">Notifications</p>
              {unread > 0 && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-600">
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[24rem] divide-y divide-slate-100 overflow-y-auto">
            {preview.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">You're all caught up.</p>
              </div>
            ) : (
              preview.map((n) => (
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

          {/* Footer */}
          <a
            href="/notifications"
            className={cn(
              'block border-t border-slate-100 px-4 py-3 text-center text-sm font-semibold text-brand-600 transition-colors hover:bg-slate-50',
            )}
          >
            View all notifications
          </a>
        </div>
      )}
    </div>
  )
}
