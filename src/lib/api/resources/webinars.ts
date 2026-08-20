/**
 * Webinars and their enrolments.
 *
 * `enrolledUsers` is counted from the enrolment rows on every read, never
 * stored — the mock kept it as an integer on the webinar, which is exactly the
 * field that drifts from the rows it claims to describe.
 */
import { mocked, request, USING_REAL_API } from '../client'

export interface ApiWebinar {
  id: number
  topic: string
  /** "11-06-2026 02:31 PM" — the format the list renders. */
  date: string
  /** ISO, for form inputs and sorting. */
  startsAt: string
  venue: string
  /** Student | Agent | Student / Agent */
  audienceType: string
  enrolledUsers: number
  webinarLink: string | null
  description: string | null
  notifiedEmail: string | null
}

export interface ApiEnrollment {
  id: number
  name: string
  email: string
  phone: string
  /** Student | Agent */
  userType: string
  /** "28 May 2026" */
  enrolledOn: string
}

export const webinarsApi = {
  /** GET /webinars */
  list: (): Promise<ApiWebinar[]> =>
    USING_REAL_API ? request<ApiWebinar[]>('/webinars') : mocked(() => []),

  /** GET /webinars/:id */
  get: (id: number): Promise<ApiWebinar | null> =>
    USING_REAL_API ? request<ApiWebinar>(`/webinars/${id}`).catch(() => null) : mocked(() => null),

  /** GET /webinars/:id/enrollments */
  enrollments: (id: number): Promise<ApiEnrollment[]> =>
    USING_REAL_API ? request<ApiEnrollment[]>(`/webinars/${id}/enrollments`) : mocked(() => []),

  /** POST /webinars */
  create: (data: {
    topic: string
    /** ISO datetime. */
    startsAt: string
    venue?: string
    audienceType?: string
    webinarLink?: string
    description?: string
    notifiedEmail?: string
  }): Promise<ApiWebinar> =>
    request<ApiWebinar>('/webinars', { method: 'POST', body: JSON.stringify(data) }),

  /** PATCH /webinars/:id */
  update: (
    id: number,
    patch: {
      topic?: string
      startsAt?: string
      venue?: string
      audienceType?: string
      webinarLink?: string
      description?: string
      notifiedEmail?: string
    },
  ): Promise<ApiWebinar> =>
    request<ApiWebinar>(`/webinars/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  /** POST /webinars/:id/enroll — one enrolment per email, enforced server-side. */
  enroll: (
    id: number,
    data: { name: string; email: string; phone?: string; userType?: string },
  ): Promise<ApiEnrollment> =>
    request<ApiEnrollment>(`/webinars/${id}/enroll`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** DELETE /webinars/:id — soft delete. */
  remove: (id: number): Promise<void> =>
    request<{ ok: boolean }>(`/webinars/${id}`, { method: 'DELETE' }).then(() => undefined),
}
