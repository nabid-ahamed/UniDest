/// <reference types="multer" />
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Request,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Response } from 'express'
import { AllowStudent, RequirePermission } from '../auth/guards/permissions.guard'
import { StudentScopeService } from '../auth/student-scope.service'
import type { JwtPayload } from '../auth/auth.types'
import { DocumentsService, MAX_FILE_BYTES } from './documents.service'

/** Shape Passport puts on the request after the JWT strategy runs. */
type Req = { user?: JwtPayload }

@Controller('applications/:id/documents')
export class DocumentsController {
  constructor(
    @Inject(DocumentsService) private readonly documents: DocumentsService,
    @Inject(StudentScopeService) private readonly scope: StudentScopeService,
  ) {}

  @Get()
  @RequirePermission('view-applications')
  @AllowStudent()
  async list(@Param('id', ParseIntPipe) id: number, @Request() req: Req) {
    await this.scope.assertOwnsApplication(req.user, id)
    return this.documents.list(id)
  }

  /**
   * Multipart upload of a single file under the field name "file".
   *
   * Memory storage, not Multer's disk storage: the file must be validated
   * (extension, size) before anything is written, and letting Multer name and
   * place it first would put an attacker-supplied filename on the filesystem.
   * The size limit is enforced here too so oversized bodies are rejected during
   * parsing rather than after being buffered whole.
   */
  @Post()
  @RequirePermission('file-uploads')
  @AllowStudent()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES } }))
  async upload(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: Req,
    @Body('type') type?: string,
  ) {
    await this.scope.assertOwnsApplication(req.user, id)
    return this.documents.upload(id, file, type)
  }

  /**
   * Stream the file to an authenticated caller.
   *
   * Served through this route rather than a static folder on purpose: these are
   * passports and bank statements, and a static mount would make every stored
   * file readable by anyone who guesses or leaks the path.
   */
  @Get(':docId')
  @RequirePermission('view-applications')
  @AllowStudent()
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Param('docId', ParseIntPipe) docId: number,
    @Res() res: Response,
    @Request() req: Req,
  ) {
    await this.scope.assertOwnsApplication(req.user, id)
    const { stream, name, size } = await this.documents.download(id, docId)
    // Quote the filename and strip quotes from it — an unescaped name would let
    // the client's own string break out of the header value.
    res.setHeader('Content-Disposition', `attachment; filename="${name.replace(/"/g, '')}"`)
    if (size) res.setHeader('Content-Length', String(size))
    stream.pipe(res)
  }

  @Delete(':docId')
  @RequirePermission('file-uploads')
  @AllowStudent()
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Param('docId', ParseIntPipe) docId: number,
    @Request() req: Req,
  ) {
    await this.scope.assertOwnsApplication(req.user, id)
    return this.documents.remove(id, docId)
  }
}
