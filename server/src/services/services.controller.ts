import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common'
import { AllowAgent, AllowStudent, RequirePermission } from '../auth/guards/permissions.guard'
import { AgentScopeService } from '../auth/agent-scope.service'
import { StudentScopeService } from '../auth/student-scope.service'
import type { JwtPayload } from '../auth/auth.types'
import { ServicesService } from './services.service'
import {
  CreateServiceDto,
  ListServicesDto,
  ReplyServiceDto,
  UpdateServiceDto,
} from './dto/service.dto'

/**
 * Additional Services.
 *
 * Three audiences share these routes: staff (gated on the `support-tickets`
 * permission, the closest existing analogue for case work), students, and
 * agents. Scoping is applied from the caller's token rather than from query
 * params, so a scoped caller cannot widen their own view.
 */
@Controller('services')
export class ServicesController {
  constructor(
    @Inject(ServicesService) private readonly services: ServicesService,
    @Inject(StudentScopeService) private readonly studentScope: StudentScopeService,
    @Inject(AgentScopeService) private readonly agentScope: AgentScopeService,
  ) {}

  @Get()
  @RequirePermission('support-tickets')
  @AllowStudent()
  @AllowAgent()
  async list(@Query() query: ListServicesDto, @Req() req: { user?: JwtPayload }) {
    if (this.studentScope.isStudent(req.user)) {
      const studentId = await this.studentScope.requireStudentId(req.user!)
      return this.services.list({ ...query, studentId })
    }
    if (this.agentScope.isAgent(req.user)) {
      const agentId = await this.agentScope.requireAgentId(req.user!)
      return this.services.list({ ...query, agentId })
    }
    return this.services.list(query)
  }

  /** Status lookup rows for the filter dropdowns. Declared before ':id'. */
  @Get('statuses')
  @RequirePermission('support-tickets')
  @AllowStudent()
  @AllowAgent()
  statuses() {
    return this.services.statuses()
  }

  @Get(':id')
  @RequirePermission('support-tickets')
  @AllowStudent()
  @AllowAgent()
  async get(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: JwtPayload }) {
    await this.assertCanRead(id, req.user)
    return this.services.get(id)
  }

  /**
   * Staff raise a request on a student's behalf. Students and agents do not
   * create through this route: an agent creating for an arbitrary `studentNo`
   * would sidestep the referral scope, so that flow needs its own design.
   */
  @Post()
  @RequirePermission('support-tickets')
  create(@Body() dto: CreateServiceDto, @Req() req: { user?: JwtPayload }) {
    return this.services.create(dto, req.user?.sub)
  }

  @Patch(':id')
  @RequirePermission('support-tickets')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceDto,
    @Req() req: { user?: JwtPayload },
  ) {
    return this.services.update(id, dto, req.user?.sub)
  }

  /** Add a message to the thread. Students may reply on their own request. */
  @Post(':id/reply')
  @RequirePermission('support-tickets')
  @AllowStudent()
  async reply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplyServiceDto,
    @Req() req: { user?: JwtPayload },
  ) {
    const isStudent = this.studentScope.isStudent(req.user)
    if (isStudent) await this.assertCanRead(id, req.user)
    return this.services.reply(id, dto, req.user?.sub, !isStudent)
  }

  @Delete(':id')
  @RequirePermission('support-tickets')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: JwtPayload }) {
    return this.services.remove(id, req.user?.sub)
  }

  /**
   * Ownership gate for a single request.
   *
   * Staff fall straight through — they are already gated by permission. The
   * error is deliberately the same whichever way it fails, so a probe cannot
   * tell "someone else's request" from "no such request".
   */
  private async assertCanRead(id: number, user?: JwtPayload): Promise<void> {
    if (this.studentScope.isStudent(user)) {
      const studentId = await this.studentScope.requireStudentId(user!)
      const owner = await this.services.studentIdFor(id)
      if (owner !== studentId) throw new ForbiddenException('Service request not found.')
      return
    }
    if (this.agentScope.isAgent(user)) {
      const agentId = await this.agentScope.requireAgentId(user!)
      const referrer = await this.services.agentIdFor(id)
      if (referrer !== agentId) throw new ForbiddenException('Service request not found.')
    }
  }
}
