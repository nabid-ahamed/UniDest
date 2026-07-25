import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NotificationsState {
  /** Ids the user has already read. Everything else is unread. */
  readIds: string[]
  markRead: (id: string) => void
  markAllRead: (ids: string[]) => void
  isRead: (id: string) => boolean
}

// Read-state persists so the unread badge survives reloads. The feed itself is
// rebuilt from the live modules (see mock/notifications.ts) — new records there
// are automatically unread until opened.
export const useNotifications = create<NotificationsState>()(
  persist(
    (set, get) => ({
      readIds: [],
      markRead: (id) =>
        set((s) => (s.readIds.includes(id) ? s : { readIds: [...s.readIds, id] })),
      markAllRead: (ids) =>
        set((s) => ({ readIds: [...new Set([...s.readIds, ...ids])] })),
      isRead: (id) => get().readIds.includes(id),
    }),
    { name: 'unidest-notifications' },
  ),
)
