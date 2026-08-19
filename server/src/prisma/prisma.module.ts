import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

/**
 * Global so every feature module can inject PrismaService without importing
 * this module explicitly — the database is needed almost everywhere.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
