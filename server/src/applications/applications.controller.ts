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
import { AllowStudent, RequirePermission } from '../auth/guards/permissions.guard'
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
  ) {}

  @Get()
  @RequirePermission('view-applications')
  @AllowStudent()
  async list(@Query() query: ListApplicationsDto, @Req() req: { user?: JwtPayload }) {
    // A student's list is pinned to their own id, overriding any studentId they
    // send — otherwise the portal could page through everyone's applications.
    if (this.scope.isStudent(req.user)) {
      const studentId = await this.scope.requireStudentId(req.user!)
      return this.applications.list({ ...query, studentId: String(studentId) })
    }
    return this.applications.list(query)
  }

  @Get(':id')
  @RequirePermission('view-applications')
  @AllowStudent()
  async get(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: JwtPayload }) {
    await this.scope.assertOwnsApplication(req.user, id)
    return this.applications.get(id)
  }

  /** Status timeline, newest first. */
  @Get(':id/history')
  @RequirePermission('view-applications')
  @AllowStudent()
  async history(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: JwtPayload }) {
    await this.scope.assertOwnsApplication(req.user, id)
    return this.applications.history(id)
  }

  @Post()
  @RequirePermission('application-create-update')
  create(@Body() dto: CreateApplicationDto, @Req() req: { user: JwtPayload }) {
    return this.applications.create(dto, req.user.sub)
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
