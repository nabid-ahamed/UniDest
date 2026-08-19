/**
 * Student endpoints. Mock-backed today; see `resources/leads.ts` for why the
 * list is copied before it reaches the cache.
 */
import { mocked } from '../client'
import {
  students,
  getStudent,
  addStudent,
  updateStudent,
  deleteStudent,
  setStudentStatus,
  setStudentAssignee,
  type Student,
} from '../../../mock/students'

export type { Student }

export const studentsApi = {
  /** GET /students */
  list: () => mocked(() => [...students]),

  /** GET /students/:id */
  get: (id: number) => mocked(() => getStudent(id) ?? null),

  /** POST /students */
  create: (...args: Parameters<typeof addStudent>) => mocked(() => addStudent(...args)),

  /** PATCH /students/:id */
  update: (id: number, patch: Partial<Omit<Student, 'id'>>) =>
    mocked(() => void updateStudent(id, patch)),

  /** PATCH /students/:id — status only, kept separate so callers read clearly. */
  setStatus: (id: number, status: string) => mocked(() => void setStudentStatus(id, status)),

  /** PATCH /students/:id — assignee only. */
  setAssignee: (id: number, assignedTo: string | null) =>
    mocked(() => void setStudentAssignee(id, assignedTo)),

  /** DELETE /students/:id */
  remove: (id: number) => mocked(() => void deleteStudent(id)),
}
