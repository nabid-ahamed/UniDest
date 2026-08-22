import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ServicesController } from './services.controller'
import { ServicesService } from './services.service'

@Module({
  // AuthModule supplies StudentScopeService / AgentScopeService, which the
  // controller uses to scope reads to the caller.
  imports: [AuthModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
