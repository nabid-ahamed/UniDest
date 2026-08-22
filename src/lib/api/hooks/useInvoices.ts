/**
 * Invoice hooks.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invoicesApi } from '../resources/invoices'
import { qk } from '../keys'

export function useInvoices(kind?: 'student' | 'university') {
  return useQuery({
    queryKey: qk.invoices.list(kind ?? 'all'),
    queryFn: () => invoicesApi.list(kind),
  })
}

export function useInvoice(id: number | undefined) {
  return useQuery({
    queryKey: qk.invoices.detail(id!),
    queryFn: () => invoicesApi.get(id!),
    enabled: id !== undefined,
  })
}

export function useBusinesses() {
  return useQuery({
    queryKey: qk.invoices.businesses(),
    queryFn: invoicesApi.businesses,
    staleTime: 5 * 60_000,
  })
}

/**
 * The invoice status vocabulary. Rarely changes, so it is cached like the
 * business list rather than refetched per screen.
 */
export function useInvoiceStatuses() {
  return useQuery({
    queryKey: qk.invoices.statuses(),
    queryFn: invoicesApi.statuses,
    staleTime: 5 * 60_000,
  })
}

/**
 * Invalidate the whole `invoices` branch after any write.
 *
 * A payment changes the invoice's status, its balance, and its row in both
 * lists — patching those caches by hand is exactly how a list and a detail page
 * start showing different amounts owed.
 */
function useInvalidateInvoices() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.invoices.all })
}

export function useCreateInvoice() {
  const invalidate = useInvalidateInvoices()
  return useMutation({
    mutationFn: (data: Parameters<typeof invoicesApi.create>[0]) => invoicesApi.create(data),
    onSuccess: invalidate,
  })
}

export function useUpdateInvoice() {
  const invalidate = useInvalidateInvoices()
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: number } & Parameters<typeof invoicesApi.update>[1]) =>
      invoicesApi.update(id, patch),
    onSuccess: invalidate,
  })
}

export function useRecordPayment() {
  const invalidate = useInvalidateInvoices()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Parameters<typeof invoicesApi.recordPayment>[1]) =>
      invoicesApi.recordPayment(id, data),
    onSuccess: invalidate,
  })
}

export function useDeleteInvoice() {
  const invalidate = useInvalidateInvoices()
  return useMutation({
    mutationFn: (id: number) => invoicesApi.remove(id),
    onSuccess: invalidate,
  })
}
