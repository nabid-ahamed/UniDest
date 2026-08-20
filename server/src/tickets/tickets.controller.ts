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
import { RequirePermission } from '../auth/guards/permissions.guard'
import type { JwtPayload } from '../auth/auth.types'
import { TicketsService } from './tickets.service'
import { CreateTicketDto, ListTicketsDto, ReplyTicketDto, UpdateTicketDto } from './dto/ticket.dto'

@Controller('tickets')
export class TicketsController {
  constructor(@Inject(TicketsService) private readonly tickets: TicketsService) {}

  @Get()
  @RequirePermission('support-tickets')
  list(@Query() query: ListTicketsDto) {
    return this.tickets.list(query)
  }

  /** Status lookup rows for the filter dropdowns. Declared before ':id'. */
  @Get('statuses')
  @RequirePermission('support-tickets')
  statuses() {
    return this.tickets.statuses()
  }

  @Get(':id')
  @RequirePermission('support-tickets')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.tickets.get(id)
  }

  @Post()
  @RequirePermission('support-tickets')
  create(@Body() dto: CreateTicketDto, @Req() req: { user?: JwtPayload }) {
    return this.tickets.create(dto, req.user?.sub)
  }

  @Patch(':id')
  @RequirePermission('support-tickets')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketDto,
    @Req() req: { user?: JwtPayload },
  ) {
    return this.tickets.update(id, dto, req.user?.sub)
  }

  /** Add a message to the thread. */
  @Post(':id/reply')
  @RequirePermission('support-tickets')
  reply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplyTicketDto,
    @Req() req: { user?: JwtPayload },
  ) {
    return this.tickets.reply(id, dto, req.user?.sub)
  }

  @Delete(':id')
  @RequirePermission('support-tickets')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: JwtPayload }) {
    return this.tickets.remove(id, req.user?.sub)
  }
}
