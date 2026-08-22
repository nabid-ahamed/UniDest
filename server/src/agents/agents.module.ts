import { Module } from '@nestjs/common'
import { AgentsController, CommissionsController } from './agents.controller'
import { AgentsService } from './agents.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [AgentsController, CommissionsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
