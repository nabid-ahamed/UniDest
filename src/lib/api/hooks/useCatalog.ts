/**
 * Catalog hooks. Read-only, and the data barely changes during a session, so
 * these use a long staleTime — a counsellor scrolling the Course Finder should
 * not refetch the whole catalog on every filter change.
 */
import { useQuery } from '@tanstack/react-query'
import { catalogApi, type CourseQuery } from '../resources/catalog'
import { qk } from '../keys'

/** Catalog rows change rarely; 5 minutes avoids needless refetching. */
const CATALOG_STALE_TIME = 5 * 60_000

export function useCountries() {
  return useQuery({
    queryKey: qk.catalog.countries(),
    queryFn: () => catalogApi.countries(),
    staleTime: CATALOG_STALE_TIME,
  })
}

export function useUniversities(country?: string) {
  return useQuery({
    queryKey: qk.catalog.universities(country),
    queryFn: () => catalogApi.universities(country),
    staleTime: CATALOG_STALE_TIME,
  })
}

export function useCourseCategories() {
  return useQuery({
    queryKey: qk.catalog.categories(),
    queryFn: () => catalogApi.categories(),
    staleTime: CATALOG_STALE_TIME,
  })
}

/** Course Finder results. The query object is part of the cache key, so each
 *  filter combination is cached separately and revisiting one is instant. */
export function useCourses(query: CourseQuery = {}) {
  return useQuery({
    queryKey: qk.catalog.courses(query),
    queryFn: () => catalogApi.list(query),
    staleTime: CATALOG_STALE_TIME,
  })
}

export function useCourse(id: number | undefined) {
  return useQuery({
    queryKey: qk.catalog.course(id!),
    queryFn: () => catalogApi.get(id!),
    enabled: id !== undefined,
    staleTime: CATALOG_STALE_TIME,
  })
}
