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
import {
  BulkStudentsDto,
  ConvertLeadDto,
  CreateStudentDto,
  ListStudentsDto,
  UpdateStudentDto,
} from './dto/student.dto'
import { StudentsService } from './students.service'

@Controller('students')
export class StudentsController {
  constructor(
    @Inject(StudentsService) private readonly students: StudentsService,
    @Inject(AgentScopeService) private readonly scope: AgentScopeService,
  ) {}

  @Get()
  @RequirePermission('view-students')
  @AllowAgent()
  async list(@Query() query: ListStudentsDto, @Req() req: { user?: JwtPayload }) {
    if (this.scope.isAgent(req.user)) {
      const agentId = await this.scope.requireAgentId(req.user!)
      return this.students.list({ ...query, agentId: String(agentId) })
    }
    return this.students.list(query)
  }

  @Get(':id')
  @RequirePermission('view-students')
  @AllowAgent()
  async get(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: JwtPayload }) {
    await this.scope.assertOwnsStudent(req.user, id)
    return this.students.get(id)
  }

  @Post()
  @RequirePermission('view-students')
  @AllowAgent()
  async create(@Body() dto: CreateStudentDto, @Req() req: { user?: JwtPayload }) {
    if (this.scope.isAgent(req.user)) {
      const agentId = await this.scope.requireAgentId(req.user!)
      return this.students.createReferral(dto, agentId, req.user!.sub)
    }
    return this.students.create(dto)
  }

  @Patch(':id')
  @RequirePermission('view-students')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStudentDto) {
    return this.students.update(id, dto)
  }

  @Delete(':id')
  @RequirePermission('view-students')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.students.remove(id)
  }

  /** Permanently remove trashed students. */
  @Post('purge')
  @RequirePermission('view-students')
  purge(@Body() dto: BulkStudentsDto) {
    return this.students.purge(dto.ids)
  }
}

/**
 * Conversion lives on the lead's URL because that is the resource being acted
 * on — the student is the result, not the subject.
 */
@Controller('leads')
export class LeadConversionController {
  constructor(@Inject(StudentsService) private readonly students: StudentsService) {}

  @Post(':id/convert')
  @RequirePermission('lead-create-update')
  convert(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConvertLeadDto,
    @Req() req: { user?: JwtPayload },
  ) {
    return this.students.convertLead(id, dto, req.user?.sub)
  }
}
