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
} from '@nestjs/common'
import { RequirePermission } from '../auth/guards/permissions.guard'
import { CreateLeadDto, ListLeadsDto, UpdateLeadDto } from './dto/lead.dto'
import { LeadsService } from './leads.service'

/**
 * All routes require a valid token (the global JwtAuthGuard) plus the matching
 * permission from the user's role — the same permission ids the frontend's
 * Roles screen already uses (src/mock/roles.ts).
 */
@Controller('leads')
export class LeadsController {
  constructor(@Inject(LeadsService) private readonly leads: LeadsService) {}

  @Get()
  @RequirePermission('view-leads')
  list(@Query() query: ListLeadsDto) {
    return this.leads.list(query)
  }

  @Get(':id')
  @RequirePermission('view-leads')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.leads.get(id)
  }

  @Post()
  @RequirePermission('lead-create-update')
  create(@Body() dto: CreateLeadDto) {
    return this.leads.create(dto)
  }

  @Patch(':id')
  @RequirePermission('lead-create-update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeadDto) {
    return this.leads.update(id, dto)
  }

  @Delete(':id')
  @RequirePermission('lead-create-update')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.leads.remove(id)
  }
}
