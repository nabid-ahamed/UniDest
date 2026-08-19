/**
 * Application endpoints. Mock-backed today; see `resources/leads.ts` for why the
 * list is copied before it reaches the cache.
 */
import { mocked } from '../client'
import {
  applications,
  getApplication,
  updateApplication,
  setApplicationStatus,
  setApplicationAssignee,
  deleteApplication,
  type Application,
} from '../../../mock/applications'

export type { Application }

export const applicationsApi = {
  /** GET /applications */
  list: () => mocked(() => [...applications]),

  /** GET /applications/:id */
  get: (id: number) => mocked(() => getApplication(id) ?? null),

  /** PATCH /applications/:id */
  update: (id: number, patch: Partial<Omit<Application, 'id'>>) =>
    mocked(() => void updateApplication(id, patch)),

  /** PATCH /applications/:id — status only. */
  setStatus: (id: number, status: string) => mocked(() => void setApplicationStatus(id, status)),

  /** PATCH /applications/:id — assignee only. */
  setAssignee: (id: number, assignedTo: string | null) =>
    mocked(() => void setApplicationAssignee(id, assignedTo)),

  /** DELETE /applications/:id */
  remove: (id: number) => mocked(() => void deleteApplication(id)),
}
