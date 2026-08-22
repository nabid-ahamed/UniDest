/**
 * Additional services (insurance, visas, accommodation, …).
 *
 * The API returns the flat shape `src/mock/services.ts` exposed, so the list and
 * detail screens render largely unchanged. Two differences worth knowing:
 *
 * - `status` is never `''`. A request always has a status now; the mock used an
 *   empty string for "not triaged yet", which is why its filter dropdown had a
 *   blank option. New requests start at "New File".
 * - Reads are scoped server-side. A student sees only their own requests and an
 *   agent only those of students they referred, so no screen needs to filter by
 *   owner itself — and cannot widen the view by asking.
 */
import { mocked, request, USING_REAL_API } from '../client'

export interface ApiServiceMessage {
  id: number
  text: string
  by: string
  /** True when staff wrote it — drives which side of the thread it renders on. */
  fromStaff: boolean
  /** "28 Jul 2026 · 2:14 PM" */
  at: string
}

export interface ApiServiceRequest {
  id: number
  publicId: string
  /** "10-06-2026" */
  dateCreated: string
  status: string
  statusColor: string

  studentId: number
  studentNo: string
  studentName: string
  studentEmail: string
  studentPhone: string

  service: string
  country: string
  description: string
  notes: string
  assignedTo: string | null

  /** Only populated by the detail call; the list returns an empty array. */
  messages: ApiServiceMessage[]
}

export interface ApiServiceStatus {
  label: string
  color: string
  /** Reached a decision — nothing further is expected from staff. */
  isClosed: boolean
}

interface ServiceListResponse {
  data: ApiServiceRequest[]
  total: number
  page: number
  limit: number
}

export const servicesApi = {
  /** GET /services — already scoped to the caller. */
  list: (): Promise<ApiServiceRequest[]> =>
    USING_REAL_API
      ? request<ServiceListResponse>('/services?limit=200').then((r) => r.data)
      : mocked(() => []),

  /** GET /services/:id — includes the message thread. */
  get: (id: number): Promise<ApiServiceRequest | null> =>
    USING_REAL_API
      ? request<ApiServiceRequest>(`/services/${id}`).catch(() => null)
      : mocked(() => null),

  /** GET /services/statuses — the status vocabulary, in display order. */
  statuses: (): Promise<ApiServiceStatus[]> =>
    USING_REAL_API ? request<ApiServiceStatus[]>('/services/statuses') : mocked(() => []),

  /** POST /services — staff raise a request on a student's behalf. */
  create: (data: {
    studentNo: string
    service: string
    country?: string
    description?: string
    status?: string
    assignedTo?: string
    notes?: string
  }): Promise<ApiServiceRequest> =>
    request<ApiServiceRequest>('/services', { method: 'POST', body: JSON.stringify(data) }),

  /** PATCH /services/:id — `assignedTo: ''` clears the assignee. */
  update: (
    id: number,
    patch: {
      service?: string
      country?: string
      description?: string
      status?: string
      assignedTo?: string
      notes?: string
    },
  ): Promise<ApiServiceRequest> =>
    request<ApiServiceRequest>(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  /** POST /services/:id/reply — the server decides `fromStaff` from the token. */
  reply: (id: number, body: string): Promise<ApiServiceRequest> =>
    request<ApiServiceRequest>(`/services/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),

  /** DELETE /services/:id — soft delete. */
  remove: (id: number): Promise<void> =>
    request<{ ok: boolean }>(`/services/${id}`, { method: 'DELETE' }).then(() => undefined),
}
