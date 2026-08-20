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
import { AgentsService } from './agents.service'
import {
  CreateAgentDto,
  CreateCommissionDto,
  ListAgentsDto,
  ListCommissionsDto,
  UpdateAgentDto,
  UpdateCommissionDto,
} from './dto/agent.dto'

@Controller('agents')
export class AgentsController {
  constructor(@Inject(AgentsService) private readonly agents: AgentsService) {}

  @Get()
  @RequirePermission('agent-management')
  list(@Query() query: ListAgentsDto) {
    return this.agents.list(query)
  }

  @Get(':id')
  @RequirePermission('agent-management')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.agents.get(id)
  }

  @Post()
  @RequirePermission('agent-management')
  create(@Body() dto: CreateAgentDto, @Req() req: { user?: JwtPayload }) {
    return this.agents.create(dto, req.user?.sub)
  }

  @Patch(':id')
  @RequirePermission('agent-management')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAgentDto,
    @Req() req: { user?: JwtPayload },
  ) {
    return this.agents.update(id, dto, req.user?.sub)
  }

  @Delete(':id')
  @RequirePermission('agent-management')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: JwtPayload }) {
    return this.agents.remove(id, req.user?.sub)
  }
}

/** Commissions are money, so they are gated on `commission`, not agent admin. */
@Controller('commissions')
export class CommissionsController {
  constructor(@Inject(AgentsService) private readonly agents: AgentsService) {}

  @Get()
  @RequirePermission('commission')
  list(@Query() query: ListCommissionsDto) {
    return this.agents.listCommissions(query)
  }

  @Get('statuses')
  @RequirePermission('commission')
  statuses() {
    return this.agents.commissionStatuses()
  }

  @Post()
  @RequirePermission('commission')
  create(@Body() dto: CreateCommissionDto, @Req() req: { user?: JwtPayload }) {
    return this.agents.createCommission(dto, req.user?.sub)
  }

  @Patch(':id')
  @RequirePermission('commission')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommissionDto,
    @Req() req: { user?: JwtPayload },
  ) {
    return this.agents.updateCommission(id, dto, req.user?.sub)
  }
}
