/**
 * Lead endpoints. Mock-backed today; each function becomes a `request()` call
 * in Phase 2 without changing its signature.
 *
 * The `[...leads]` copies are deliberate: the mock module exports a mutable
 * array, and handing that same reference to React Query would let a later
 * in-place mutation change cached data behind the cache's back. Copying keeps
 * the snapshot immutable, which is also how the real API will behave.
 */
import { mocked } from '../client'
import { leads, addLead, updateLead, deleteLead, type Lead } from '../../../mock/leads'

export type { Lead }

export const leadsApi = {
  /** GET /leads */
  list: () => mocked(() => [...leads]),

  /** GET /leads/:id */
  get: (id: number) => mocked(() => leads.find((l) => l.id === id) ?? null),

  /** POST /leads */
  create: (data: Omit<Lead, 'id'>) => mocked(() => addLead(data)),

  /** PATCH /leads/:id */
  update: (lead: Lead) => mocked(() => void updateLead(lead)),

  /** DELETE /leads/:id */
  remove: (id: number) => mocked(() => void deleteLead(id)),
}
