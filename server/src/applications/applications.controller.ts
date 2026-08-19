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
import { ApplicationsService } from './applications.service'
import {
  CreateApplicationDto,
  ListApplicationsDto,
  UpdateApplicationDto,
} from './dto/application.dto'

@Controller('applications')
export class ApplicationsController {
  constructor(@Inject(ApplicationsService) private readonly applications: ApplicationsService) {}

  @Get()
  @RequirePermission('view-applications')
  list(@Query() query: ListApplicationsDto) {
    return this.applications.list(query)
  }

  @Get(':id')
  @RequirePermission('view-applications')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.applications.get(id)
  }

  /** Status timeline, newest first. */
  @Get(':id/history')
  @RequirePermission('view-applications')
  history(@Param('id', ParseIntPipe) id: number) {
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
