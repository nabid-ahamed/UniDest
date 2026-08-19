/**
 * University catalog — countries, universities, courses, categories.
 *
 * Read-only in Phase 2: the Course Finder and the pickers on lead/student forms
 * consume it, while catalog *editing* (src/features/courseManagement) stays on
 * mocks since it is not part of the core funnel.
 */
import { mocked, request, USING_REAL_API } from '../client'
import { finderCourses, type FinderCourse } from '../../../mock/courseFinder'
import { universities as mockUniversities, courseCategories } from '../../../mock/courseManagement'
import { allCountries } from '../../../mock/leads'

export type { FinderCourse }

export interface ApiCountry {
  id: number
  name: string
  code: string | null
}

export interface ApiUniversity {
  id: number
  name: string
  country: string
  city: string
  website: string
  type: string
  established: number | null
  ranking: number | null
  showToAgent: boolean
  status: string
  courseCount: number
}

export interface ApiCourseCategory {
  id: number
  name: string
  parentId: number | null
  description: string
  displayOrder: number
  status: string
}

/** Course Finder filters, passed straight through as query params. */
export interface CourseQuery {
  search?: string
  country?: string
  university?: string
  studyLevel?: string
  studyArea?: string
  /** Only courses a student with this IELTS score qualifies for. */
  maxIelts?: number
  limit?: number
}

interface CourseListResponse {
  data: FinderCourse[]
  total: number
  page: number
  limit: number
}

const qs = (q: CourseQuery) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== '') p.set(k, String(v))
  }
  if (!p.has('limit')) p.set('limit', '200')
  return p.toString()
}

export const catalogApi = {
  /** GET /countries */
  countries: (): Promise<ApiCountry[]> =>
    USING_REAL_API
      ? request<ApiCountry[]>('/countries')
      : mocked(() => allCountries.map((name, i) => ({ id: i + 1, name, code: null }))),

  /** GET /universities */
  universities: (country?: string): Promise<ApiUniversity[]> =>
    USING_REAL_API
      ? request<ApiUniversity[]>(`/universities${country ? `?country=${encodeURIComponent(country)}` : ''}`)
      : mocked(() =>
          mockUniversities
            .filter((u) => !country || u.country === country)
            .map((u) => ({
              id: u.id,
              name: u.name,
              country: u.country,
              city: u.city,
              website: u.website,
              type: u.type,
              established: u.established,
              ranking: u.ranking,
              showToAgent: u.showToAgent,
              status: u.status,
              courseCount: 0,
            })),
        ),

  /** GET /course-categories — flat rows; parentId builds the two-level tree. */
  categories: (): Promise<ApiCourseCategory[]> =>
    USING_REAL_API
      ? request<ApiCourseCategory[]>('/course-categories')
      : mocked(() =>
          courseCategories.map((c) => ({
            id: c.id,
            name: c.name,
            parentId: c.parentId,
            description: c.description,
            displayOrder: c.displayOrder,
            status: c.status,
          })),
        ),

  /** GET /courses */
  list: (query: CourseQuery = {}): Promise<FinderCourse[]> =>
    USING_REAL_API
      ? request<CourseListResponse>(`/courses?${qs(query)}`).then((r) => r.data)
      : mocked(() => [...finderCourses]),

  /** GET /courses/:id */
  get: (id: number): Promise<FinderCourse | null> =>
    USING_REAL_API
      ? request<FinderCourse>(`/courses/${id}`).catch(() => null)
      : mocked(() => finderCourses.find((c) => c.id === id) ?? null),
}
