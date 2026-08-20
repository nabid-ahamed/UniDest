import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ActivityService } from '../activity/activity.service'
import type { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcement.dto'

const TENANT_ID = 1n

type Category = 'lead' | 'student' | 'application' | 'announcement' | 'ticket'

/**
 * Which activity actions are worth telling someone about, and how each reads in
 * the bell dropdown.
 *
 * Deliberately a small allow-list: the activity log records everything, and a
 * notification for every field edit would be noise nobody reads. Anything not
 * listed here is audit-only.
 */
const NOTABLE: Record<string, { category: Category; title: string; link: (id: number) => string }> = {
  'lead.created': { category: 'lead', title: 'New lead', link: (id) => `/leads/${id}` },
  'lead.converted': { category: 'lead', title: 'Lead converted', link: (id) => `/leads/${id}` },
  'student.created': { category: 'student', title: 'New student', link: (id) => `/students/${id}` },
  'application.created': {
    category: 'application',
    title: 'New application',
    link: (id) => `/applications/${id}`,
  },
  'application.status_changed': {
    category: 'application',
    title: 'Application status changed',
    link: (id) => `/applications/${id}`,
  },
  'ticket.created': { category: 'ticket', title: 'New support ticket', link: (id) => `/support-tickets/${id}` },
  'ticket.replied': { category: 'ticket', title: 'Ticket reply', link: (id) => `/support-tickets/${id}` },
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "30 Oct 2025 10:00 AM" — the format the announcement list renders. */
function fmtDateTime(d: Date): string {
  const h24 = d.getHours()
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${h12}:${String(d.getMinutes()).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`
}

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ActivityService) private readonly activity: ActivityService,
  ) {}

  private get db() {
    return this.prisma.client
  }

  /**
   * The notification feed for one user.
   *
   * Derived from the activity log plus published announcements rather than
   * stored as its own rows. The log already records these events; a parallel
   * notifications table would be a second copy to keep in sync, and the two
   * would eventually disagree.
   */
  async feed(userPublicId: string | undefined, limit = 30) {
    const userId = userPublicId ? await this.resolveUserId(userPublicId) : null

    const [events, announcements, reads] = await Promise.all([
      this.db.activityLog.findMany({
        where: { tenantId: TENANT_ID, action: { in: Object.keys(NOTABLE) } },
        orderBy: { createdAt: 'desc' },
        take: Math.min(200, limit * 3),
      }),
      this.db.announcement.findMany({
        where: { tenantId: TENANT_ID, deletedAt: null, publishedAt: { lte: new Date() } },
        orderBy: { publishedAt: 'desc' },
        take: limit,
      }),
      userId
        ? this.db.notificationRead.findMany({ where: { userId }, select: { notificationKey: true } })
        : Promise.resolve([]),
    ])

    const readKeys = new Set(reads.map((r) => r.notificationKey))

    const fromEvents = events.map((e) => {
      const spec = NOTABLE[e.action]
      const meta = (e.meta ?? {}) as Record<string, unknown>
      const key = `${e.entityType}-${Number(e.entityId)}-${e.action}`
      return {
        id: key,
        category: spec.category,
        title: spec.title,
        message: this.describe(e.action, meta),
        time: e.createdAt.getTime(),
        link: spec.link(Number(e.entityId)),
        read: readKeys.has(key),
      }
    })

    const fromAnnouncements = announcements.map((a) => {
      const key = `ann-${Number(a.id)}`
      return {
        id: key,
        category: 'announcement' as Category,
        title: 'Announcement',
        message: a.title,
        time: a.publishedAt.getTime(),
        link: `/announcements/${Number(a.id)}`,
        read: readKeys.has(key),
      }
    })

    return [...fromEvents, ...fromAnnouncements]
      .sort((a, b) => b.time - a.time)
      .slice(0, limit)
  }

  async unreadCount(userPublicId?: string): Promise<number> {
    const items = await this.feed(userPublicId, 100)
    return items.filter((i) => !i.read).length
  }

  /**
   * Mark one notification read for this user.
   *
   * Upsert rather than insert: the client may mark the same item twice (two
   * tabs, a double click), and that should be idempotent rather than a 500.
   */
  async markRead(userPublicId: string, key: string) {
    const userId = await this.resolveUserId(userPublicId)
    if (!userId) throw new NotFoundException('User not found.')
    await this.db.notificationRead.upsert({
      where: { userId_notificationKey: { userId, notificationKey: key } },
      update: {},
      create: { tenantId: TENANT_ID, userId, notificationKey: key },
    })
    return { ok: true }
  }

  /** Mark everything currently in the feed as read. */
  async markAllRead(userPublicId: string) {
    const userId = await this.resolveUserId(userPublicId)
    if (!userId) throw new NotFoundException('User not found.')

    const items = await this.feed(userPublicId, 100)
    const unread = items.filter((i) => !i.read)
    if (unread.length) {
      await this.db.notificationRead.createMany({
        data: unread.map((i) => ({ tenantId: TENANT_ID, userId, notificationKey: i.id })),
        skipDuplicates: true,
      })
    }
    return { ok: true, marked: unread.length }
  }

  // ---- Announcements -------------------------------------------------------

  async listAnnouncements() {
    const rows = await this.db.announcement.findMany({
      where: { tenantId: TENANT_ID, deletedAt: null },
      include: { createdBy: { select: { name: true } } },
      orderBy: { publishedAt: 'desc' },
    })
    return rows.map((a) => this.announcementDto(a))
  }

  async getAnnouncement(id: number) {
    const a = await this.db.announcement.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      include: { createdBy: { select: { name: true } } },
    })
    if (!a) throw new NotFoundException(`Announcement ${id} not found.`)
    return this.announcementDto(a)
  }

  async createAnnouncement(dto: CreateAnnouncementDto, actorPublicId?: string) {
    const actorId = actorPublicId ? await this.resolveUserId(actorPublicId) : null

    const created = await this.db.$transaction(async (tx) => {
      const a = await tx.announcement.create({
        data: {
          tenantId: TENANT_ID,
          title: dto.title,
          message: dto.message,
          area: dto.area ?? 'All',
          createdById: actorId,
          publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
        },
        include: { createdBy: { select: { name: true } } },
      })
      await this.activity.recordWithActorId(
        {
          action: 'announcement.created',
          entity: 'announcement',
          entityId: a.id,
          meta: { title: a.title, area: a.area },
        },
        actorId,
        tx,
      )
      return a
    })
    return this.announcementDto(created)
  }

  async updateAnnouncement(id: number, dto: UpdateAnnouncementDto, actorPublicId?: string) {
    await this.getAnnouncement(id)
    const actorId = actorPublicId ? await this.resolveUserId(actorPublicId) : null

    const updated = await this.db.$transaction(async (tx) => {
      const a = await tx.announcement.update({
        where: { id: BigInt(id) },
        data: {
          title: dto.title ?? undefined,
          message: dto.message ?? undefined,
          area: dto.area ?? undefined,
          publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
        },
        include: { createdBy: { select: { name: true } } },
      })
      await this.activity.recordWithActorId(
        {
          action: 'announcement.updated',
          entity: 'announcement',
          entityId: BigInt(id),
          meta: { fields: Object.keys(dto) },
        },
        actorId,
        tx,
      )
      return a
    })
    return this.announcementDto(updated)
  }

  async removeAnnouncement(id: number, actorPublicId?: string) {
    await this.getAnnouncement(id)
    const actorId = actorPublicId ? await this.resolveUserId(actorPublicId) : null
    await this.db.$transaction(async (tx) => {
      await tx.announcement.update({ where: { id: BigInt(id) }, data: { deletedAt: new Date() } })
      await this.activity.recordWithActorId(
        { action: 'announcement.deleted', entity: 'announcement', entityId: BigInt(id) },
        actorId,
        tx,
      )
    })
    return { ok: true }
  }

  /** A one-line summary of an event, from whatever its meta carries. */
  private describe(action: string, meta: Record<string, unknown>): string {
    if (typeof meta.name === 'string') return meta.name
    if (typeof meta.subject === 'string') return meta.subject
    if (typeof meta.studentNo === 'string') return String(meta.studentNo)
    if (typeof meta.to === 'string') return `Now: ${meta.to}`
    return action.replace(/[._]/g, ' ')
  }

  private async resolveUserId(publicId: string): Promise<bigint | null> {
    const user = await this.db.user.findFirst({
      where: { publicId, tenantId: TENANT_ID },
      select: { id: true },
    })
    return user?.id ?? null
  }

  private announcementDto(a: {
    id: bigint
    publicId: string
    title: string
    message: string
    area: string
    publishedAt: Date
    createdBy: { name: string } | null
  }) {
    return {
      id: Number(a.id),
      publicId: a.publicId,
      title: a.title,
      message: a.message,
      area: a.area,
      createdBy: a.createdBy?.name ?? 'System',
      publishedAt: a.publishedAt.toISOString(),
      publishedAtLabel: fmtDateTime(a.publishedAt),
    }
  }
}
