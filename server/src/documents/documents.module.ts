import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { DocumentsController } from './documents.controller'
import { DocumentsService } from './documents.service'
import { StorageService } from './storage.service'

@Module({
  imports: [AuthModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, StorageService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
