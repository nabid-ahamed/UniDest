import { Module } from '@nestjs/common'
import { AgentsController, CommissionsController } from './agents.controller'
import { AgentsService } from './agents.service'
import { AuthModule } from '../auth/auth.module'
import { StorageService } from '../documents/storage.service'

@Module({
  imports: [AuthModule],
  controllers: [AgentsController, CommissionsController],
  // StorageService is stateless (a path resolver over the upload root), so
  // listing it here as well as in DocumentsModule is safe.
  providers: [AgentsService, StorageService],
  exports: [AgentsService],
})
export class AgentsModule {}
