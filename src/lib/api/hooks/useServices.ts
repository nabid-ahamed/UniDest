/**
 * Additional services hooks.
 *
 * The list is already scoped to the caller server-side, so the same hook serves
 * the admin, student portal and agent portal screens.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { servicesApi } from '../resources/services'
import { qk } from '../keys'

export function useServiceRequests() {
  return useQuery({
    queryKey: qk.services.list(),
    queryFn: servicesApi.list,
  })
}

export function useServiceRequest(id: number | undefined) {
  return useQuery({
    queryKey: qk.services.detail(id!),
    queryFn: () => servicesApi.get(id!),
    enabled: id !== undefined,
  })
}

export function useServiceStatuses() {
  return useQuery({
    queryKey: qk.services.statuses(),
    queryFn: servicesApi.statuses,
    staleTime: 5 * 60_000,
  })
}

/**
 * Invalidate the whole `services` branch after any write — a status change or a
 * reply alters both the row in the list and the detail thread.
 */
function useInvalidateServices() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.services.all })
}

export function useCreateServiceRequest() {
  const invalidate = useInvalidateServices()
  return useMutation({
    mutationFn: (data: Parameters<typeof servicesApi.create>[0]) => servicesApi.create(data),
    onSuccess: invalidate,
  })
}

export function useUpdateServiceRequest() {
  const invalidate = useInvalidateServices()
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: number } & Parameters<typeof servicesApi.update>[1]) =>
      servicesApi.update(id, patch),
    onSuccess: invalidate,
  })
}

export function useReplyServiceRequest() {
  const invalidate = useInvalidateServices()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: string }) => servicesApi.reply(id, body),
    onSuccess: invalidate,
  })
}

export function useDeleteServiceRequest() {
  const invalidate = useInvalidateServices()
  return useMutation({
    mutationFn: (id: number) => servicesApi.remove(id),
    onSuccess: invalidate,
  })
}
