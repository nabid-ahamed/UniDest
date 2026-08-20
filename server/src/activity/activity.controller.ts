import { Controller, Get, Inject, Param, Query } from '@nestjs/common'
import { RequirePermission } from '../auth/guards/permissions.guard'
import { ActivityService, type ActivityEntity } from './activity.service'

@Controller('activity')
export class ActivityController {
  constructor(@Inject(ActivityService) private readonly activity: ActivityService) {}

  /**
   * GET /activity?limit= — the recent feed across every entity.
   *
   * `view-reports` rather than a per-entity permission: this is the one view
   * that shows everyone's actions at once, so it belongs with reporting rather
   * than with day-to-day record access.
   */
  @Get()
  @RequirePermission('view-reports')
  recent(@Query('limit') limit?: string) {
    return this.activity.recent(Number(limit) || 50)
  }

  /**
   * GET /activity/:entity/:id — the timeline for one record.
   *
   * Gated on viewing that entity, so the audit panel on a lead page is readable
   * by anyone who can already open the lead.
   */
  @Get(':entity/:id')
  @RequirePermission('view-leads', 'view-students', 'view-applications')
  forEntity(
    @Param('entity') entity: ActivityEntity,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.activity.forEntity(entity, Number(id), Number(limit) || 50)
  }
}
