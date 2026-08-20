/**
 * Notification feed and announcements.
 *
 * The feed is **derived server-side** from the activity log plus published
 * announcements — there is no notifications table. The activity log already
 * records the events worth telling someone about, so a second table would be a
 * copy of it that eventually disagrees.
 *
 * Read-state is per user and lives on the server, which is why `read` arrives
 * on each item rather than being tracked in a local store: the badge should
 * match on every device, not just the browser that opened it.
 */
import { mocked, request, USING_REAL_API } from '../client'

export type NotificationCategory =
  | 'lead'
  | 'student'
  | 'application'
  | 'announcement'
  | 'ticket'
  | 'webinar'

export interface ApiNotification {
  /** Stable key derived from the source record, e.g. "lead-142-lead.created". */
  id: string
  category: NotificationCategory
  title: string
  message: string
  /** Epoch ms, for sorting. */
  time: number
  /** Route to the source record. */
  link: string
  read: boolean
}

export interface ApiAnnouncement {
  id: number
  publicId: string
  title: string
  message: string
  /** All | Students | Leads | Staff */
  area: string
  createdBy: string
  publishedAt: string
  /** "30 Oct 2025 10:00 AM" */
  publishedAtLabel: string
}

export const notificationsApi = {
  /** GET /notifications */
  list: (limit = 30): Promise<ApiNotification[]> =>
    USING_REAL_API ? request<ApiNotification[]>(`/notifications?limit=${limit}`) : mocked(() => []),

  /** GET /notifications/unread-count */
  unreadCount: (): Promise<number> =>
    USING_REAL_API
      ? request<{ count: number }>('/notifications/unread-count').then((r) => r.count)
      : mocked(() => 0),

  /** POST /notifications/:key/read — idempotent. */
  markRead: (key: string): Promise<void> =>
    request<{ ok: boolean }>(`/notifications/${encodeURIComponent(key)}/read`, {
      method: 'POST',
    }).then(() => undefined),

  /** POST /notifications/read-all */
  markAllRead: (): Promise<void> =>
    request<{ ok: boolean; marked: number }>('/notifications/read-all', { method: 'POST' }).then(
      () => undefined,
    ),
}

export const announcementsApi = {
  /** GET /announcements */
  list: (): Promise<ApiAnnouncement[]> =>
    USING_REAL_API ? request<ApiAnnouncement[]>('/announcements') : mocked(() => []),

  /** GET /announcements/:id */
  get: (id: number): Promise<ApiAnnouncement | null> =>
    USING_REAL_API
      ? request<ApiAnnouncement>(`/announcements/${id}`).catch(() => null)
      : mocked(() => null),

  /** POST /announcements */
  create: (data: {
    title: string
    message: string
    area?: string
    publishedAt?: string
  }): Promise<ApiAnnouncement> =>
    request<ApiAnnouncement>('/announcements', { method: 'POST', body: JSON.stringify(data) }),

  /** PATCH /announcements/:id */
  update: (
    id: number,
    patch: { title?: string; message?: string; area?: string; publishedAt?: string },
  ): Promise<ApiAnnouncement> =>
    request<ApiAnnouncement>(`/announcements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  /** DELETE /announcements/:id */
  remove: (id: number): Promise<void> =>
    request<{ ok: boolean }>(`/announcements/${id}`, { method: 'DELETE' }).then(() => undefined),
}

/** "3h ago" / "2d ago" — the relative label the feed renders. */
export function relativeTime(epochMs: number): string {
  const diff = Date.now() - epochMs
  if (!Number.isFinite(diff)) return ''
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return months < 12 ? `${months}mo ago` : `${Math.floor(months / 12)}y ago`
}
