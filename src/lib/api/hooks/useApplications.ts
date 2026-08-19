/**
 * Application data hooks. See `useLeads.ts` for the invalidation pattern.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { applicationsApi, type Application } from '../resources/applications'
import { qk } from '../keys'

/** All applications. */
export function useApplications() {
  return useQuery({ queryKey: qk.applications.list(), queryFn: applicationsApi.list })
}

/** One application by id. Skipped when `id` is undefined. */
export function useApplication(id: number | undefined) {
  return useQuery({
    queryKey: qk.applications.detail(id!),
    queryFn: () => applicationsApi.get(id!),
    enabled: id !== undefined,
  })
}

function useInvalidateApplications() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.applications.all })
}

export function useUpdateApplication() {
  const invalidate = useInvalidateApplications()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<Omit<Application, 'id'>> }) =>
      applicationsApi.update(id, patch),
    onSuccess: invalidate,
  })
}

export function useSetApplicationStatus() {
  const invalidate = useInvalidateApplications()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      applicationsApi.setStatus(id, status),
    onSuccess: invalidate,
  })
}

export function useDeleteApplication() {
  const invalidate = useInvalidateApplications()
  return useMutation({
    mutationFn: (id: number) => applicationsApi.remove(id),
    onSuccess: invalidate,
  })
}
