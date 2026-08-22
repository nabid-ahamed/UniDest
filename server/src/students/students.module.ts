import { Module } from '@nestjs/common'
import { LeadConversionController, StudentsController } from './students.controller'
import { StudentsService } from './students.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [StudentsController, LeadConversionController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
