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
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Response } from 'express'
import { RequirePermission } from '../auth/guards/permissions.guard'
import { DocumentsService, MAX_FILE_BYTES } from './documents.service'

@Controller('applications/:id/documents')
export class DocumentsController {
  constructor(@Inject(DocumentsService) private readonly documents: DocumentsService) {}

  @Get()
  @RequirePermission('view-applications')
  list(@Param('id', ParseIntPipe) id: number) {
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
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES } }))
  upload(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type?: string,
  ) {
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
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Param('docId', ParseIntPipe) docId: number,
    @Res() res: Response,
  ) {
    const { stream, name, size } = await this.documents.download(id, docId)
    // Quote the filename and strip quotes from it — an unescaped name would let
    // the client's own string break out of the header value.
    res.setHeader('Content-Disposition', `attachment; filename="${name.replace(/"/g, '')}"`)
    if (size) res.setHeader('Content-Length', String(size))
    stream.pipe(res)
  }

  @Delete(':docId')
  @RequirePermission('file-uploads')
  remove(@Param('id', ParseIntPipe) id: number, @Param('docId', ParseIntPipe) docId: number) {
    return this.documents.remove(id, docId)
  }
}
