import { Module } from '@nestjs/common'
import { DocumentsModule } from '../documents/documents.module'
import { StorageService } from '../documents/storage.service'
import {
  CmsController,
  MediaController,
  ResourcesController,
  WebinarsController,
} from './content.controller'
import { ContentService } from './content.service'

@Module({
  // Imported for MAX_FILE_BYTES and to keep one definition of the upload rules.
  imports: [DocumentsModule],
  controllers: [WebinarsController, CmsController, MediaController, ResourcesController],
  // StorageService is listed here as well as in DocumentsModule. It is a
  // stateless wrapper around one directory, so a second instance costs nothing
  // and avoids exporting it just to share the same constant path.
  providers: [ContentService, StorageService],
})
export class ContentModule {}
