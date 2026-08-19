/**
 * Lead data hooks — the only thing feature code should import for lead data.
 *
 * Each mutation invalidates `qk.leads.all`, so every mounted list and detail
 * view refetches automatically. That replaces the manual `const [rev, setRev]`
 * counters the pages currently use to force a re-render after a write.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { leadsApi, type Lead } from '../resources/leads'
import { qk } from '../keys'

/** All leads. */
export function useLeads() {
  return useQuery({ queryKey: qk.leads.list(), queryFn: leadsApi.list })
}

/** One lead by id. Skipped when `id` is undefined (e.g. a route param not yet parsed). */
export function useLead(id: number | undefined) {
  return useQuery({
    queryKey: qk.leads.detail(id!),
    queryFn: () => leadsApi.get(id!),
    enabled: id !== undefined,
  })
}

/** Refetch every lead query after a write. */
function useInvalidateLeads() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.leads.all })
}

export function useCreateLead() {
  const invalidate = useInvalidateLeads()
  return useMutation({
    mutationFn: (data: Omit<Lead, 'id'>) => leadsApi.create(data),
    onSuccess: invalidate,
  })
}

export function useUpdateLead() {
  const invalidate = useInvalidateLeads()
  return useMutation({
    mutationFn: (lead: Lead) => leadsApi.update(lead),
    onSuccess: invalidate,
  })
}

export function useDeleteLead() {
  const invalidate = useInvalidateLeads()
  return useMutation({
    mutationFn: (id: number) => leadsApi.remove(id),
    onSuccess: invalidate,
  })
}
