/**
 * Student endpoints. See `resources/leads.ts` for why each call branches on
 * USING_REAL_API and why the mock list is copied before it reaches the cache.
 */
import { mocked, request, USING_REAL_API } from '../client'
import {
  students,
  getStudent,
  addStudent,
  updateStudent,
  deleteStudent,
  setStudentStatus,
  setStudentAssignee,
  archiveStudent,
  restoreStudents,
  purgeStudents,
  type Student,
} from '../../../mock/students'

export type { Student }

interface StudentListResponse {
  data: Student[]
  total: number
  page: number
  limit: number
}

export const studentsApi = {
  /** GET /students */
  list: (): Promise<Student[]> =>
    USING_REAL_API
      ? request<StudentListResponse>('/students?limit=200').then((r) => r.data)
      : mocked(() => [...students]),

  /** GET /students/:id */
  get: (id: number): Promise<Student | null> =>
    USING_REAL_API
      ? request<Student>(`/students/${id}`).catch(() => null)
      : mocked(() => getStudent(id) ?? null),

  /** POST /students */
  create: (...args: Parameters<typeof addStudent>): Promise<Student> =>
    USING_REAL_API
      ? request<Student>('/students', { method: 'POST', body: JSON.stringify(args[0]) })
      : mocked(() => addStudent(...args)),

  /** PATCH /students/:id */
  update: (id: number, patch: Partial<Omit<Student, 'id'>>): Promise<void> =>
    USING_REAL_API
      ? request<Student>(`/students/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        }).then(() => undefined)
      : mocked(() => void updateStudent(id, patch)),

  /** PATCH /students/:id — status only, kept separate so callers read clearly. */
  setStatus: (id: number, status: string): Promise<void> =>
    USING_REAL_API
      ? request<Student>(`/students/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }).then(() => undefined)
      : mocked(() => void setStudentStatus(id, status)),

  /** PATCH /students/:id — assignee only. */
  setAssignee: (id: number, assignedTo: string | null): Promise<void> =>
    USING_REAL_API
      ? request<Student>(`/students/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ assignedTo: assignedTo ?? '' }),
        }).then(() => undefined)
      : mocked(() => void setStudentAssignee(id, assignedTo)),

  /** DELETE /students/:id — soft delete (trash). */
  remove: (id: number): Promise<void> =>
    USING_REAL_API
      ? request<{ ok: boolean }>(`/students/${id}`, { method: 'DELETE' }).then(() => undefined)
      : mocked(() => void deleteStudent(id)),

  /**
   * Lifecycle moves. `state` is not a stored column — the API translates it
   * into archivedAt / deletedAt timestamps, so "archived" and "trashed" stay
   * distinguishable and both are reversible.
   */
  setState: (id: number, state: 'active' | 'archived' | 'deleted'): Promise<void> =>
    USING_REAL_API
      ? request<Student>(`/students/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ state }),
        }).then(() => undefined)
      : mocked(() => {
          if (state === 'archived') archiveStudent(id)
          else if (state === 'deleted') deleteStudent(id)
          else restoreStudents([id])
        }),

  /** Permanently remove trashed students — no undo. */
  purge: (ids: number[]): Promise<void> =>
    USING_REAL_API
      ? request<{ ok: boolean }>('/students/purge', {
          method: 'POST',
          body: JSON.stringify({ ids }),
        }).then(() => undefined)
      : mocked(() => void purgeStudents(ids)),

  /**
   * POST /leads/:id/convert — creates the student AND keeps the lead, linking
   * the two. Mock-only path still deletes the lead (the old behaviour) because
   * the mock has no way to express the link.
   */
  convertLead: (leadId: number, data: { course?: string; intake?: string; university?: string }) =>
    request<Student>(`/leads/${leadId}/convert`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
