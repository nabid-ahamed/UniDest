/**
 * CMS content: blog posts, static pages and country entries.
 *
 * All three share one table keyed by `kind`, because all three are a titled,
 * slugged body with a publish state — three near-identical tables would mean
 * three copies of the same publish logic. Whatever is genuinely specific to one
 * kind lives in `meta` rather than columns that are null for the other two.
 */
import { mocked, request, USING_REAL_API } from '../client'

export type CmsKind = 'post' | 'page' | 'country'

export interface ApiCmsContent {
  id: number
  publicId: string
  kind: CmsKind
  title: string
  slug: string
  excerpt: string
  /** The body. Named `content` to match what the editors already bind to. */
  content: string
  cover: string | null
  /** Draft | Published */
  status: string
  featured: boolean
  author: string
  /** "02 Jun 2026" — empty while still a draft. */
  publishedAt: string
  meta: Record<string, unknown>
}

export interface ApiSubscriber {
  id: number
  email: string
  name: string
  /** "02 Jun 2026" */
  subscribedAt: string
}

export const cmsApi = {
  /** GET /cms/:kind — `status` narrows to Draft or Published. */
  list: (kind: CmsKind, status?: string): Promise<ApiCmsContent[]> =>
    USING_REAL_API
      ? request<ApiCmsContent[]>(`/cms/${kind}${status ? `?status=${status}` : ''}`)
      : mocked(() => []),

  /** GET /cms/:kind/:id */
  get: (kind: CmsKind, id: number): Promise<ApiCmsContent | null> =>
    USING_REAL_API
      ? request<ApiCmsContent>(`/cms/${kind}/${id}`).catch(() => null)
      : mocked(() => null),

  /**
   * POST /cms — the slug is derived from the title when omitted, and a clash
   * within the same kind is refused rather than silently overwriting.
   */
  create: (data: {
    kind: CmsKind
    title: string
    slug?: string
    excerpt?: string
    body?: string
    coverUrl?: string
    status?: string
    featured?: boolean
    meta?: Record<string, unknown>
  }): Promise<ApiCmsContent> =>
    request<ApiCmsContent>('/cms', { method: 'POST', body: JSON.stringify(data) }),

  /** PATCH /cms/:kind/:id — publishing sets the date; reverting clears it. */
  update: (
    kind: CmsKind,
    id: number,
    patch: {
      title?: string
      slug?: string
      excerpt?: string
      body?: string
      coverUrl?: string
      status?: string
      featured?: boolean
      meta?: Record<string, unknown>
    },
  ): Promise<ApiCmsContent> =>
    request<ApiCmsContent>(`/cms/${kind}/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  /** DELETE /cms/:kind/:id — soft delete. */
  remove: (kind: CmsKind, id: number): Promise<void> =>
    request<{ ok: boolean }>(`/cms/${kind}/${id}`, { method: 'DELETE' }).then(() => undefined),

  /** GET /cms/newsletter */
  subscribers: (): Promise<ApiSubscriber[]> =>
    USING_REAL_API ? request<ApiSubscriber[]>('/cms/newsletter') : mocked(() => []),

  /** POST /cms/newsletter — re-subscribing reactivates rather than erroring. */
  subscribe: (email: string, name?: string): Promise<{ id: number; email: string }> =>
    request<{ id: number; email: string }>('/cms/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    }),

  /** DELETE /cms/newsletter/:id */
  unsubscribe: (id: number): Promise<void> =>
    request<{ ok: boolean }>(`/cms/newsletter/${id}`, { method: 'DELETE' }).then(() => undefined),
}
