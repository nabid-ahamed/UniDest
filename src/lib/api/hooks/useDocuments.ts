/**
 * Application document hooks.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '../resources/documents'
import { qk } from '../keys'

export function useApplicationDocuments(applicationId: number | undefined) {
  return useQuery({
    queryKey: qk.documents.list(applicationId!),
    queryFn: () => documentsApi.list(applicationId!),
    enabled: applicationId !== undefined,
  })
}

export function useUploadDocument(applicationId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, type }: { file: File; type?: string }) =>
      documentsApi.upload(applicationId, file, type),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.documents.list(applicationId) }),
  })
}

export function useDeleteDocument(applicationId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (documentId: number) => documentsApi.remove(applicationId, documentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.documents.list(applicationId) }),
  })
}
