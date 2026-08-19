/**
 * Central registry of React Query cache keys.
 *
 * Keys are hierarchical so a mutation can invalidate a whole branch: calling
 * `invalidateQueries({ queryKey: qk.leads.all })` refreshes both the list and
 * every individual lead detail, because those keys start with the same prefix.
 *
 * Keeping them here (rather than inline strings at each call site) means a
 * typo cannot silently create a second, never-invalidated cache entry.
 */
export const qk = {
  leads: {
    all: ['leads'] as const,
    list: () => [...qk.leads.all, 'list'] as const,
    detail: (id: number) => [...qk.leads.all, 'detail', id] as const,
  },
  students: {
    all: ['students'] as const,
    list: () => [...qk.students.all, 'list'] as const,
    detail: (id: number) => [...qk.students.all, 'detail', id] as const,
  },
  applications: {
    all: ['applications'] as const,
    list: () => [...qk.applications.all, 'list'] as const,
    detail: (id: number) => [...qk.applications.all, 'detail', id] as const,
  },
  staff: {
    all: ['staff'] as const,
    list: () => [...qk.staff.all, 'list'] as const,
    detail: (id: number) => [...qk.staff.all, 'detail', id] as const,
    assignable: () => [...qk.staff.all, 'assignable'] as const,
    roles: () => [...qk.staff.all, 'roles'] as const,
    branches: () => [...qk.staff.all, 'branches'] as const,
  },
  /** Read-only reference data: countries, universities, courses, categories. */
  catalog: {
    all: ['catalog'] as const,
    countries: () => [...qk.catalog.all, 'countries'] as const,
    universities: (country?: string) => [...qk.catalog.all, 'universities', country ?? 'all'] as const,
    categories: () => [...qk.catalog.all, 'categories'] as const,
    // The filter object is part of the key, so each combination caches separately.
    courses: (query: object) => [...qk.catalog.all, 'courses', query] as const,
    course: (id: number) => [...qk.catalog.all, 'course', id] as const,
  },
} as const
