import { Module } from '@nestjs/common'
import { HealthController } from './health/health.controller'
import { PrismaModule } from './prisma/prisma.module'

/**
 * Root module. Feature modules (auth, leads, students, applications) get
 * registered here as each stage lands.
 */
@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
})
export class AppModule {}
