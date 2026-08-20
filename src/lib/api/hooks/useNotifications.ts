/**
 * Notification and announcement hooks.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { announcementsApi, notificationsApi } from '../resources/notifications'
import { qk } from '../keys'

/**
 * The signed-in user's feed.
 *
 * Refetched on window focus (React Query's default) so returning to the tab
 * shows anything that arrived while it was in the background — which is the
 * whole point of a bell.
 */
export function useNotificationFeed(limit = 30) {
  return useQuery({
    queryKey: qk.notifications.feed(limit),
    queryFn: () => notificationsApi.list(limit),
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: qk.notifications.unread(),
    queryFn: notificationsApi.unreadCount,
  })
}

function useInvalidateNotifications() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.notifications.all })
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications()
  return useMutation({
    mutationFn: (key: string) => notificationsApi.markRead(key),
    onSuccess: invalidate,
  })
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: invalidate,
  })
}

// ---- Announcements ---------------------------------------------------------

export function useAnnouncements() {
  return useQuery({ queryKey: qk.announcements.list(), queryFn: announcementsApi.list })
}

export function useAnnouncement(id: number | undefined) {
  return useQuery({
    queryKey: qk.announcements.detail(id!),
    queryFn: () => announcementsApi.get(id!),
    enabled: id !== undefined,
  })
}

function useInvalidateAnnouncements() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: qk.announcements.all })
    // A new announcement is also a notification.
    qc.invalidateQueries({ queryKey: qk.notifications.all })
  }
}

export function useCreateAnnouncement() {
  const invalidate = useInvalidateAnnouncements()
  return useMutation({
    mutationFn: (data: Parameters<typeof announcementsApi.create>[0]) =>
      announcementsApi.create(data),
    onSuccess: invalidate,
  })
}

export function useUpdateAnnouncement() {
  const invalidate = useInvalidateAnnouncements()
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: number } & Parameters<typeof announcementsApi.update>[1]) =>
      announcementsApi.update(id, patch),
    onSuccess: invalidate,
  })
}

export function useDeleteAnnouncement() {
  const invalidate = useInvalidateAnnouncements()
  return useMutation({
    mutationFn: (id: number) => announcementsApi.remove(id),
    onSuccess: invalidate,
  })
}
