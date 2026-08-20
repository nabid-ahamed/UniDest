import { Controller, Get, Inject, Query } from '@nestjs/common'
import { RequirePermission } from '../auth/guards/permissions.guard'
import { DashboardService } from './dashboard.service'

@Controller('dashboard')
export class DashboardController {
  constructor(@Inject(DashboardService) private readonly dashboard: DashboardService) {}

  /**
   * GET /dashboard?branch=Dhaka
   *
   * Gated on `view-leads` rather than `view-backend`. The dashboard is the
   * landing page for every staff role, so gating it on a permission the seeded
   * Counsellor does not hold would 403 them straight after login — and the page
   * only ever aggregates leads, students and applications, all of which a
   * counsellor can already read individually.
   */
  @Get()
  @RequirePermission('view-leads')
  overview(@Query('branch') branch?: string) {
    return this.dashboard.overview(branch)
  }

  /** Branch names for the dashboard filter, "All Branch" first. */
  @Get('branches')
  @RequirePermission('view-leads')
  branches() {
    return this.dashboard.branches()
  }
}
