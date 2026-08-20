/// <reference types="multer" />
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
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Response } from 'express'
import { AllowStudent, RequirePermission } from '../auth/guards/permissions.guard'
import type { JwtPayload } from '../auth/auth.types'
import { MAX_FILE_BYTES } from '../documents/documents.service'
import { ContentService } from './content.service'
import {
  CreateCmsDto,
  CreateWebinarDto,
  EnrollWebinarDto,
  SubscribeDto,
  UpdateCmsDto,
  UpdateWebinarDto,
} from './dto/content.dto'

type ReqUser = { user?: JwtPayload }

/** Strip quotes so a client-supplied filename cannot break out of the header. */
const safeName = (name: string) => name.replace(/"/g, '')

@Controller('webinars')
export class WebinarsController {
  constructor(@Inject(ContentService) private readonly content: ContentService) {}

  /** Students see webinars in the portal, so reading is open to them. */
  @Get()
  @AllowStudent()
  list() {
    return this.content.listWebinars()
  }

  @Get(':id')
  @AllowStudent()
  get(@Param('id', ParseIntPipe) id: number) {
    return this.content.getWebinar(id)
  }

  @Get(':id/enrollments')
  @RequirePermission('cms-events')
  enrollments(@Param('id', ParseIntPipe) id: number) {
    return this.content.listEnrollments(id)
  }

  @Post(':id/enroll')
  @AllowStudent()
  enroll(@Param('id', ParseIntPipe) id: number, @Body() dto: EnrollWebinarDto) {
    return this.content.enroll(id, dto)
  }

  @Post()
  @RequirePermission('cms-events')
  create(@Body() dto: CreateWebinarDto, @Req() req: ReqUser) {
    return this.content.createWebinar(dto, req.user?.sub)
  }

  @Patch(':id')
  @RequirePermission('cms-events')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWebinarDto, @Req() req: ReqUser) {
    return this.content.updateWebinar(id, dto, req.user?.sub)
  }

  @Delete(':id')
  @RequirePermission('cms-events')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: ReqUser) {
    return this.content.removeWebinar(id, req.user?.sub)
  }
}

/** Blog posts, static pages and country entries — one table, three kinds. */
@Controller('cms')
export class CmsController {
  constructor(@Inject(ContentService) private readonly content: ContentService) {}

  // Newsletter routes are declared before ':kind' so they are not swallowed by it.
  @Get('newsletter')
  @RequirePermission('cms-articles')
  subscribers() {
    return this.content.listSubscribers()
  }

  @Post('newsletter')
  @AllowStudent()
  subscribe(@Body() dto: SubscribeDto) {
    return this.content.subscribe(dto.email, dto.name)
  }

  @Delete('newsletter/:id')
  @RequirePermission('cms-articles')
  unsubscribe(@Param('id', ParseIntPipe) id: number) {
    return this.content.unsubscribe(id)
  }

  @Get(':kind')
  @AllowStudent()
  list(@Param('kind') kind: string, @Query('status') status?: string) {
    return this.content.listCms(kind, status)
  }

  @Get(':kind/:id')
  @AllowStudent()
  get(@Param('id', ParseIntPipe) id: number) {
    return this.content.getCms(id)
  }

  @Post()
  @RequirePermission('cms-articles')
  create(@Body() dto: CreateCmsDto, @Req() req: ReqUser) {
    return this.content.createCms(dto, req.user?.sub)
  }

  @Patch(':kind/:id')
  @RequirePermission('cms-articles')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCmsDto, @Req() req: ReqUser) {
    return this.content.updateCms(id, dto, req.user?.sub)
  }

  @Delete(':kind/:id')
  @RequirePermission('cms-articles')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: ReqUser) {
    return this.content.removeCms(id, req.user?.sub)
  }
}

@Controller('media')
export class MediaController {
  constructor(@Inject(ContentService) private readonly content: ContentService) {}

  @Get()
  @RequirePermission('file-uploads')
  list(@Query('type') type?: string) {
    return this.content.listMedia(type)
  }

  @Post()
  @RequirePermission('file-uploads')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES } }))
  upload(@UploadedFile() file: Express.Multer.File, @Req() req: ReqUser) {
    return this.content.uploadMedia(file, req.user?.sub)
  }

  /** Served through an authenticated route, never a static mount. */
  @Get(':id/file')
  @RequirePermission('file-uploads')
  async file(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const { stream, name, size } = await this.content.mediaFile(id)
    res.setHeader('Content-Disposition', `inline; filename="${safeName(name)}"`)
    if (size) res.setHeader('Content-Length', String(size))
    stream.pipe(res)
  }

  @Delete(':id')
  @RequirePermission('file-uploads')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.content.removeMedia(id)
  }
}

@Controller('resources')
export class ResourcesController {
  constructor(@Inject(ContentService) private readonly content: ContentService) {}

  /** Students download these, so reading is open to them. */
  @Get('categories')
  @AllowStudent()
  categories() {
    return this.content.listResourceCategories()
  }

  @Get()
  @AllowStudent()
  list(@Query('categoryId') categoryId?: string) {
    return this.content.listResources(categoryId ? Number(categoryId) : undefined)
  }

  @Post()
  @RequirePermission('file-uploads')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES } }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title?: string; categoryId?: string; relatedCourseId?: string },
    @Req() req: ReqUser,
  ) {
    return this.content.uploadResource(file, body, req.user?.sub)
  }

  @Get(':id/file')
  @AllowStudent()
  async file(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const { stream, name, size } = await this.content.resourceFile(id)
    res.setHeader('Content-Disposition', `attachment; filename="${safeName(name)}"`)
    if (size) res.setHeader('Content-Length', String(size))
    stream.pipe(res)
  }

  @Delete(':id')
  @RequirePermission('file-uploads')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.content.removeResource(id)
  }
}
