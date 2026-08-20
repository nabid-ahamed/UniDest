import { Module } from '@nestjs/common'
import { TicketsController } from './tickets.controller'
import { TicketsService } from './tickets.service'

@Module({
  controllers: [TicketsController],
  providers: [TicketsService],
  // The dashboard reads ticket counts through this service rather than
  // duplicating the grouping query.
  exports: [TicketsService],
})
export class TicketsModule {}
