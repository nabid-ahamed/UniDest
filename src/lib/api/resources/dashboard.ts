/**
 * Dashboard read model.
 *
 * One endpoint backs the whole page: every card shares the same branch filter,
 * so splitting them into separate requests would multiply latency without
 * giving any card its data sooner.
 *
 * The types below are re-exported from `src/mock/dashboard.ts` rather than
 * redeclared. The nine card components already import them from there, and a
 * parallel set of near-identical interfaces is exactly how the two drift apart.
 */
import { mocked, request, USING_REAL_API } from '../client'
import {
  branchDashboard,
  branches as mockBranches,
  type BranchDashboard,
} from '../../../mock/dashboard'

export type { BranchDashboard }

export const dashboardApi = {
  /** GET /dashboard?branch= — everything the page renders. */
  overview: (branch: string): Promise<BranchDashboard> =>
    USING_REAL_API
      ? request<BranchDashboard>(`/dashboard?branch=${encodeURIComponent(branch)}`)
      : mocked(() => branchDashboard(branch)),

  /** GET /dashboard/branches — filter options, "All Branch" first. */
  branches: (): Promise<string[]> =>
    USING_REAL_API ? request<string[]>('/dashboard/branches') : mocked(() => [...mockBranches]),
}
