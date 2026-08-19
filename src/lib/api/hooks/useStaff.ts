/**
 * Staff, roles and branches hooks.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { staffApi } from '../resources/staff'
import { qk } from '../keys'

export function useStaff() {
  return useQuery({ queryKey: qk.staff.list(), queryFn: staffApi.list })
}

export function useStaffMember(id: number | undefined) {
  return useQuery({
    queryKey: qk.staff.detail(id!),
    queryFn: () => staffApi.get(id!),
    enabled: id !== undefined,
  })
}

/**
 * Active staff for "Assign to" pickers. Long staleTime because the list barely
 * changes and appears on nearly every screen.
 */
export function useAssignableStaff() {
  return useQuery({
    queryKey: qk.staff.assignable(),
    queryFn: staffApi.assignable,
    staleTime: 5 * 60_000,
  })
}

export function useRoles() {
  return useQuery({ queryKey: qk.staff.roles(), queryFn: staffApi.roles, staleTime: 5 * 60_000 })
}

export function useBranches() {
  return useQuery({ queryKey: qk.staff.branches(), queryFn: staffApi.branches, staleTime: 5 * 60_000 })
}

/**
 * Staff writes invalidate leads, students and applications too: those lists
 * display the assignee's name, so renaming or disabling someone changes what
 * they should show.
 */
function useInvalidateStaff() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: qk.staff.all })
    qc.invalidateQueries({ queryKey: qk.leads.all })
    qc.invalidateQueries({ queryKey: qk.students.all })
    qc.invalidateQueries({ queryKey: qk.applications.all })
  }
}

export function useCreateStaff() {
  const invalidate = useInvalidateStaff()
  return useMutation({
    mutationFn: (data: Parameters<typeof staffApi.create>[0]) => staffApi.create(data),
    onSuccess: invalidate,
  })
}

export function useUpdateStaff() {
  const invalidate = useInvalidateStaff()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Parameters<typeof staffApi.update>[1] }) =>
      staffApi.update(id, patch),
    onSuccess: invalidate,
  })
}

export function useDeleteStaff() {
  const invalidate = useInvalidateStaff()
  return useMutation({
    mutationFn: (id: number) => staffApi.remove(id),
    onSuccess: invalidate,
  })
}
