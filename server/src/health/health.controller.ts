import { Controller, Get, Inject } from '@nestjs/common'
import { Public } from '../auth/guards/jwt-auth.guard'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Liveness endpoint. Deliberately does a real query rather than returning a
 * static `true` — an API that answers while its database is unreachable is
 * worse than one that admits it is down.
 */
@Controller('health')
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** Public: monitoring must reach this without credentials. */
  @Public()
  @Get()
  async check() {
    try {
      const [leads, users] = await Promise.all([
        this.prisma.client.lead.count({ where: { deletedAt: null } }),
        this.prisma.client.user.count({ where: { deletedAt: null } }),
      ])
      return { ok: true, database: 'connected', counts: { leads, users } }
    } catch (err) {
      return {
        ok: false,
        database: 'unreachable',
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }
}
