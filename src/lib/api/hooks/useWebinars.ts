/**
 * Webinar hooks.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { webinarsApi } from '../resources/webinars'
import { qk } from '../keys'

export function useWebinars() {
  return useQuery({ queryKey: qk.webinars.list(), queryFn: webinarsApi.list })
}

export function useWebinar(id: number | undefined) {
  return useQuery({
    queryKey: qk.webinars.detail(id!),
    queryFn: () => webinarsApi.get(id!),
    enabled: id !== undefined,
  })
}

export function useWebinarEnrollments(id: number | undefined) {
  return useQuery({
    queryKey: qk.webinars.enrollments(id!),
    queryFn: () => webinarsApi.enrollments(id!),
    enabled: id !== undefined,
  })
}

/**
 * Invalidate the whole branch after a write: an enrolment changes the detail
 * page's roster *and* the enrolled count shown in the list.
 */
function useInvalidateWebinars() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.webinars.all })
}

export function useCreateWebinar() {
  const invalidate = useInvalidateWebinars()
  return useMutation({
    mutationFn: (data: Parameters<typeof webinarsApi.create>[0]) => webinarsApi.create(data),
    onSuccess: invalidate,
  })
}

export function useUpdateWebinar() {
  const invalidate = useInvalidateWebinars()
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: number } & Parameters<typeof webinarsApi.update>[1]) =>
      webinarsApi.update(id, patch),
    onSuccess: invalidate,
  })
}

export function useEnrollInWebinar() {
  const invalidate = useInvalidateWebinars()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Parameters<typeof webinarsApi.enroll>[1]) =>
      webinarsApi.enroll(id, data),
    onSuccess: invalidate,
  })
}

export function useDeleteWebinar() {
  const invalidate = useInvalidateWebinars()
  return useMutation({
    mutationFn: (id: number) => webinarsApi.remove(id),
    onSuccess: invalidate,
  })
}
