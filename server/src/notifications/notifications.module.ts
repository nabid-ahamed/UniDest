import { Module } from '@nestjs/common'
import { AnnouncementsController, NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'

@Module({
  controllers: [NotificationsController, AnnouncementsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
