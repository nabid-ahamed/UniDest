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

/**
 * Status timeline for one application. Separate from the detail query because
 * it only appears on the detail page and would otherwise be fetched with every
 * list row.
 */
export function useApplicationHistory(id: number | undefined) {
  return useQuery({
    queryKey: [...qk.applications.detail(id!), 'history'],
    queryFn: () => applicationsApi.history(id!),
    enabled: id !== undefined,
  })
}

export function useCreateApplication() {
  const invalidate = useInvalidateApplications()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof applicationsApi.create>[0]) =>
      applicationsApi.create(data),
    onSuccess: () => {
      invalidate()
      // A new application changes the student's application count.
      qc.invalidateQueries({ queryKey: qk.students.all })
    },
  })
}

export function useSetApplicationAssignee() {
  const invalidate = useInvalidateApplications()
  return useMutation({
    mutationFn: ({ id, assignedTo }: { id: number; assignedTo: string | null }) =>
      applicationsApi.setAssignee(id, assignedTo),
    onSuccess: invalidate,
  })
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
    mutationFn: ({ id, status, note }: { id: number; status: string; note?: string }) =>
      applicationsApi.setStatus(id, status, note),
    // Also refresh the timeline: the server writes a history row on every
    // status change, so a stale cache would hide the entry just created.
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
