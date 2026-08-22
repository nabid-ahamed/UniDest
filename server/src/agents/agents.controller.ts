import {
  BadRequestException,
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
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Response } from 'express'
import { MAX_FILE_BYTES } from '../documents/documents.service'
import { RequirePermission } from '../auth/guards/permissions.guard'
import { AllowAgent } from '../auth/guards/permissions.guard'
import { AgentScopeService } from '../auth/agent-scope.service'
import type { JwtPayload } from '../auth/auth.types'
import { AGENT_DOCUMENT_SLOTS, AgentsService, type AgentDocumentSlot } from './agents.service'
import {
  CreateAgentDto,
  CreateCommissionDto,
  ListAgentsDto,
  ListCommissionsDto,
  ListReferralsDto,
  UpdateAgentDto,
  UpdateCommissionDto,
  UpdateSubmissionSettingDto,
} from './dto/agent.dto'

/** Reject an unknown slot with a 400 rather than letting it reach a lookup. */
function parseSlot(slot: string): AgentDocumentSlot {
  if ((AGENT_DOCUMENT_SLOTS as readonly string[]).includes(slot)) return slot as AgentDocumentSlot
  throw new BadRequestException(
    `Unknown document slot "${slot}". Expected one of: ${AGENT_DOCUMENT_SLOTS.join(', ')}.`,
  )
}

@Controller('agents')
export class AgentsController {
  constructor(@Inject(AgentsService) private readonly agents: AgentsService) {}

  @Get()
  @RequirePermission('agent-management')
  list(@Query() query: ListAgentsDto) {
    return this.agents.list(query)
  }

  @Get('referrals')
  @RequirePermission('agent-management')
  referrals(@Query() query: ListReferralsDto) {
    return this.agents.listReferrals(query)
  }

  @Get('settings/submission')
  @RequirePermission('agent-management')
  submissionSetting() {
    return this.agents.submissionSetting()
  }

  @Patch('settings/submission')
  @RequirePermission('agent-management')
  updateSubmissionSetting(@Body() dto: UpdateSubmissionSettingDto, @Req() req: { user?: JwtPayload }) {
    return this.agents.updateSubmissionSetting(dto, req.user?.sub)
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

  /**
   * Provision or reset the agent's portal login.
   *
   * Returns a one-time password rather than sending mail — the project has no
   * mail transport yet.
   */
  @Post(':id/invite')
  @RequirePermission('agent-management')
  invite(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: JwtPayload }) {
    return this.agents.invite(id, req.user?.sub)
  }

  /**
   * Attach a document (logo / idProof / incorporationCert).
   *
   * Uploading over an existing slot replaces it and deletes the old blob.
   */
  @Post(':id/documents/:slot')
  @RequirePermission('agent-management')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES } }))
  uploadDocument(
    @Param('id', ParseIntPipe) id: number,
    @Param('slot') slot: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: { user?: JwtPayload },
  ) {
    return this.agents.uploadDocument(id, parseSlot(slot), file, req.user?.sub)
  }

  /** Served through an authenticated route, never a static mount. */
  @Get(':id/documents/:slot/file')
  @RequirePermission('agent-management')
  async documentFile(
    @Param('id', ParseIntPipe) id: number,
    @Param('slot') slot: string,
    @Res() res: Response,
  ) {
    const { stream, name } = await this.agents.documentFile(id, parseSlot(slot))
    res.setHeader('Content-Disposition', `inline; filename="${name.replace(/"/g, '')}"`)
    stream.pipe(res)
  }

  @Delete(':id/documents/:slot')
  @RequirePermission('agent-management')
  removeDocument(
    @Param('id', ParseIntPipe) id: number,
    @Param('slot') slot: string,
    @Req() req: { user?: JwtPayload },
  ) {
    return this.agents.removeDocument(id, parseSlot(slot), req.user?.sub)
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
  constructor(
    @Inject(AgentsService) private readonly agents: AgentsService,
    @Inject(AgentScopeService) private readonly scope: AgentScopeService,
  ) {}

  @Get()
  @RequirePermission('commission')
  @AllowAgent()
  async list(@Query() query: ListCommissionsDto, @Req() req: { user?: JwtPayload }) {
    if (this.scope.isAgent(req.user)) {
      const agentId = await this.scope.requireAgentId(req.user!)
      return this.agents.listCommissions({ ...query, agentId: String(agentId) })
    }
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
