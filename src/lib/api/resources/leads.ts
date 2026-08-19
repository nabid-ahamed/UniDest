/**
 * Lead endpoints.
 *
 * Each call branches on USING_REAL_API so the mock path stays available as a
 * kill switch: if the backend is down or a bug appears mid-migration, flip the
 * flag in `client.ts` and the app runs on mock data again in seconds. The
 * branch comes out in Stage 9 once every lead screen is on the API.
 *
 * The mock `[...leads]` copies are deliberate: the mock module exports a
 * mutable array, and handing that reference to React Query would let a later
 * in-place mutation change cached data behind the cache's back.
 */
import { mocked, request, USING_REAL_API } from '../client'
import { leads, addLead, updateLead, deleteLead, type Lead } from '../../../mock/leads'

export type { Lead }

/** Shape of GET /leads — the API paginates, the mock does not. */
interface LeadListResponse {
  data: Lead[]
  total: number
  page: number
  limit: number
}

export const leadsApi = {
  /** GET /leads */
  list: (): Promise<Lead[]> =>
    USING_REAL_API
      ? request<LeadListResponse>('/leads?limit=200').then((r) => r.data)
      : mocked(() => [...leads]),

  /** GET /leads/:id */
  get: (id: number): Promise<Lead | null> =>
    USING_REAL_API
      ? request<Lead>(`/leads/${id}`).catch(() => null)
      : mocked(() => leads.find((l) => l.id === id) ?? null),

  /** POST /leads */
  create: (data: Omit<Lead, 'id'>): Promise<Lead> =>
    USING_REAL_API
      ? request<Lead>('/leads', { method: 'POST', body: JSON.stringify(data) })
      : mocked(() => addLead(data)),

  /** PATCH /leads/:id */
  update: (lead: Lead): Promise<void> =>
    USING_REAL_API
      ? request<Lead>(`/leads/${lead.id}`, {
          method: 'PATCH',
          body: JSON.stringify(lead),
        }).then(() => undefined)
      : mocked(() => void updateLead(lead)),

  /** DELETE /leads/:id */
  remove: (id: number): Promise<void> =>
    USING_REAL_API
      ? request<{ ok: boolean }>(`/leads/${id}`, { method: 'DELETE' }).then(() => undefined)
      : mocked(() => void deleteLead(id)),
}
