import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { AuthModule } from './auth/auth.module'
import { LeadsModule } from './leads/leads.module'
import { StudentsModule } from './students/students.module'
import { CatalogModule } from './catalog/catalog.module'
import { ApplicationsModule } from './applications/applications.module'
import { StaffModule } from './staff/staff.module'
import { DashboardModule } from './dashboard/dashboard.module'
import { DocumentsModule } from './documents/documents.module'
import { ActivityModule } from './activity/activity.module'
import { TicketsModule } from './tickets/tickets.module'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'
import { PermissionsGuard } from './auth/guards/permissions.guard'
import { HealthController } from './health/health.controller'
import { PrismaModule } from './prisma/prisma.module'

/**
 * Root module. Feature modules (leads, students, applications) get registered
 * here as each stage lands.
 *
 * Both guards are registered globally so authentication is the default and
 * @Public() is the deliberate exception. Order matters: JwtAuthGuard must run
 * first to populate `request.user`, which PermissionsGuard then reads.
 */
@Module({
  imports: [PrismaModule, AuthModule, LeadsModule, StudentsModule, CatalogModule, ApplicationsModule, StaffModule, DashboardModule, DocumentsModule, ActivityModule, TicketsModule],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
