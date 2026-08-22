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
import { AllowAgent, AllowStudent, RequirePermission } from '../auth/guards/permissions.guard'
import { AgentScopeService } from '../auth/agent-scope.service'
import { StudentScopeService } from '../auth/student-scope.service'
import type { JwtPayload } from '../auth/auth.types'
import { ApplicationsService } from './applications.service'
import {
  CreateApplicationDto,
  ListApplicationsDto,
  UpdateApplicationDto,
} from './dto/application.dto'

@Controller('applications')
export class ApplicationsController {
  constructor(
    @Inject(ApplicationsService) private readonly applications: ApplicationsService,
    @Inject(StudentScopeService) private readonly scope: StudentScopeService,
    @Inject(AgentScopeService) private readonly agentScope: AgentScopeService,
  ) {}

  @Get()
  @RequirePermission('view-applications')
  @AllowStudent()
  @AllowAgent()
  async list(@Query() query: ListApplicationsDto, @Req() req: { user?: JwtPayload }) {
    // A student's list is pinned to their own id, overriding any studentId they
    // send — otherwise the portal could page through everyone's applications.
    if (this.scope.isStudent(req.user)) {
      const studentId = await this.scope.requireStudentId(req.user!)
      return this.applications.list({ ...query, studentId: String(studentId) })
    }
    if (this.agentScope.isAgent(req.user)) {
      const agentId = await this.agentScope.requireAgentId(req.user!)
      return this.applications.list({ ...query, agentId: String(agentId) })
    }
    return this.applications.list(query)
  }

  @Get(':id')
  @RequirePermission('view-applications')
  @AllowStudent()
  @AllowAgent()
  async get(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: JwtPayload }) {
    await this.scope.assertOwnsApplication(req.user, id)
    await this.agentScope.assertOwnsApplication(req.user, id)
    return this.applications.get(id)
  }

  /** Status timeline, newest first. */
  @Get(':id/history')
  @RequirePermission('view-applications')
  @AllowStudent()
  @AllowAgent()
  async history(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: JwtPayload }) {
    await this.scope.assertOwnsApplication(req.user, id)
    await this.agentScope.assertOwnsApplication(req.user, id)
    return this.applications.history(id)
  }

  @Post()
  @RequirePermission('application-create-update')
  @AllowAgent()
  async create(@Body() dto: CreateApplicationDto, @Req() req: { user: JwtPayload }) {
    await this.agentScope.assertCanSubmitApplications(req.user)
    const agentId = this.agentScope.isAgent(req.user)
      ? await this.agentScope.requireAgentId(req.user)
      : undefined
    return this.applications.create(dto, req.user.sub, agentId)
  }

  @Patch(':id')
  @RequirePermission('application-create-update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApplicationDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.applications.update(id, dto, req.user.sub)
  }

  @Delete(':id')
  @RequirePermission('application-create-update')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.applications.remove(id)
  }
}
