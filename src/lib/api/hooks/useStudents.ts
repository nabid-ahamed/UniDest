/**
 * Student data hooks. See `useLeads.ts` for the invalidation pattern.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { studentsApi, type Student } from '../resources/students'
import { qk } from '../keys'

/** All students. */
export function useStudents() {
  return useQuery({ queryKey: qk.students.list(), queryFn: studentsApi.list })
}

/** One student by id. Skipped when `id` is undefined. */
export function useStudent(id: number | undefined) {
  return useQuery({
    queryKey: qk.students.detail(id!),
    queryFn: () => studentsApi.get(id!),
    enabled: id !== undefined,
  })
}

function useInvalidateStudents() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.students.all })
}

export function useCreateStudent() {
  const invalidate = useInvalidateStudents()
  return useMutation({
    mutationFn: (...args: Parameters<typeof studentsApi.create>) => studentsApi.create(...args),
    onSuccess: invalidate,
  })
}

export function useUpdateStudent() {
  const invalidate = useInvalidateStudents()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<Omit<Student, 'id'>> }) =>
      studentsApi.update(id, patch),
    onSuccess: invalidate,
  })
}

export function useSetStudentStatus() {
  const invalidate = useInvalidateStudents()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      studentsApi.setStatus(id, status),
    onSuccess: invalidate,
  })
}

export function useDeleteStudent() {
  const invalidate = useInvalidateStudents()
  return useMutation({
    mutationFn: (id: number) => studentsApi.remove(id),
    onSuccess: invalidate,
  })
}
