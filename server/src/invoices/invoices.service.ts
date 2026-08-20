import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ActivityService } from '../activity/activity.service'
import type {
  CreateInvoiceDto,
  ListInvoicesDto,
  RecordPaymentDto,
  UpdateInvoiceDto,
} from './dto/invoice.dto'

const TENANT_ID = 1n

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Money crosses the API as a decimal number (1250.5) and is stored as an
 * integer count of minor units (125050).
 *
 * Rounding on the way in is deliberate: a client sending 10.005 must resolve to
 * a real amount before it enters the ledger, not drift once summed.
 */
const toMinor = (amount: number): number => Math.round((Number(amount) || 0) * 100)
const fromMinor = (minor: number): number => minor / 100

/** "23-07-2026" — the format the invoice screens render. */
function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
}

/** "12 Jun 2026" — the format a payment row renders. */
function fmtDay(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

type InvoiceRow = {
  id: bigint
  publicId: string
  invoiceNo: string
  currency: string
  subtotalMinor: number
  discountMinor: number
  paymentLabel: string | null
  agentName: string | null
  dueDate: Date | null
  terms: string | null
  notes: string | null
  createdAt: Date
  student: { id: bigint; name: string; studentNo: string; email: string | null; phone: string | null }
  business: { id: bigint; name: string; currency: string } | null
  application: { id: bigint } | null
  status: { label: string; color: string; isPaid: boolean }
  items: Array<{ id: bigint; description: string; amountMinor: number }>
  payments: Array<{ id: bigint; amountMinor: number; method: string; note: string | null; paidAt: Date }>
}

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ActivityService) private readonly activity: ActivityService,
  ) {}

  private get db() {
    return this.prisma.client
  }

  async list(query: ListInvoicesDto) {
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 50))

    const where: Record<string, unknown> = { tenantId: TENANT_ID, deletedAt: null }
    if (query.status) where.status = { label: query.status }
    if (query.studentNo) where.student = { studentNo: query.studentNo }
    // 'university' invoices carry an application; 'student' ones do not.
    if (query.kind === 'university') where.applicationId = { not: null }
    if (query.kind === 'student') where.applicationId = null
    if (query.search?.trim()) {
      const q = query.search.trim()
      where.OR = [
        { invoiceNo: { contains: q, mode: 'insensitive' } },
        { student: { name: { contains: q, mode: 'insensitive' } } },
      ]
    }

    const [rows, total] = await Promise.all([
      this.db.invoice.findMany({
        where,
        include: this.relations,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.invoice.count({ where }),
    ])

    return { data: rows.map((r) => this.toDto(r as InvoiceRow)), total, page, limit }
  }

  async get(id: number) {
    const invoice = await this.db.invoice.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      include: this.relations,
    })
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found.`)
    return this.toDto(invoice as InvoiceRow)
  }

  async create(dto: CreateInvoiceDto, actorPublicId?: string) {
    const student = await this.db.student.findFirst({
      where: { tenantId: TENANT_ID, studentNo: dto.studentNo, deletedAt: null },
    })
    if (!student) throw new NotFoundException(`Student ${dto.studentNo} not found.`)

    const items = dto.items ?? []
    if (!items.length) throw new BadRequestException('An invoice needs at least one line item.')

    const subtotalMinor = items.reduce((sum, it) => sum + toMinor(it.amount), 0)
    const discountMinor = toMinor(dto.discount ?? 0)
    if (discountMinor > subtotalMinor) {
      throw new BadRequestException('Discount cannot exceed the invoice subtotal.')
    }

    const business = dto.businessId
      ? await this.db.business.findFirst({
          where: { tenantId: TENANT_ID, id: BigInt(dto.businessId) },
        })
      : await this.db.business.findFirst({ where: { tenantId: TENANT_ID }, orderBy: { id: 'asc' } })

    const application = dto.applicationId
      ? await this.db.application.findFirst({
          where: { tenantId: TENANT_ID, id: BigInt(dto.applicationId), deletedAt: null },
        })
      : null
    if (dto.applicationId && !application) {
      throw new NotFoundException(`Application ${dto.applicationId} not found.`)
    }

    // A brand-new invoice has no payments, so it starts unpaid regardless of
    // amount — the status is always derived, never taken from the client.
    const statusId = await this.statusIdFor(0, subtotalMinor - discountMinor)
    const actorId = await this.resolveActorId(actorPublicId)

    const created = await this.db.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          tenantId: TENANT_ID,
          invoiceNo: dto.invoiceNo?.trim() || (await this.nextInvoiceNo(tx)),
          studentId: student.id,
          businessId: business?.id ?? null,
          applicationId: application?.id ?? null,
          currency: dto.currency ?? business?.currency ?? 'USD',
          subtotalMinor,
          discountMinor,
          paymentLabel: dto.paymentLabel ?? null,
          agentName: dto.agent ?? null,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          terms: dto.terms ?? null,
          notes: dto.notes ?? null,
          statusId,
        },
      })

      await tx.invoiceItem.createMany({
        data: items.map((it, i) => ({
          tenantId: TENANT_ID,
          invoiceId: invoice.id,
          description: it.description,
          amountMinor: toMinor(it.amount),
          sortOrder: i,
        })),
      })

      await this.activity.recordWithActorId(
        {
          action: 'invoice.created',
          entity: 'invoice',
          entityId: invoice.id,
          meta: {
            invoiceNo: invoice.invoiceNo,
            total: fromMinor(subtotalMinor - discountMinor),
            currency: invoice.currency,
          },
        },
        actorId,
        tx,
      )
      return invoice
    })

    return this.get(Number(created.id))
  }

  async update(id: number, dto: UpdateInvoiceDto, actorPublicId?: string) {
    const current = await this.db.invoice.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      include: { payments: true },
    })
    if (!current) throw new NotFoundException(`Invoice ${id} not found.`)

    const actorId = await this.resolveActorId(actorPublicId)
    const replacingItems = dto.items != null

    const subtotalMinor = replacingItems
      ? dto.items!.reduce((sum, it) => sum + toMinor(it.amount), 0)
      : current.subtotalMinor
    const discountMinor = dto.discount != null ? toMinor(dto.discount) : current.discountMinor
    if (discountMinor > subtotalMinor) {
      throw new BadRequestException('Discount cannot exceed the invoice subtotal.')
    }

    const paidMinor = current.payments.reduce((sum, p) => sum + p.amountMinor, 0)
    const totalMinor = subtotalMinor - discountMinor
    // Editing the amount below what has already been paid would leave a
    // negative balance with no way to express it. Refunds are a negative
    // payment, not a shrunken invoice.
    if (totalMinor < paidMinor) {
      throw new BadRequestException(
        'Invoice total cannot be less than the payments already recorded against it.',
      )
    }

    await this.db.$transaction(async (tx) => {
      if (replacingItems) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: BigInt(id) } })
        await tx.invoiceItem.createMany({
          data: dto.items!.map((it, i) => ({
            tenantId: TENANT_ID,
            invoiceId: BigInt(id),
            description: it.description,
            amountMinor: toMinor(it.amount),
            sortOrder: i,
          })),
        })
      }

      await tx.invoice.update({
        where: { id: BigInt(id) },
        data: {
          subtotalMinor,
          discountMinor,
          currency: dto.currency ?? undefined,
          paymentLabel: dto.paymentLabel ?? undefined,
          agentName: dto.agent ?? undefined,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          terms: dto.terms ?? undefined,
          notes: dto.notes ?? undefined,
          // The total may have moved, so the status is recomputed rather than
          // left describing the old amount.
          statusId: await this.statusIdFor(paidMinor, totalMinor),
        },
      })

      await this.activity.recordWithActorId(
        {
          action: 'invoice.updated',
          entity: 'invoice',
          entityId: BigInt(id),
          meta: { fields: Object.keys(dto) },
        },
        actorId,
        tx,
      )
    })

    return this.get(id)
  }

  /**
   * Record a payment and re-derive the invoice status.
   *
   * Both happen in one transaction: an invoice showing "unpaid" while its
   * payment row exists is a reconciliation problem, and the two facts must move
   * together or not at all.
   */
  async recordPayment(id: number, dto: RecordPaymentDto, actorPublicId?: string) {
    const invoice = await this.db.invoice.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      include: { payments: true },
    })
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found.`)

    const amountMinor = toMinor(dto.amount)
    if (amountMinor === 0) throw new BadRequestException('A payment needs a non-zero amount.')

    const paidMinor = invoice.payments.reduce((sum, p) => sum + p.amountMinor, 0)
    const totalMinor = invoice.subtotalMinor - invoice.discountMinor

    // Negative amounts are allowed — that is how a refund or a correction is
    // expressed against an append-only ledger. What is refused is a payment
    // that would take the invoice past settled, or a refund past zero.
    if (paidMinor + amountMinor > totalMinor) {
      throw new BadRequestException(
        `Payment exceeds the outstanding balance of ${fromMinor(totalMinor - paidMinor)} ${invoice.currency}.`,
      )
    }
    if (paidMinor + amountMinor < 0) {
      throw new BadRequestException('A refund cannot take total payments below zero.')
    }

    const actorId = await this.resolveActorId(actorPublicId)

    await this.db.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          tenantId: TENANT_ID,
          invoiceId: BigInt(id),
          amountMinor,
          method: dto.method ?? 'Cash',
          note: dto.note ?? null,
          paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
          recordedById: actorId,
        },
      })

      await tx.invoice.update({
        where: { id: BigInt(id) },
        data: { statusId: await this.statusIdFor(paidMinor + amountMinor, totalMinor) },
      })

      await this.activity.recordWithActorId(
        {
          action: amountMinor < 0 ? 'invoice.refunded' : 'invoice.payment_recorded',
          entity: 'invoice',
          entityId: BigInt(id),
          meta: {
            amount: fromMinor(amountMinor),
            currency: invoice.currency,
            balance: fromMinor(totalMinor - paidMinor - amountMinor),
          },
        },
        actorId,
        tx,
      )
    })

    return this.get(id)
  }

  async remove(id: number, actorPublicId?: string) {
    await this.get(id)
    const actorId = await this.resolveActorId(actorPublicId)
    await this.db.$transaction(async (tx) => {
      await tx.invoice.update({ where: { id: BigInt(id) }, data: { deletedAt: new Date() } })
      await this.activity.recordWithActorId(
        { action: 'invoice.deleted', entity: 'invoice', entityId: BigInt(id) },
        actorId,
        tx,
      )
    })
    return { ok: true }
  }

  /** Billing entities, for the invoice form's issuer picker. */
  async businesses() {
    const rows = await this.db.business.findMany({
      where: { tenantId: TENANT_ID, deletedAt: null },
      orderBy: { id: 'asc' },
    })
    return rows.map((b) => ({
      id: Number(b.id),
      name: b.name,
      address: b.address ?? '',
      phone: b.phone ?? '',
      email: b.email ?? '',
      gstn: b.taxId ?? '',
      currency: b.currency,
    }))
  }

  async statuses() {
    const rows = await this.db.invoiceStatus.findMany({
      where: { tenantId: TENANT_ID, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    })
    return rows.map((s) => ({ label: s.label, color: s.color, isPaid: s.isPaid }))
  }

  /**
   * The status a given (paid, total) pair implies.
   *
   * Derived, never client-supplied: an invoice whose stored status disagrees
   * with its own payment rows is the classic accounting bug, and the only way
   * to prevent it is to never store an independently-settable value.
   */
  private async statusIdFor(paidMinor: number, totalMinor: number): Promise<bigint> {
    const key = totalMinor > 0 && paidMinor >= totalMinor ? 'paid' : paidMinor > 0 ? 'partial' : 'unpaid'
    const status = await this.db.invoiceStatus.findFirst({
      where: { tenantId: TENANT_ID, key, deletedAt: null },
    })
    if (status) return status.id
    const fallback = await this.db.invoiceStatus.findFirst({
      where: { tenantId: TENANT_ID, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    })
    if (!fallback) throw new NotFoundException('No invoice statuses are configured.')
    return fallback.id
  }

  /** Sequential-looking invoice number, continuing from the highest so far. */
  private async nextInvoiceNo(tx: {
    invoice: { findFirst(args: unknown): Promise<{ invoiceNo: string } | null> }
  }): Promise<string> {
    const last = await tx.invoice.findFirst({
      where: { tenantId: TENANT_ID },
      orderBy: { id: 'desc' },
      select: { invoiceNo: true },
    })
    const n = Number(last?.invoiceNo)
    return String(Number.isFinite(n) && n > 0 ? n + 1 : 387500)
  }

  private async resolveActorId(publicId?: string): Promise<bigint | null> {
    if (!publicId) return null
    const user = await this.db.user.findFirst({
      where: { publicId, tenantId: TENANT_ID },
      select: { id: true },
    })
    return user?.id ?? null
  }

  private readonly relations = {
    student: { select: { id: true, name: true, studentNo: true, email: true, phone: true } },
    business: { select: { id: true, name: true, currency: true } },
    application: { select: { id: true } },
    status: true,
    items: { orderBy: { sortOrder: 'asc' } },
    payments: { orderBy: { paidAt: 'asc' } },
  } as const

  /**
   * Flat shape for the UI, with the totals already computed.
   *
   * The mock made every screen derive these itself (`invoiceGrandTotal`,
   * `invoiceDue`, …), which is how a list and a detail page end up disagreeing.
   * One source of arithmetic, server-side.
   */
  private toDto(inv: InvoiceRow) {
    const paidMinor = inv.payments.reduce((sum, p) => sum + p.amountMinor, 0)
    const totalMinor = inv.subtotalMinor - inv.discountMinor
    const dueMinor = Math.max(0, totalMinor - paidMinor)

    return {
      id: Number(inv.id),
      publicId: inv.publicId,
      invoiceNo: inv.invoiceNo,
      date: fmtDate(inv.createdAt),
      dueDate: inv.dueDate ? fmtDate(inv.dueDate) : null,

      studentNo: inv.student.studentNo,
      student: inv.student.name,
      email: inv.student.email ?? '',
      phone: inv.student.phone ?? '',

      businessId: inv.business ? Number(inv.business.id) : null,
      business: inv.business?.name ?? '',
      applicationId: inv.application ? Number(inv.application.id) : null,
      /** 'university' when tied to an application, else 'student'. */
      kind: inv.application ? 'university' : 'student',

      currency: inv.currency,
      items: inv.items.map((it) => ({
        id: Number(it.id),
        description: it.description,
        amount: fromMinor(it.amountMinor),
      })),
      subTotal: fromMinor(inv.subtotalMinor),
      discount: fromMinor(inv.discountMinor),
      grandTotal: fromMinor(totalMinor),
      paid: fromMinor(paidMinor),
      due: fromMinor(dueMinor),

      status: inv.status.label,
      statusColor: inv.status.color,
      paymentLabel: inv.paymentLabel,
      agent: inv.agentName,
      terms: inv.terms ?? '',
      notes: inv.notes ?? '',

      payments: inv.payments.map((p) => ({
        id: Number(p.id),
        amount: fromMinor(p.amountMinor),
        method: p.method,
        note: p.note ?? '',
        date: fmtDay(p.paidAt),
      })),
    }
  }
}
