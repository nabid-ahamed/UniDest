import { Module } from '@nestjs/common'
import { OrgController, StaffController } from './staff.controller'
import { StaffService } from './staff.service'

@Module({
  controllers: [StaffController, OrgController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
