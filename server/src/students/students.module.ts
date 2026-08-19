import { Module } from '@nestjs/common'
import { LeadConversionController, StudentsController } from './students.controller'
import { StudentsService } from './students.service'

@Module({
  controllers: [StudentsController, LeadConversionController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
