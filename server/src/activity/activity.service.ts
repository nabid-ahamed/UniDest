import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const TENANT_ID = 1n

/** The entities the log can describe. Kept narrow so `entityType` stays queryable. */
export type ActivityEntity = 'lead' | 'student' | 'application' | 'staff' | 'document' | 'ticket' | 'invoice' | 'agent' | 'commission' | 'announcement' | 'webinar' | 'content'

/**
 * Minimal surface of a Prisma client that can write the log — satisfied both by
 * `prisma.client` and by the `tx` handle inside `$transaction`. Typing it this
 * way is what lets callers pass their transaction in.
 */
type LogWriter = {
  activityLog: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>
  }
}

export interface RecordActivity {
  action: string
  entity: ActivityEntity
  entityId: bigint | number
  /** users.publicId from the JWT. Omit for system-generated entries. */
  actorPublicId?: string
  meta?: Record<string, unknown>
}

@Injectable()
export class ActivityService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private get db() {
    return this.prisma.client
  }

  /**
   * Write one audit row.
   *
   * Pass `tx` whenever the change being logged is itself in a transaction — the
   * audit row then commits or rolls back with it. Logging outside the
   * transaction would let a failed write leave an entry claiming it happened,
   * which is worse than no log at all because it reads as authoritative.
   *
   * Resolving the actor costs a lookup, so callers that already know the numeric
   * id can pass `actorId` directly via `recordWithActorId`.
   */
  async record(entry: RecordActivity, tx?: LogWriter): Promise<void> {
    const userId = entry.actorPublicId ? await this.resolveUserId(entry.actorPublicId) : null
    await this.recordWithActorId(entry, userId, tx)
  }

  /** As `record`, but for callers that already resolved the acting user. */
  async recordWithActorId(
    entry: Omit<RecordActivity, 'actorPublicId'>,
    actorId: bigint | null,
    tx?: LogWriter,
  ): Promise<void> {
    const writer = tx ?? (this.db as unknown as LogWriter)
    await writer.activityLog.create({
      data: {
        tenantId: TENANT_ID,
        userId: actorId,
        action: entry.action,
        entityType: entry.entity,
        entityId: BigInt(entry.entityId),
        meta: entry.meta ?? {},
      },
    })
  }

  /**
   * Entries for one record, newest first.
   *
   * Capped rather than paginated: these feed a detail-page panel, not a report.
   * A record with thousands of entries is a reporting question, and answering it
   * here would let one request pull an unbounded result set.
   */
  async forEntity(entity: ActivityEntity, entityId: number, limit = 50) {
    const rows = await this.db.activityLog.findMany({
      where: { tenantId: TENANT_ID, entityType: entity, entityId: BigInt(entityId) },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(200, Math.max(1, limit)),
    })
    return rows.map((r) => this.toDto(r))
  }

  /** Recent activity across everything — the admin-wide feed. */
  async recent(limit = 50) {
    const rows = await this.db.activityLog.findMany({
      where: { tenantId: TENANT_ID },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(200, Math.max(1, limit)),
    })
    return rows.map((r) => this.toDto(r))
  }

  private async resolveUserId(publicId: string): Promise<bigint | null> {
    const user = await this.db.user.findFirst({
      where: { publicId, tenantId: TENANT_ID },
      select: { id: true },
    })
    return user?.id ?? null
  }

  private toDto(r: {
    id: bigint
    action: string
    entityType: string
    entityId: bigint
    meta: unknown
    createdAt: Date
    user: { name: string } | null
  }) {
    return {
      id: Number(r.id),
      action: r.action,
      entityType: r.entityType,
      entityId: Number(r.entityId),
      meta: (r.meta ?? {}) as Record<string, unknown>,
      // 'System' rather than an empty string: an entry with no actor was
      // genuinely not performed by a person, and the UI should say so.
      actor: r.user?.name ?? 'System',
      at: r.createdAt.toISOString(),
    }
  }
}
