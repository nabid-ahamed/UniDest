/**
 * Support tickets.
 *
 * The API returns the flat shape `src/mock/supportTickets.ts` exposed, so the
 * list, row and detail screens render unchanged. The one difference worth
 * knowing: `requesterNo` for a lead is "LEAD-{id}" rather than the mock's
 * invented "LEAD-2026-0442" — leads have no business key of their own.
 */
import { mocked, request, USING_REAL_API } from '../client'
import {
  tickets as mockTickets,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from '../../../mock/supportTickets'

export type { Ticket, TicketPriority, TicketStatus }

interface TicketListResponse {
  data: Ticket[]
  total: number
  page: number
  limit: number
}

export interface TicketStatusOption {
  label: string
  color: string
  /** Still needs attention — what the dashboard's "Open" card counts. */
  isOpen: boolean
}

export const ticketsApi = {
  /** GET /tickets */
  list: (): Promise<Ticket[]> =>
    USING_REAL_API
      ? request<TicketListResponse>('/tickets?limit=200').then((r) => r.data)
      : mocked(() => [...mockTickets]),

  /** GET /tickets/:id — includes the message thread. */
  get: (id: number): Promise<Ticket | null> =>
    USING_REAL_API
      ? request<Ticket>(`/tickets/${id}`).catch(() => null)
      : mocked(() => mockTickets.find((t) => t.id === id) ?? null),

  /** GET /tickets/statuses */
  statuses: (): Promise<TicketStatusOption[]> =>
    USING_REAL_API
      ? request<TicketStatusOption[]>('/tickets/statuses')
      : mocked(() => []),

  /** POST /tickets */
  create: (data: {
    subject: string
    category?: string
    /** Exactly one of studentNo / leadId. */
    studentNo?: string
    leadId?: number
    priority?: string
    assignedTo?: string
    body?: string
  }): Promise<Ticket> => request<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(data) }),

  /** PATCH /tickets/:id */
  update: (
    id: number,
    patch: { subject?: string; category?: string; status?: string; priority?: string; assignedTo?: string },
  ): Promise<Ticket> =>
    request<Ticket>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  /** POST /tickets/:id/reply — appends to the thread and bumps the ticket. */
  reply: (id: number, body: string): Promise<Ticket> =>
    request<Ticket>(`/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ body }) }),

  /** DELETE /tickets/:id — soft delete. */
  remove: (id: number): Promise<void> =>
    request<{ ok: boolean }>(`/tickets/${id}`, { method: 'DELETE' }).then(() => undefined),
}
