import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ActivityService } from '../activity/activity.service'
import { StorageService } from '../documents/storage.service'
import type {
  CreateCmsDto,
  CreateWebinarDto,
  EnrollWebinarDto,
  UpdateCmsDto,
  UpdateWebinarDto,
} from './dto/content.dto'

const TENANT_ID = 1n

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const fmtDay = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`

/** "11-06-2026 02:31 PM" — the format the webinar list renders. */
function fmtWebinarDate(d: Date): string {
  const h24 = d.getHours()
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()} ${String(h12).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`
}

/** URL-safe slug from a title. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

@Injectable()
export class ContentService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ActivityService) private readonly activity: ActivityService,
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  private get db() {
    return this.prisma.client
  }

  // ---- Webinars ------------------------------------------------------------

  async listWebinars() {
    const rows = await this.db.webinar.findMany({
      where: { tenantId: TENANT_ID, deletedAt: null },
      include: { _count: { select: { enrollments: true } } },
      orderBy: { startsAt: 'desc' },
    })
    return rows.map((w) => this.webinarDto(w))
  }

  async getWebinar(id: number) {
    const w = await this.db.webinar.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      include: { _count: { select: { enrollments: true } } },
    })
    if (!w) throw new NotFoundException(`Webinar ${id} not found.`)
    return this.webinarDto(w)
  }

  async createWebinar(dto: CreateWebinarDto, actorPublicId?: string) {
    const actorId = await this.resolveActorId(actorPublicId)
    const created = await this.db.$transaction(async (tx) => {
      const w = await tx.webinar.create({
        data: {
          tenantId: TENANT_ID,
          topic: dto.topic,
          startsAt: new Date(dto.startsAt),
          venue: dto.venue ?? null,
          audienceType: dto.audienceType ?? 'Student',
          webinarLink: dto.webinarLink ?? null,
          description: dto.description ?? null,
          notifiedEmail: dto.notifiedEmail ?? null,
        },
        include: { _count: { select: { enrollments: true } } },
      })
      await this.activity.recordWithActorId(
        { action: 'webinar.created', entity: 'webinar', entityId: w.id, meta: { topic: w.topic } },
        actorId,
        tx,
      )
      return w
    })
    return this.webinarDto(created)
  }

  async updateWebinar(id: number, dto: UpdateWebinarDto, actorPublicId?: string) {
    await this.getWebinar(id)
    const actorId = await this.resolveActorId(actorPublicId)
    const updated = await this.db.$transaction(async (tx) => {
      const w = await tx.webinar.update({
        where: { id: BigInt(id) },
        data: {
          topic: dto.topic ?? undefined,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
          venue: dto.venue ?? undefined,
          audienceType: dto.audienceType ?? undefined,
          webinarLink: dto.webinarLink ?? undefined,
          description: dto.description ?? undefined,
          notifiedEmail: dto.notifiedEmail ?? undefined,
        },
        include: { _count: { select: { enrollments: true } } },
      })
      await this.activity.recordWithActorId(
        {
          action: 'webinar.updated',
          entity: 'webinar',
          entityId: BigInt(id),
          meta: { fields: Object.keys(dto) },
        },
        actorId,
        tx,
      )
      return w
    })
    return this.webinarDto(updated)
  }

  async removeWebinar(id: number, actorPublicId?: string) {
    await this.getWebinar(id)
    const actorId = await this.resolveActorId(actorPublicId)
    await this.db.$transaction(async (tx) => {
      await tx.webinar.update({ where: { id: BigInt(id) }, data: { deletedAt: new Date() } })
      await this.activity.recordWithActorId(
        { action: 'webinar.deleted', entity: 'webinar', entityId: BigInt(id) },
        actorId,
        tx,
      )
    })
    return { ok: true }
  }

  async listEnrollments(webinarId: number) {
    await this.getWebinar(webinarId)
    const rows = await this.db.webinarEnrollment.findMany({
      where: { tenantId: TENANT_ID, webinarId: BigInt(webinarId) },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map((e) => ({
      id: Number(e.id),
      name: e.name,
      email: e.email,
      phone: e.phone ?? '',
      userType: e.userType,
      enrolledOn: fmtDay(e.createdAt),
    }))
  }

  /** Sign someone up. The unique (webinar, email) pair makes this idempotent. */
  async enroll(webinarId: number, dto: EnrollWebinarDto) {
    await this.getWebinar(webinarId)
    const existing = await this.db.webinarEnrollment.findFirst({
      where: { webinarId: BigInt(webinarId), email: dto.email.toLowerCase().trim() },
    })
    if (existing) throw new BadRequestException('That email is already enrolled in this webinar.')

    const created = await this.db.webinarEnrollment.create({
      data: {
        tenantId: TENANT_ID,
        webinarId: BigInt(webinarId),
        name: dto.name,
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone ?? null,
        userType: dto.userType ?? 'Student',
      },
    })
    return {
      id: Number(created.id),
      name: created.name,
      email: created.email,
      phone: created.phone ?? '',
      userType: created.userType,
      enrolledOn: fmtDay(created.createdAt),
    }
  }

  // ---- CMS -----------------------------------------------------------------

  async listCms(kind: string, status?: string) {
    const rows = await this.db.cmsContent.findMany({
      where: {
        tenantId: TENANT_ID,
        kind,
        deletedAt: null,
        ...(status ? { status } : {}),
      },
      include: { author: { select: { name: true } } },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    })
    return rows.map((c) => this.cmsDto(c))
  }

  async getCms(id: number) {
    const c = await this.db.cmsContent.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      include: { author: { select: { name: true } } },
    })
    if (!c) throw new NotFoundException(`Content ${id} not found.`)
    return this.cmsDto(c)
  }

  async createCms(dto: CreateCmsDto, actorPublicId?: string) {
    const actorId = await this.resolveActorId(actorPublicId)
    const slug = dto.slug?.trim() || slugify(dto.title)

    const clash = await this.db.cmsContent.findFirst({
      where: { tenantId: TENANT_ID, kind: dto.kind, slug, deletedAt: null },
    })
    if (clash) throw new BadRequestException(`A ${dto.kind} with the slug "${slug}" already exists.`)

    const created = await this.db.$transaction(async (tx) => {
      const c = await tx.cmsContent.create({
        data: {
          tenantId: TENANT_ID,
          kind: dto.kind,
          title: dto.title,
          slug,
          excerpt: dto.excerpt ?? null,
          body: dto.body ?? '',
          coverUrl: dto.coverUrl ?? null,
          status: dto.status ?? 'Draft',
          featured: dto.featured ?? false,
          authorId: actorId,
          // Only a published item gets a date, so "Published" and "has a
          // publish date" cannot disagree.
          publishedAt: (dto.status ?? 'Draft') === 'Published' ? new Date() : null,
          meta: (dto.meta ?? {}) as object,
        },
        include: { author: { select: { name: true } } },
      })
      await this.activity.recordWithActorId(
        {
          action: 'content.created',
          entity: 'content',
          entityId: c.id,
          meta: { kind: c.kind, title: c.title },
        },
        actorId,
        tx,
      )
      return c
    })
    return this.cmsDto(created)
  }

  async updateCms(id: number, dto: UpdateCmsDto, actorPublicId?: string) {
    const current = await this.db.cmsContent.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
    })
    if (!current) throw new NotFoundException(`Content ${id} not found.`)
    const actorId = await this.resolveActorId(actorPublicId)

    const becomingPublished = dto.status === 'Published' && current.status !== 'Published'
    const becomingDraft = dto.status === 'Draft' && current.status === 'Published'

    const updated = await this.db.$transaction(async (tx) => {
      const c = await tx.cmsContent.update({
        where: { id: BigInt(id) },
        data: {
          title: dto.title ?? undefined,
          slug: dto.slug?.trim() ?? undefined,
          excerpt: dto.excerpt ?? undefined,
          body: dto.body ?? undefined,
          coverUrl: dto.coverUrl ?? undefined,
          status: dto.status ?? undefined,
          featured: dto.featured ?? undefined,
          meta: (dto.meta ?? undefined) as object | undefined,
          publishedAt: becomingPublished ? new Date() : becomingDraft ? null : undefined,
        },
        include: { author: { select: { name: true } } },
      })
      await this.activity.recordWithActorId(
        {
          action: 'content.updated',
          entity: 'content',
          entityId: BigInt(id),
          meta: { fields: Object.keys(dto) },
        },
        actorId,
        tx,
      )
      return c
    })
    return this.cmsDto(updated)
  }

  async removeCms(id: number, actorPublicId?: string) {
    await this.getCms(id)
    const actorId = await this.resolveActorId(actorPublicId)
    await this.db.$transaction(async (tx) => {
      await tx.cmsContent.update({ where: { id: BigInt(id) }, data: { deletedAt: new Date() } })
      await this.activity.recordWithActorId(
        { action: 'content.deleted', entity: 'content', entityId: BigInt(id) },
        actorId,
        tx,
      )
    })
    return { ok: true }
  }

  // ---- Newsletter ----------------------------------------------------------

  async listSubscribers() {
    const rows = await this.db.newsletterSubscriber.findMany({
      where: { tenantId: TENANT_ID, unsubscribedAt: null },
      orderBy: { subscribedAt: 'desc' },
    })
    return rows.map((s) => ({
      id: Number(s.id),
      email: s.email,
      name: s.name ?? '',
      subscribedAt: fmtDay(s.subscribedAt),
    }))
  }

  /** Re-subscribing an unsubscribed address reactivates it rather than erroring. */
  async subscribe(email: string, name?: string) {
    const normalised = email.toLowerCase().trim()
    const row = await this.db.newsletterSubscriber.upsert({
      where: { tenantId_email: { tenantId: TENANT_ID, email: normalised } },
      update: { unsubscribedAt: null, name: name ?? undefined },
      create: { tenantId: TENANT_ID, email: normalised, name: name ?? null },
    })
    return { id: Number(row.id), email: row.email }
  }

  async unsubscribe(id: number) {
    await this.db.newsletterSubscriber.update({
      where: { id: BigInt(id) },
      data: { unsubscribedAt: new Date() },
    })
    return { ok: true }
  }

  // ---- Media library -------------------------------------------------------

  async listMedia(type?: string) {
    const rows = await this.db.mediaItem.findMany({
      where: { tenantId: TENANT_ID, deletedAt: null, ...(type && type !== 'all' ? { type } : {}) },
      include: { uploadedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map((m) => ({
      id: Number(m.id),
      name: m.name,
      type: m.type,
      url: m.storageKey ? `/media/${Number(m.id)}/file` : '',
      size: m.sizeBytes,
      width: m.width,
      height: m.height,
      uploadedBy: m.uploadedBy?.name ?? 'System',
      uploadedAt: fmtDay(m.createdAt),
    }))
  }

  async uploadMedia(file: Express.Multer.File, actorPublicId?: string) {
    if (!file?.buffer?.length) throw new BadRequestException('No file was uploaded.')
    const actorId = await this.resolveActorId(actorPublicId)
    const key = await this.storage.put(file.buffer, file.originalname)

    const created = await this.db.mediaItem.create({
      data: {
        tenantId: TENANT_ID,
        name: file.originalname,
        type: file.mimetype.startsWith('image/')
          ? 'image'
          : file.mimetype.startsWith('video/')
            ? 'video'
            : 'document',
        storageKey: key,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedById: actorId,
      },
      include: { uploadedBy: { select: { name: true } } },
    })
    return {
      id: Number(created.id),
      name: created.name,
      type: created.type,
      url: `/media/${Number(created.id)}/file`,
      size: created.sizeBytes,
      uploadedBy: created.uploadedBy?.name ?? 'System',
      uploadedAt: fmtDay(created.createdAt),
    }
  }

  /** Stream a media file to an authenticated caller. */
  async mediaFile(id: number) {
    const item = await this.db.mediaItem.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
    })
    if (!item?.storageKey) throw new NotFoundException(`Media ${id} not found.`)
    const stream = this.storage.read(item.storageKey)
    if (!stream) throw new NotFoundException('The stored file is no longer available.')
    return { stream, name: item.name, size: item.sizeBytes }
  }

  async removeMedia(id: number) {
    const item = await this.db.mediaItem.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
    })
    if (!item) throw new NotFoundException(`Media ${id} not found.`)
    await this.db.mediaItem.update({ where: { id: item.id }, data: { deletedAt: new Date() } })
    if (item.storageKey) await this.storage.remove(item.storageKey)
    return { ok: true }
  }

  // ---- Student resources ---------------------------------------------------

  async listResourceCategories() {
    const rows = await this.db.resourceCategory.findMany({
      where: { tenantId: TENANT_ID, deletedAt: null },
      include: { _count: { select: { resources: { where: { deletedAt: null } } } } },
      orderBy: { name: 'asc' },
    })
    return rows.map((c) => ({
      id: Number(c.id),
      name: c.name,
      description: c.description ?? '',
      resources: c._count.resources,
    }))
  }

  async listResources(categoryId?: number) {
    const rows = await this.db.studentResource.findMany({
      where: {
        tenantId: TENANT_ID,
        deletedAt: null,
        ...(categoryId ? { categoryId: BigInt(categoryId) } : {}),
      },
      include: {
        category: { select: { id: true, name: true } },
        uploadedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map((r) => ({
      id: Number(r.id),
      title: r.title,
      categoryId: r.category ? Number(r.category.id) : null,
      category: r.category?.name ?? '',
      fileName: r.fileName,
      fileSize: r.sizeBytes,
      fileUrl: r.storageKey ? `/resources/${Number(r.id)}/file` : '',
      relatedCourseId: r.relatedCourseId ? Number(r.relatedCourseId) : null,
      uploadedBy: r.uploadedBy?.name ?? 'System',
      uploadedAt: fmtDay(r.createdAt),
    }))
  }

  async uploadResource(
    file: Express.Multer.File,
    body: { title?: string; categoryId?: string; relatedCourseId?: string },
    actorPublicId?: string,
  ) {
    if (!file?.buffer?.length) throw new BadRequestException('No file was uploaded.')
    const actorId = await this.resolveActorId(actorPublicId)
    const key = await this.storage.put(file.buffer, file.originalname)

    const created = await this.db.studentResource.create({
      data: {
        tenantId: TENANT_ID,
        title: body.title?.trim() || file.originalname,
        categoryId: body.categoryId ? BigInt(body.categoryId) : null,
        fileName: file.originalname,
        storageKey: key,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        relatedCourseId: body.relatedCourseId ? BigInt(body.relatedCourseId) : null,
        uploadedById: actorId,
      },
    })
    return { id: Number(created.id), title: created.title, fileName: created.fileName }
  }

  async resourceFile(id: number) {
    const r = await this.db.studentResource.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
    })
    if (!r?.storageKey) throw new NotFoundException(`Resource ${id} not found.`)
    const stream = this.storage.read(r.storageKey)
    if (!stream) throw new NotFoundException('The stored file is no longer available.')
    return { stream, name: r.fileName, size: r.sizeBytes }
  }

  async removeResource(id: number) {
    const r = await this.db.studentResource.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
    })
    if (!r) throw new NotFoundException(`Resource ${id} not found.`)
    await this.db.studentResource.update({ where: { id: r.id }, data: { deletedAt: new Date() } })
    if (r.storageKey) await this.storage.remove(r.storageKey)
    return { ok: true }
  }

  // ---- shared --------------------------------------------------------------

  private async resolveActorId(publicId?: string): Promise<bigint | null> {
    if (!publicId) return null
    const user = await this.db.user.findFirst({
      where: { publicId, tenantId: TENANT_ID },
      select: { id: true },
    })
    return user?.id ?? null
  }

  private webinarDto(w: {
    id: bigint
    topic: string
    startsAt: Date
    venue: string | null
    audienceType: string
    webinarLink: string | null
    description: string | null
    notifiedEmail: string | null
    _count?: { enrollments: number }
  }) {
    return {
      id: Number(w.id),
      topic: w.topic,
      date: fmtWebinarDate(w.startsAt),
      startsAt: w.startsAt.toISOString(),
      venue: w.venue ?? '',
      audienceType: w.audienceType,
      // Counted, never stored: a denormalised total is the field that drifts.
      enrolledUsers: w._count?.enrollments ?? 0,
      webinarLink: w.webinarLink,
      description: w.description,
      notifiedEmail: w.notifiedEmail,
    }
  }

  private cmsDto(c: {
    id: bigint
    publicId: string
    kind: string
    title: string
    slug: string
    excerpt: string | null
    body: string
    coverUrl: string | null
    status: string
    featured: boolean
    publishedAt: Date | null
    meta: unknown
    author: { name: string } | null
  }) {
    return {
      id: Number(c.id),
      publicId: c.publicId,
      kind: c.kind,
      title: c.title,
      slug: c.slug,
      excerpt: c.excerpt ?? '',
      content: c.body,
      cover: c.coverUrl,
      status: c.status,
      featured: c.featured,
      author: c.author?.name ?? 'System',
      publishedAt: c.publishedAt ? fmtDay(c.publishedAt) : '',
      meta: (c.meta ?? {}) as Record<string, unknown>,
    }
  }
}
