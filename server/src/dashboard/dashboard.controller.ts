import { Controller, Get, Inject, Query } from '@nestjs/common'
import { RequirePermission } from '../auth/guards/permissions.guard'
import { DashboardService } from './dashboard.service'

@Controller('dashboard')
export class DashboardController {
  constructor(@Inject(DashboardService) private readonly dashboard: DashboardService) {}

  /**
   * GET /dashboard?branch=Dhaka
   *
   * `view-backend` — the permission every staff role holds for admin access,
   * which is what this landing page is. (An earlier version gated on
   * `view-leads` because the seed's Counsellor was missing `view-backend`
   * entirely; the seed now matches src/mock/roles.ts.)
   */
  @Get()
  @RequirePermission('view-backend')
  overview(@Query('branch') branch?: string) {
    return this.dashboard.overview(branch)
  }

  /** Branch names for the dashboard filter, "All Branch" first. */
  @Get('branches')
  @RequirePermission('view-backend')
  branches() {
    return this.dashboard.branches()
  }
}
