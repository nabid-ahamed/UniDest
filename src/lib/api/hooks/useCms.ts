/**
 * CMS hooks — blog posts, pages, country entries and the newsletter list.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cmsApi, type CmsKind } from '../resources/cms'
import { qk } from '../keys'

export function useCmsList(kind: CmsKind, status?: string) {
  return useQuery({
    queryKey: qk.cms.list(kind, status ?? 'all'),
    queryFn: () => cmsApi.list(kind, status),
  })
}

export function useCmsItem(kind: CmsKind, id: number | undefined) {
  return useQuery({
    queryKey: qk.cms.detail(kind, id!),
    queryFn: () => cmsApi.get(kind, id!),
    enabled: id !== undefined,
  })
}

function useInvalidateCms() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.cms.all })
}

export function useCreateCms() {
  const invalidate = useInvalidateCms()
  return useMutation({
    mutationFn: (data: Parameters<typeof cmsApi.create>[0]) => cmsApi.create(data),
    onSuccess: invalidate,
  })
}

export function useUpdateCms() {
  const invalidate = useInvalidateCms()
  return useMutation({
    mutationFn: ({
      kind,
      id,
      ...patch
    }: { kind: CmsKind; id: number } & Parameters<typeof cmsApi.update>[2]) =>
      cmsApi.update(kind, id, patch),
    onSuccess: invalidate,
  })
}

export function useDeleteCms() {
  const invalidate = useInvalidateCms()
  return useMutation({
    mutationFn: ({ kind, id }: { kind: CmsKind; id: number }) => cmsApi.remove(kind, id),
    onSuccess: invalidate,
  })
}

export function useSubscribers() {
  return useQuery({ queryKey: qk.cms.newsletter(), queryFn: cmsApi.subscribers })
}

function useInvalidateSubscribers() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.cms.newsletter() })
}

export function useSubscribe() {
  const invalidate = useInvalidateSubscribers()
  return useMutation({
    mutationFn: ({ email, name }: { email: string; name?: string }) => cmsApi.subscribe(email, name),
    onSuccess: invalidate,
  })
}

export function useUnsubscribe() {
  const invalidate = useInvalidateSubscribers()
  return useMutation({
    mutationFn: (id: number) => cmsApi.unsubscribe(id),
    onSuccess: invalidate,
  })
}
