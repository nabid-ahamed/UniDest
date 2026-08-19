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
} as const
