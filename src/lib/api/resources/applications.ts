/**
 * Application endpoints. See `resources/leads.ts` for why each call branches on
 * USING_REAL_API and why the mock list is copied before it reaches the cache.
 */
import { mocked, request, USING_REAL_API } from '../client'
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

interface ApplicationListResponse {
  data: Application[]
  total: number
  page: number
  limit: number
}

/** One entry in the status timeline. */
export interface StatusHistoryEntry {
  id: number
  from: string | null
  to: string
  toColor: string
  note: string
  changedBy: string
  changedAt: string
}

export const applicationsApi = {
  /** GET /applications */
  list: (): Promise<Application[]> =>
    USING_REAL_API
      ? request<ApplicationListResponse>('/applications?limit=200').then((r) => r.data)
      : mocked(() => [...applications]),

  /** GET /applications/:id */
  get: (id: number): Promise<Application | null> =>
    USING_REAL_API
      ? request<Application>(`/applications/${id}`).catch(() => null)
      : mocked(() => getApplication(id) ?? null),

  /**
   * GET /applications/:id/history — the status timeline, newest first.
   * No mock equivalent: history only exists once the API records it.
   */
  history: (id: number): Promise<StatusHistoryEntry[]> =>
    USING_REAL_API ? request<StatusHistoryEntry[]>(`/applications/${id}/history`) : mocked(() => []),

  /**
   * POST /applications — genuinely new. The mock had no id generator, so
   * applications could only be read, never created.
   */
  create: (data: {
    studentNo: string
    course?: string
    intake?: string
    status?: string
    branch?: string
    assignedTo?: string
    appliedThrough?: string
    agent?: string
  }): Promise<Application> =>
    request<Application>('/applications', { method: 'POST', body: JSON.stringify(data) }),

  /** PATCH /applications/:id */
  update: (id: number, patch: Partial<Omit<Application, 'id'>> & { note?: string }): Promise<void> =>
    USING_REAL_API
      ? request<Application>(`/applications/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        }).then(() => undefined)
      : mocked(() => void updateApplication(id, patch)),

  /** PATCH /applications/:id — status only. Writes a timeline entry server-side. */
  setStatus: (id: number, status: string, note?: string): Promise<void> =>
    USING_REAL_API
      ? request<Application>(`/applications/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status, note }),
        }).then(() => undefined)
      : mocked(() => void setApplicationStatus(id, status)),

  /** PATCH /applications/:id — assignee only. */
  setAssignee: (id: number, assignedTo: string | null): Promise<void> =>
    USING_REAL_API
      ? request<Application>(`/applications/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ assignedTo: assignedTo ?? '' }),
        }).then(() => undefined)
      : mocked(() => void setApplicationAssignee(id, assignedTo)),

  /** DELETE /applications/:id — soft delete. */
  remove: (id: number): Promise<void> =>
    USING_REAL_API
      ? request<{ ok: boolean }>(`/applications/${id}`, { method: 'DELETE' }).then(() => undefined)
      : mocked(() => void deleteApplication(id)),
}
