import { Global, Module } from '@nestjs/common'
import { ActivityController } from './activity.controller'
import { ActivityService } from './activity.service'

/**
 * Global: nearly every write path logs, and threading this import through each
 * feature module would be noise around a cross-cutting concern.
 */
@Global()
@Module({
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
