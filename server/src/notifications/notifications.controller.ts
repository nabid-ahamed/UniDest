import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common'
import { AllowAgent, AllowStudent, RequirePermission } from '../auth/guards/permissions.guard'
import type { JwtPayload } from '../auth/auth.types'
import { NotificationsService } from './notifications.service'
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcement.dto'

@Controller('notifications')
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly notifications: NotificationsService) {}

  /**
   * The signed-in user's feed. No permission required beyond being logged in —
   * everyone has a bell, students included, and the feed is already scoped to
   * the caller.
   */
  @Get()
  @AllowStudent()
  feed(@Req() req: { user?: JwtPayload }, @Query('limit') limit?: string) {
    return this.notifications.feed(req.user?.sub, Number(limit) || 30)
  }

  @Get('unread-count')
  @AllowStudent()
  unread(@Req() req: { user?: JwtPayload }) {
    return this.notifications.unreadCount(req.user?.sub).then((count) => ({ count }))
  }

  @Post('read-all')
  @AllowStudent()
  markAll(@Req() req: { user?: JwtPayload }) {
    return this.notifications.markAllRead(req.user!.sub)
  }

  @Post(':key/read')
  @AllowStudent()
  markRead(@Param('key') key: string, @Req() req: { user?: JwtPayload }) {
    return this.notifications.markRead(req.user!.sub, key)
  }
}

@Controller('announcements')
export class AnnouncementsController {
  constructor(@Inject(NotificationsService) private readonly notifications: NotificationsService) {}

  /** Readable by anyone signed in — announcements are broadcast by nature. */
  @Get()
  @AllowStudent()
  @AllowAgent()
  list() {
    return this.notifications.listAnnouncements()
  }

  @Get(':id')
  @AllowStudent()
  get(@Param('id', ParseIntPipe) id: number) {
    return this.notifications.getAnnouncement(id)
  }

  @Post()
  @RequirePermission('cms-articles')
  create(@Body() dto: CreateAnnouncementDto, @Req() req: { user?: JwtPayload }) {
    return this.notifications.createAnnouncement(dto, req.user?.sub)
  }

  @Patch(':id')
  @RequirePermission('cms-articles')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAnnouncementDto,
    @Req() req: { user?: JwtPayload },
  ) {
    return this.notifications.updateAnnouncement(id, dto, req.user?.sub)
  }

  @Delete(':id')
  @RequirePermission('cms-articles')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: JwtPayload }) {
    return this.notifications.removeAnnouncement(id, req.user?.sub)
  }
}
