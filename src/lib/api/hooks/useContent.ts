/**
 * Media library and student resource hooks.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mediaApi, resourcesApi } from '../resources/content'
import { qk } from '../keys'

export function useMedia(type?: string) {
  return useQuery({ queryKey: qk.media.list(type ?? 'all'), queryFn: () => mediaApi.list(type) })
}

function useInvalidateMedia() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.media.all })
}

export function useUploadMedia() {
  const invalidate = useInvalidateMedia()
  return useMutation({ mutationFn: (file: File) => mediaApi.upload(file), onSuccess: invalidate })
}

export function useDeleteMedia() {
  const invalidate = useInvalidateMedia()
  return useMutation({ mutationFn: (id: number) => mediaApi.remove(id), onSuccess: invalidate })
}

export function useResourceCategories() {
  return useQuery({ queryKey: qk.resources.categories(), queryFn: resourcesApi.categories })
}

export function useResources(categoryId?: number) {
  return useQuery({
    queryKey: qk.resources.list(categoryId ?? 0),
    queryFn: () => resourcesApi.list(categoryId),
  })
}

/** Uploading changes both the list and the per-category counts. */
function useInvalidateResources() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.resources.all })
}

export function useCreateResourceCategory() {
  const invalidate = useInvalidateResources()
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      resourcesApi.createCategory(name, description),
    onSuccess: invalidate,
  })
}

export function useUpdateResourceCategory() {
  const invalidate = useInvalidateResources()
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: number; name?: string; description?: string }) =>
      resourcesApi.updateCategory(id, patch),
    onSuccess: invalidate,
  })
}

export function useDeleteResourceCategory() {
  const invalidate = useInvalidateResources()
  return useMutation({
    mutationFn: (id: number) => resourcesApi.removeCategory(id),
    onSuccess: invalidate,
  })
}

export function useUploadResource() {
  const invalidate = useInvalidateResources()
  return useMutation({
    mutationFn: ({ file, ...meta }: { file: File } & Parameters<typeof resourcesApi.upload>[1]) =>
      resourcesApi.upload(file, meta),
    onSuccess: invalidate,
  })
}

export function useDeleteResource() {
  const invalidate = useInvalidateResources()
  return useMutation({ mutationFn: (id: number) => resourcesApi.remove(id), onSuccess: invalidate })
}
