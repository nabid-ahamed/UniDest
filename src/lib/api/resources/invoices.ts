/**
 * Invoices and payments.
 *
 * One endpoint serves both invoice kinds: a university invoice carries an
 * `applicationId`, a student invoice does not, and `kind` says which.
 *
 * **Totals arrive computed.** The mock made every screen derive `grandTotal`,
 * `paid` and `due` itself (`invoiceGrandTotal`, `invoiceDue`, …), which is how a
 * list and a detail page end up disagreeing about what someone owes. The server
 * is now the single source of that arithmetic — it holds amounts as integer
 * minor units, so the numbers below are exact.
 */
import { mocked, request, USING_REAL_API } from '../client'

export interface ApiInvoiceItem {
  id: number
  description: string
  /** Major units, e.g. 1200.5. */
  amount: number
}

export interface ApiPayment {
  id: number
  amount: number
  method: string
  note: string
  /** "12 Jun 2026" */
  date: string
}

export interface ApiInvoice {
  id: number
  publicId: string
  /** Human-facing number shown on the document. */
  invoiceNo: string
  /** "23-07-2026" */
  date: string
  dueDate: string | null

  studentNo: string
  student: string
  email: string
  phone: string

  businessId: number | null
  business: string
  applicationId: number | null
  /** Joined from the application; empty for student invoices. */
  university: string
  country: string
  /** 'university' when tied to an application, else 'student'. */
  kind: 'student' | 'university'

  currency: string
  items: ApiInvoiceItem[]
  subTotal: number
  discount: number
  grandTotal: number
  paid: number
  due: number

  status: string
  statusColor: string
  paymentLabel: string | null
  agent: string | null
  terms: string
  notes: string

  payments: ApiPayment[]
}

/**
 * A status the server can assign to an invoice.
 *
 * Read from the API rather than hardcoded: the server derives status from the
 * balance and knows about `Partially Paid`, which the old frontend constant
 * (`['Due', 'Paid']`) omitted — so a part-paid invoice could not be filtered.
 */
export interface ApiInvoiceStatus {
  label: string
  /** Hex swatch, already contrast-checked server-side. */
  color: string
  isPaid: boolean
}

export interface ApiBusiness {
  id: number
  name: string
  address: string
  phone: string
  email: string
  gstn: string
  currency: string
}

interface InvoiceListResponse {
  data: ApiInvoice[]
  total: number
  page: number
  limit: number
}

export interface InvoiceItemInput {
  description: string
  amount: number
}

export const invoicesApi = {
  /** GET /invoices — `kind` narrows to student or university invoices. */
  list: (kind?: 'student' | 'university'): Promise<ApiInvoice[]> =>
    USING_REAL_API
      ? request<InvoiceListResponse>(
          `/invoices?limit=200${kind ? `&kind=${kind}` : ''}`,
        ).then((r) => r.data)
      : mocked(() => []),

  /** GET /invoices/:id */
  get: (id: number): Promise<ApiInvoice | null> =>
    USING_REAL_API ? request<ApiInvoice>(`/invoices/${id}`).catch(() => null) : mocked(() => null),

  /** GET /invoices/statuses — the status vocabulary, in display order. */
  statuses: (): Promise<ApiInvoiceStatus[]> =>
    USING_REAL_API ? request<ApiInvoiceStatus[]>('/invoices/statuses') : mocked(() => []),

  /** GET /invoices/businesses — billing entities for the issuer picker. */
  businesses: (): Promise<ApiBusiness[]> =>
    USING_REAL_API ? request<ApiBusiness[]>('/invoices/businesses') : mocked(() => []),

  /** POST /invoices */
  create: (data: {
    studentNo: string
    items: InvoiceItemInput[]
    invoiceNo?: string
    businessId?: number
    applicationId?: number
    currency?: string
    discount?: number
    dueDate?: string
    paymentLabel?: string
    agent?: string
    terms?: string
    notes?: string
  }): Promise<ApiInvoice> =>
    request<ApiInvoice>('/invoices', { method: 'POST', body: JSON.stringify(data) }),

  /** PATCH /invoices/:id — sending `items` replaces every line. */
  update: (
    id: number,
    patch: {
      items?: InvoiceItemInput[]
      discount?: number
      currency?: string
      dueDate?: string
      paymentLabel?: string
      agent?: string
      terms?: string
      notes?: string
    },
  ): Promise<ApiInvoice> =>
    request<ApiInvoice>(`/invoices/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  /**
   * POST /invoices/:id/payments.
   *
   * A negative amount records a refund — the ledger is append-only, so a
   * mistake is corrected with a reversing entry rather than by editing history.
   * The server refuses anything that would overpay or refund past zero, and
   * re-derives the invoice status from the resulting balance.
   */
  recordPayment: (
    id: number,
    data: { amount: number; method?: string; note?: string; paidAt?: string },
  ): Promise<ApiInvoice> =>
    request<ApiInvoice>(`/invoices/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** DELETE /invoices/:id — soft delete. */
  remove: (id: number): Promise<void> =>
    request<{ ok: boolean }>(`/invoices/${id}`, { method: 'DELETE' }).then(() => undefined),
}

/** "USD 1200.50" — the label format every invoice screen renders. */
export const formatMoney = (currency: string, amount: number) =>
  `${currency} ${Number(amount || 0).toFixed(2)}`
