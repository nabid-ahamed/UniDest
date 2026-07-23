import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Wallet,
  Mail,
  Download,
  Pencil,
  Trash2,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { ExportButtons } from '../../components/ExportButtons'
import { Field, PageBtn } from '../../components/DataTableUI'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  studentInvoices,
  studentInvoiceStatuses,
  businessById,
  invoiceGrandTotal,
  invoiceDue,
  invoiceStatus,
  invoiceCurrency,
  formatMoney,
  updateStudentInvoice,
  deleteStudentInvoice,
  type StudentInvoice,
} from '../../mock/studentInvoices'

const PAGE_SIZES = [25, 50, 100]

export default function StudentInvoicesPage() {
  const [rev, setRev] = useState(0)
  const bump = () => setRev((n) => n + 1)

  const [search, setSearch] = useState('')
  const [tableSearch, setTableSearch] = useState('')
  const [status, setStatus] = useState('')
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [viewRow, setViewRow] = useState<StudentInvoice | null>(null)
  const [payRow, setPayRow] = useState<StudentInvoice | null>(null)
  const [deleteRow, setDeleteRow] = useState<StudentInvoice | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('')
    setPage(1)
  }

  const filtered = useMemo(() => {
    const top = search.trim().toLowerCase()
    const tbl = tableSearch.trim().toLowerCase()
    return studentInvoices.filter((inv) => {
      if (status && invoiceStatus(inv) !== status) return false
      const hay = `${inv.id} ${inv.student} ${inv.email}`.toLowerCase()
      if (top && !hay.includes(top)) return false
      if (tbl && !`${hay} ${inv.date} ${invoiceStatus(inv)}`.toLowerCase().includes(tbl)) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tableSearch, status, rev])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  const exportHeader = ['Invoice #', 'Date', 'Student', 'Amount', 'Status']
  const exportRows = filtered.map((inv) => [
    inv.id,
    inv.date,
    inv.student,
    formatMoney(invoiceCurrency(inv), invoiceGrandTotal(inv)),
    invoiceStatus(inv),
  ])

  const recordPayment = (amount: number, date: string, note: string) => {
    if (!payRow) return
    updateStudentInvoice({ ...payRow, payments: [...payRow.payments, { amount, date, note }] })
    showToast(`Payment recorded for invoice #${payRow.id}`)
    setPayRow(null)
    bump()
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Invoices</h1>
        <a
          href="/invoices/student/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Create
        </a>
      </div>

      {/* Filter bar */}
      <div className="mt-5 grid grid-cols-1 items-end gap-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-[1fr_1fr_auto]">
        <Field label="Search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by Invoice No, Student"
              className="input w-full pl-9"
            />
          </div>
        </Field>
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="input"
          >
            <option value="">All</option>
            {studentInvoiceStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <button
          onClick={clearFilters}
          className="rounded-lg border border-brand-300 bg-white px-6 py-2.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
        >
          Clear
        </button>
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <label className="flex items-center gap-2 text-sm text-slate-600 md:flex-1">
          Show
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            className="input w-20 py-1.5"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          entries
        </label>
        <div className="flex justify-center md:flex-[2] md:px-2">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search..."
              aria-label="Search invoices"
              className="input w-full pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 md:flex-1 md:justify-end">
          <ExportButtons
            title="Student Invoices"
            filename="student-invoices"
            header={exportHeader}
            rows={exportRows}
            onDone={showToast}
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">Invoice #</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((inv) => {
              const currency = invoiceCurrency(inv)
              const st = invoiceStatus(inv)
              const due = invoiceDue(inv)
              return (
                <tr key={inv.id} className="border-b border-slate-100 align-top text-sm">
                  <td className="px-4 py-4 font-bold text-slate-800">{inv.id}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{inv.date}</td>
                  <td className="px-4 py-4 font-bold text-slate-800 [overflow-wrap:anywhere]">
                    {inv.student}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-800">
                    {formatMoney(currency, invoiceGrandTotal(inv))}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        'inline-block rounded-md px-2 py-0.5 text-xs font-semibold',
                        st === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
                      )}
                    >
                      {st}
                    </span>
                    {st === 'Due' && (
                      <p className="mt-1 text-xs font-semibold text-rose-600">
                        {formatMoney(currency, due)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <ActionIcon
                        icon={Eye}
                        label="View"
                        onClick={() => setViewRow(inv)}
                        className="border-brand-300 text-brand-600 hover:border-brand-600 hover:bg-brand-600 hover:text-white"
                      />
                      {st !== 'Paid' && (
                        <ActionIcon
                          icon={Wallet}
                          label="Record Payment"
                          onClick={() => setPayRow(inv)}
                          className="border-sky-300 text-sky-600 hover:border-sky-600 hover:bg-sky-600 hover:text-white"
                        />
                      )}
                      <ActionIcon
                        icon={Mail}
                        label="Email"
                        onClick={() => showToast(`Invoice #${inv.id} emailed to ${inv.student}`)}
                        className="border-emerald-300 text-emerald-600 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
                      />
                      <ActionIcon
                        icon={Download}
                        label="Download"
                        onClick={() => {
                          downloadStudentInvoicePdf(inv)
                          showToast(`Invoice #${inv.id} downloaded`)
                        }}
                        className="border-amber-300 text-amber-600 hover:border-amber-600 hover:bg-amber-600 hover:text-white"
                      />
                      <ActionIcon
                        icon={Pencil}
                        label="Edit"
                        onClick={() => window.location.assign(`/invoices/student/${inv.id}/edit`)}
                        className="border-slate-300 text-slate-600 hover:border-slate-600 hover:bg-slate-600 hover:text-white"
                      />
                      <ActionIcon
                        icon={Trash2}
                        label="Delete"
                        onClick={() => setDeleteRow(inv)}
                        className="border-rose-300 text-rose-600 hover:border-rose-600 hover:bg-rose-600 hover:text-white"
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                  No invoices found.
                  <a href="/invoices/student/new" className="ml-1 font-semibold text-brand-600 hover:underline">
                    Create one
                  </a>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-500">
          Showing {from} to {to} of {filtered.length} entries
        </p>
        <div className="flex items-center gap-1">
          <PageBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" />
          </PageBtn>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={cn(
                'h-8 min-w-8 rounded-md px-2 text-sm font-medium',
                n === currentPage ? 'bg-brand-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
              )}
            >
              {n}
            </button>
          ))}
          <PageBtn
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </PageBtn>
        </div>
      </div>

      {/* Modals */}
      {viewRow && <ViewInvoiceModal invoice={viewRow} onClose={() => setViewRow(null)} />}
      {payRow && <RecordPaymentModal invoice={payRow} onClose={() => setPayRow(null)} onSave={recordPayment} />}
      {deleteRow &&
        createPortal(
          <ConfirmDialog
            open
            title="Delete this invoice?"
            message={
              <>
                Invoice <span className="font-medium text-slate-700">#{deleteRow.id}</span> ({deleteRow.student})
                will be removed permanently.
              </>
            }
            confirmLabel="Delete"
            onConfirm={() => {
              deleteStudentInvoice(deleteRow.id)
              showToast(`Invoice #${deleteRow.id} deleted`)
              setDeleteRow(null)
              bump()
            }}
            onCancel={() => setDeleteRow(null)}
          />,
          document.body,
        )}

      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[120] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

function ActionIcon({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: typeof Eye
  label: string
  onClick: () => void
  className?: string
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn('flex h-7 w-7 items-center justify-center rounded-md border transition-colors', className)}
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
      <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-slate-700 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </div>
  )
}

function ModalShell({
  title,
  onClose,
  children,
  wide,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}) {
  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto p-4" role="dialog" aria-modal="true">
      <div className="animate-fade-in absolute inset-0 bg-slate-500/60" onClick={onClose} />
      <div className={cn('animate-dialog-in relative my-8 w-full rounded-xl bg-white shadow-xl', wide ? 'max-w-2xl' : 'max-w-md')}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

function ViewInvoiceModal({ invoice, onClose }: { invoice: StudentInvoice; onClose: () => void }) {
  const biz = businessById(invoice.businessId)
  const currency = invoiceCurrency(invoice)
  const subTotal = invoice.items.reduce((s, it) => s + (Number(it.amount) || 0), 0)
  const grand = invoiceGrandTotal(invoice)
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0)
  const due = invoiceDue(invoice)

  return (
    <ModalShell title={`Invoice #${invoice.id}`} onClose={onClose} wide>
      <div className="flex flex-wrap justify-between gap-4 text-sm">
        <div>
          <p className="font-bold text-slate-800">Bill To</p>
          <p className="mt-1 text-slate-700">{invoice.student}</p>
          <p className="text-slate-500 [overflow-wrap:anywhere]">{invoice.email}</p>
          <p className="text-slate-500">{invoice.phone}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-800">{biz.name}</p>
          <p className="mt-1 text-slate-500">{biz.address}</p>
          <p className="text-slate-500">GSTN: {biz.gstn}</p>
          <p className="mt-1 text-slate-500">Date: {invoice.date}</p>
          <p className="text-slate-500">Due: {invoice.dueDate}</p>
        </div>
      </div>

      <table className="mt-5 w-full border border-slate-200 text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left font-semibold text-slate-600">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Item &amp; Description</th>
            <th className="px-3 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="px-3 py-2 text-slate-500">{i + 1}</td>
              <td className="px-3 py-2 text-slate-700">{it.description}</td>
              <td className="px-3 py-2 text-right font-medium text-slate-800">
                {formatMoney(currency, it.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
        <Row label="Sub Total" value={formatMoney(currency, subTotal)} />
        <Row label="Discount (-)" value={formatMoney(currency, invoice.discount)} />
        <Row label="Grand Total" value={formatMoney(currency, grand)} bold />
        <Row label="Paid" value={formatMoney(currency, paid)} />
        <Row label="Due" value={formatMoney(currency, due)} bold danger={due > 0} />
      </div>

      {invoice.terms && (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Terms &amp; Conditions:</span> {invoice.terms}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={() => downloadStudentInvoicePdf(invoice)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          <Download className="h-4 w-4" /> Download PDF
        </button>
        <button
          onClick={onClose}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Close
        </button>
      </div>
    </ModalShell>
  )
}

function Row({
  label,
  value,
  bold,
  danger,
}: {
  label: string
  value: string
  bold?: boolean
  danger?: boolean
}) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={cn(bold && 'font-bold', danger ? 'text-rose-600' : 'text-slate-800')}>{value}</span>
    </div>
  )
}

function RecordPaymentModal({
  invoice,
  onClose,
  onSave,
}: {
  invoice: StudentInvoice
  onClose: () => void
  onSave: (amount: number, date: string, note: string) => void
}) {
  const currency = invoiceCurrency(invoice)
  const due = invoiceDue(invoice)
  const [amount, setAmount] = useState(String(due))
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [tried, setTried] = useState(false)

  const submit = () => {
    setTried(true)
    const value = Number(amount)
    if (!value || value <= 0 || !date) return
    const nice = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(
      new Date(date),
    )
    onSave(value, nice, note.trim())
  }

  return (
    <ModalShell title={`Record Payment — #${invoice.id}`} onClose={onClose}>
      <div className="space-y-4">
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
          {invoice.student} · Due {formatMoney(currency, due)}
        </p>
        <div>
          <label htmlFor="sp-amount" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Amount ({currency}) <span className="text-rose-600">*</span>
          </label>
          <input
            id="sp-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={cn('input', tried && (!Number(amount) || Number(amount) <= 0) && 'border-rose-500')}
          />
        </div>
        <div>
          <label htmlFor="sp-date" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Payment Date <span className="text-rose-600">*</span>
          </label>
          <input
            id="sp-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={cn('input', tried && !date && 'border-rose-500')}
          />
        </div>
        <div>
          <label htmlFor="sp-note" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Note
          </label>
          <input id="sp-note" value={note} onChange={(e) => setNote(e.target.value)} className="input" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Save Payment
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

/** Printable one-page PDF for a student invoice (reuses jsPDF like the profile export). */
export function downloadStudentInvoicePdf(inv: StudentInvoice) {
  const biz = businessById(inv.businessId)
  const currency = invoiceCurrency(inv)
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text(biz.name, 14, 20)
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(`Invoice #${inv.id}`, 196, 20, { align: 'right' })
  doc.text(biz.address, 14, 28)
  doc.text(`Date: ${inv.date}`, 196, 28, { align: 'right' })
  doc.text(`Due: ${inv.dueDate}`, 196, 34, { align: 'right' })
  doc.setTextColor(30)
  doc.text(`Bill To: ${inv.student}`, 14, 42)
  doc.setTextColor(100)
  doc.text(`${inv.email} · ${inv.phone}`, 14, 48)

  autoTable(doc, {
    startY: 56,
    theme: 'grid',
    head: [['#', 'Item & Description', 'Amount']],
    body: inv.items.map((it, i) => [String(i + 1), it.description, formatMoney(currency, it.amount)]),
    headStyles: { fillColor: [37, 99, 235] },
    columnStyles: { 2: { halign: 'right' } },
  })

  const subTotal = inv.items.reduce((s, it) => s + (Number(it.amount) || 0), 0)
  // @ts-expect-error jspdf-autotable augments the doc with lastAutoTable.
  let y = (doc.lastAutoTable?.finalY ?? 70) + 8
  const put = (label: string, value: string) => {
    doc.text(label, 150, y, { align: 'right' })
    doc.text(value, 196, y, { align: 'right' })
    y += 6
  }
  put('Sub Total', formatMoney(currency, subTotal))
  put('Discount', formatMoney(currency, inv.discount))
  put('Grand Total', formatMoney(currency, invoiceGrandTotal(inv)))
  put('Due', formatMoney(currency, invoiceDue(inv)))

  doc.save(`student-invoice-${inv.id}.pdf`)
}
