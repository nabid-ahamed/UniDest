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
  constructor(@Inject(StudentsService) private readonly students: StudentsService) {}

  @Get()
  @RequirePermission('view-students')
  list(@Query() query: ListStudentsDto) {
    return this.students.list(query)
  }

  @Get(':id')
  @RequirePermission('view-students')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.students.get(id)
  }

  @Post()
  @RequirePermission('view-students')
  create(@Body() dto: CreateStudentDto) {
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
