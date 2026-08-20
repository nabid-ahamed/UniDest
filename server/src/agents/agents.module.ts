import { Module } from '@nestjs/common'
import { AgentsController, CommissionsController } from './agents.controller'
import { AgentsService } from './agents.service'

@Module({
  controllers: [AgentsController, CommissionsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
