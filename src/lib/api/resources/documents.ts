/**
 * Application documents — passports, transcripts, financial statements.
 *
 * Uploads and downloads bypass `request()` because that helper always sets a
 * JSON content type and parses a JSON response. Multipart bodies must let the
 * browser set their own boundary, and a download is bytes, not JSON.
 */
import { API_BASE_URL, ApiError, mocked, USING_REAL_API } from '../client'
import { getAccessToken } from '../../../store/auth'

export interface ApplicationDocument {
  id: number
  publicId: string
  applicationId: number
  name: string
  type: string
  /** Bytes. 0 when the size was not recorded. */
  size: number
  status: string
  /** "18 Jan 2026 12:39 PM" */
  uploadedAt: string
  /** Path (relative to the API base) the bytes are fetched from. */
  downloadPath: string
}

/** Mirrors the server's allow-list, so the picker can filter before uploading. */
export const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx'

/** 10 MB — matches MAX_FILE_BYTES on the server. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024

/** Auth header for the calls that build their own request. */
function authHeaders(): HeadersInit {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function failFrom(res: Response): Promise<never> {
  const body = await res.json().catch(() => null)
  throw new ApiError(body?.message ?? res.statusText, res.status)
}

export const documentsApi = {
  /** GET /applications/:id/documents */
  list: (applicationId: number): Promise<ApplicationDocument[]> =>
    USING_REAL_API
      ? fetch(`${API_BASE_URL}/applications/${applicationId}/documents`, { headers: authHeaders() }).then((r) =>
          r.ok ? r.json() : failFrom(r),
        )
      : mocked(() => []),

  /**
   * POST /applications/:id/documents — multipart.
   *
   * No Content-Type header here on purpose: the browser must set it so the
   * multipart boundary matches the body it generates.
   */
  upload: async (applicationId: number, file: File, type?: string): Promise<ApplicationDocument> => {
    if (!USING_REAL_API) throw new ApiError('File uploads need the API.', 503)

    const form = new FormData()
    form.append('file', file)
    if (type) form.append('type', type)

    const res = await fetch(`${API_BASE_URL}/applications/${applicationId}/documents`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    })
    return res.ok ? res.json() : failFrom(res)
  },

  /**
   * Fetch the bytes and hand them to the browser as a download.
   *
   * A plain link cannot work: the route requires an Authorization header, which
   * a navigation will not send. So the file is fetched, turned into a blob URL,
   * and a synthetic click saves it.
   */
  download: async (doc: ApplicationDocument): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}${doc.downloadPath}`, { headers: authHeaders() })
    if (!res.ok) await failFrom(res)

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.name
    a.click()
    // Revoking immediately can cancel the save in some browsers; one tick is enough.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  },

  /** DELETE /applications/:id/documents/:docId */
  remove: async (applicationId: number, documentId: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/applications/${applicationId}/documents/${documentId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (!res.ok) await failFrom(res)
  },
}
