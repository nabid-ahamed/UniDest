/**
 * Media library and student resources.
 *
 * Both store their bytes through the same `StorageService` the application
 * documents use: generated UUID keys, authenticated download routes, and one
 * set of upload rules rather than a second path with its own validation to keep
 * correct.
 *
 * Uploads bypass `request()` because that helper always sets a JSON content
 * type; a multipart body must let the browser set its own boundary.
 */
import { API_BASE_URL, ApiError, mocked, request, USING_REAL_API } from '../client'
import { getAccessToken } from '../../../store/auth'

export interface ApiMediaItem {
  id: number
  name: string
  /** image | video | document */
  type: string
  /** Path (relative to the API base) the bytes are fetched from. */
  url: string
  size: number
  width: number | null
  height: number | null
  uploadedBy: string
  /** "23 Jul 2026" */
  uploadedAt: string
}

export interface ApiResourceCategory {
  id: number
  name: string
  description: string
  /** Live count of resources filed under it. */
  resources: number
}

export interface ApiStudentResource {
  id: number
  title: string
  categoryId: number | null
  category: string
  fileName: string
  fileSize: number
  /** Path (relative to the API base) the bytes are fetched from. */
  fileUrl: string
  relatedCourseId: number | null
  uploadedBy: string
  uploadedAt: string
}

function authHeaders(): HeadersInit {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function failFrom(res: Response): Promise<never> {
  const body = await res.json().catch(() => null)
  throw new ApiError(body?.message ?? res.statusText, res.status)
}

/**
 * Fetch a protected file and hand it to the browser as a download.
 *
 * A plain link cannot work: these routes need an Authorization header, which a
 * navigation will not send.
 */
async function downloadVia(path: string, filename: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: authHeaders() })
  if (!res.ok) await failFrom(res)
  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const mediaApi = {
  /** GET /media */
  list: (type?: string): Promise<ApiMediaItem[]> =>
    USING_REAL_API
      ? request<ApiMediaItem[]>(`/media${type && type !== 'all' ? `?type=${type}` : ''}`)
      : mocked(() => []),

  /** POST /media — multipart. */
  upload: async (file: File): Promise<ApiMediaItem> => {
    if (!USING_REAL_API) throw new ApiError('File uploads need the API.', 503)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API_BASE_URL}/media`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    })
    return res.ok ? res.json() : failFrom(res)
  },

  download: (item: ApiMediaItem) => downloadVia(item.url, item.name),

  /** DELETE /media/:id — removes the record and the bytes. */
  remove: (id: number): Promise<void> =>
    request<{ ok: boolean }>(`/media/${id}`, { method: 'DELETE' }).then(() => undefined),
}

export const resourcesApi = {
  /** GET /resources/categories */
  categories: (): Promise<ApiResourceCategory[]> =>
    USING_REAL_API ? request<ApiResourceCategory[]>('/resources/categories') : mocked(() => []),

  /** POST /resources/categories */
  createCategory: (name: string, description?: string): Promise<ApiResourceCategory> =>
    request<ApiResourceCategory>('/resources/categories', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  /** PATCH /resources/categories/:id */
  updateCategory: (
    id: number,
    patch: { name?: string; description?: string },
  ): Promise<ApiResourceCategory> =>
    request<ApiResourceCategory>(`/resources/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  /**
   * DELETE /resources/categories/:id.
   *
   * Refused by the server while the category still holds files — silently
   * orphaning someone's uploads is worse than asking the caller to move them.
   */
  removeCategory: (id: number): Promise<void> =>
    request<{ ok: boolean }>(`/resources/categories/${id}`, { method: 'DELETE' }).then(
      () => undefined,
    ),

  /** GET /resources */
  list: (categoryId?: number): Promise<ApiStudentResource[]> =>
    USING_REAL_API
      ? request<ApiStudentResource[]>(
          `/resources${categoryId ? `?categoryId=${categoryId}` : ''}`,
        )
      : mocked(() => []),

  /** POST /resources — multipart, with the title and category alongside. */
  upload: async (
    file: File,
    meta: { title?: string; categoryId?: number; relatedCourseId?: number },
  ): Promise<{ id: number; title: string; fileName: string }> => {
    if (!USING_REAL_API) throw new ApiError('File uploads need the API.', 503)
    const form = new FormData()
    form.append('file', file)
    if (meta.title) form.append('title', meta.title)
    if (meta.categoryId) form.append('categoryId', String(meta.categoryId))
    if (meta.relatedCourseId) form.append('relatedCourseId', String(meta.relatedCourseId))

    const res = await fetch(`${API_BASE_URL}/resources`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    })
    return res.ok ? res.json() : failFrom(res)
  },

  download: (item: ApiStudentResource) => downloadVia(item.fileUrl, item.fileName),

  /** DELETE /resources/:id */
  remove: (id: number): Promise<void> =>
    request<{ ok: boolean }>(`/resources/${id}`, { method: 'DELETE' }).then(() => undefined),
}

/** Bytes → a short human label. */
export function formatFileSize(bytes: number): string {
  if (!bytes) return '--'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
