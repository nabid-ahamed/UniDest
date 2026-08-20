/**
 * Support ticket hooks.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ticketsApi } from '../resources/tickets'
import { qk } from '../keys'

export function useTickets() {
  return useQuery({ queryKey: qk.tickets.list(), queryFn: ticketsApi.list })
}

export function useTicket(id: number | undefined) {
  return useQuery({
    queryKey: qk.tickets.detail(id!),
    queryFn: () => ticketsApi.get(id!),
    enabled: id !== undefined,
  })
}

export function useTicketStatuses() {
  return useQuery({
    queryKey: qk.tickets.statuses(),
    queryFn: ticketsApi.statuses,
    staleTime: 5 * 60_000,
  })
}

/**
 * Every mutation invalidates the whole `tickets` branch rather than one key.
 * A status change moves the ticket in the list, changes the dashboard counts and
 * updates the detail page — patching each cache entry by hand is how they drift.
 */
function useInvalidateTickets() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: qk.tickets.all })
    // Ticket counts appear on the dashboard too.
    qc.invalidateQueries({ queryKey: qk.dashboard.all })
  }
}

export function useCreateTicket() {
  const invalidate = useInvalidateTickets()
  return useMutation({
    mutationFn: (data: Parameters<typeof ticketsApi.create>[0]) => ticketsApi.create(data),
    onSuccess: invalidate,
  })
}

export function useUpdateTicket() {
  const invalidate = useInvalidateTickets()
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: number } & Parameters<typeof ticketsApi.update>[1]) =>
      ticketsApi.update(id, patch),
    onSuccess: invalidate,
  })
}

export function useReplyToTicket() {
  const invalidate = useInvalidateTickets()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: string }) => ticketsApi.reply(id, body),
    onSuccess: invalidate,
  })
}

export function useDeleteTicket() {
  const invalidate = useInvalidateTickets()
  return useMutation({
    mutationFn: (id: number) => ticketsApi.remove(id),
    onSuccess: invalidate,
  })
}
