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
import { AllowAgent, RequirePermission } from '../auth/guards/permissions.guard'
import { AgentScopeService } from '../auth/agent-scope.service'
import type { JwtPayload } from '../auth/auth.types'
import { CreateLeadDto, ListLeadsDto, UpdateLeadDto } from './dto/lead.dto'
import { LeadsService } from './leads.service'

/**
 * All routes require a valid token (the global JwtAuthGuard) plus the matching
 * permission from the user's role — the same permission ids the frontend's
 * Roles screen already uses (src/mock/roles.ts).
 */
@Controller('leads')
export class LeadsController {
  constructor(
    @Inject(LeadsService) private readonly leads: LeadsService,
    @Inject(AgentScopeService) private readonly scope: AgentScopeService,
  ) {}

  @Get()
  @RequirePermission('view-leads')
  @AllowAgent()
  async list(@Query() query: ListLeadsDto, @Req() req: { user?: JwtPayload }) {
    if (this.scope.isAgent(req.user)) {
      const agentId = await this.scope.requireAgentId(req.user!)
      return this.leads.list({ ...query, agentId: String(agentId) })
    }
    return this.leads.list(query)
  }

  @Get(':id')
  @RequirePermission('view-leads')
  @AllowAgent()
  async get(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: JwtPayload }) {
    await this.scope.assertOwnsLead(req.user, id)
    return this.leads.get(id)
  }

  @Post()
  @RequirePermission('lead-create-update')
  create(@Body() dto: CreateLeadDto, @Req() req: { user?: JwtPayload }) {
    return this.leads.create(dto, req.user?.sub)
  }

  @Patch(':id')
  @RequirePermission('lead-create-update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeadDto,
    @Req() req: { user?: JwtPayload },
  ) {
    return this.leads.update(id, dto, req.user?.sub)
  }

  @Delete(':id')
  @RequirePermission('lead-create-update')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: JwtPayload }) {
    return this.leads.remove(id, req.user?.sub)
  }
}
