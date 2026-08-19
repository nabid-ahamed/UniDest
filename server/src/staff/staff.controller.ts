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
import { CreateStaffDto, ListStaffDto, UpdateStaffDto } from './dto/staff.dto'
import { StaffService } from './staff.service'

@Controller('staff')
export class StaffController {
  constructor(@Inject(StaffService) private readonly staff: StaffService) {}

  @Get()
  list(@Query() query: ListStaffDto) {
    return this.staff.list(query)
  }

  /**
   * Assignable staff for the "Assign to" pickers. No permission gate: anyone
   * who can open leads or students needs to see who a record can go to.
   */
  @Get('assignable')
  assignable() {
    return this.staff.assignable()
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.staff.get(id)
  }

  @Post()
  create(@Body() dto: CreateStaffDto) {
    return this.staff.create(dto)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStaffDto) {
    return this.staff.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.staff.remove(id)
  }
}

/** Roles and branches are read-only reference data in this phase. */
@Controller()
export class OrgController {
  constructor(@Inject(StaffService) private readonly staff: StaffService) {}

  @Get('roles')
  roles() {
    return this.staff.roles()
  }

  @Get('branches')
  branches() {
    return this.staff.branches()
  }
}
