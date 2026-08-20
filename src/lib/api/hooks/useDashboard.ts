/**
 * Dashboard hooks.
 */
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../resources/dashboard'
import { qk } from '../keys'

/**
 * The whole dashboard for one branch.
 *
 * Keyed by branch so switching the filter swaps to a separate cache entry and
 * back again instantly, rather than refetching what was just on screen.
 */
export function useDashboard(branch: string) {
  return useQuery({
    queryKey: qk.dashboard.overview(branch),
    queryFn: () => dashboardApi.overview(branch),
  })
}

/** Branch filter options. Rarely changes, so it is cached for longer. */
export function useDashboardBranches() {
  return useQuery({
    queryKey: qk.dashboard.branches(),
    queryFn: dashboardApi.branches,
    staleTime: 5 * 60_000,
  })
}
