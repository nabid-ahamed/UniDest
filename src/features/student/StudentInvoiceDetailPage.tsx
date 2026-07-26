import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { showSuccessDialog } from '../../store/successDialog'
import { StatusPill } from './components/StatusPill'
import { currentStudent, invoiceStatusColor, payInvoice } from '../../mock/student/portal'
import {
  studentInvoiceById,
  businessById,
  invoiceSubTotal,
  invoiceGrandTotal,
  invoicePaid,
  invoiceDue,
  invoiceStatus,
  invoiceCurrency,
  formatMoney,
} from '../../mock/studentInvoices'

export default function StudentInvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [, setRev] = useState(0)
  const invoice = studentInvoiceById(Number(id))

  // Guard: students only see their own invoices.
  if (!invoice || invoice.studentNo !== currentStudent().studentNo) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-slate-500">Invoice not found.</p>
        <button
          type="button"
          onClick={() => navigate('/portal/fees')}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Invoices
        </button>
      </div>
    )
  }

  const biz = businessById(invoice.businessId)
  const currency = invoiceCurrency(invoice)
  const money = (n: number) => formatMoney(currency, n)
  const status = invoiceStatus(invoice)
  const due = invoiceDue(invoice)

  const pay = () => {
    if (payInvoice(invoice)) {
      setRev((n) => n + 1)
      showSuccessDialog('Your payment has been received. Thank you!', 'Payment Successful')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-700">Invoice #{invoice.id}</h1>
        <button
          type="button"
          onClick={() => navigate('/portal/fees')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <div className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Header: business + status */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{biz.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{biz.address}</p>
            <p className="text-sm text-slate-600">{biz.phone} · {biz.email}</p>
            <p className="text-sm text-slate-500">GSTN: {biz.gstn}</p>
          </div>
          <div className="text-right">
            <StatusPill label={status} color={invoiceStatusColor(status)} />
            <p className="mt-2 text-sm text-slate-500">Invoice Date: {invoice.date}</p>
            <p className="text-sm text-slate-500">Due Date: {invoice.dueDate}</p>
          </div>
        </div>

        {/* Bill to */}
        <div className="rounded-lg border border-slate-200 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bill To</p>
          <p className="mt-1 font-bold text-slate-800">{invoice.student}</p>
          <p className="text-sm text-slate-600">{invoice.studentNo}</p>
          <p className="text-sm text-slate-600">{invoice.email} · {invoice.phone}</p>
        </div>

        {/* Items */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[420px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm font-semibold text-slate-600">
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it, i) => (
                <tr key={i} className="border-b border-slate-100 text-sm last:border-0">
                  <td className="px-4 py-3 text-slate-700 [overflow-wrap:anywhere]">{it.description}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-800 tabular-nums">
                    {money(it.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <Row label="Subtotal" value={money(invoiceSubTotal(invoice))} />
            {invoice.discount > 0 && <Row label="Discount" value={`- ${money(invoice.discount)}`} />}
            <Row label="Grand Total" value={money(invoiceGrandTotal(invoice))} strong />
            <Row label="Paid" value={money(invoicePaid(invoice))} />
            <Row label="Due" value={money(due)} strong danger={due > 0} />
          </dl>
        </div>

        {/* Payments */}
        {invoice.payments.length > 0 && (
          <div>
            <h3 className="mb-3 text-base font-bold text-slate-800">Payments</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[420px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm font-semibold text-slate-600">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Note</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p, i) => (
                    <tr key={i} className="border-b border-slate-100 text-sm last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{p.date}</td>
                      <td className="px-4 py-3 text-slate-600 [overflow-wrap:anywhere]">{p.note}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-800 tabular-nums">
                        {money(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="border-t border-slate-100 pt-4 text-sm text-slate-500">{invoice.terms}</p>

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => showSuccessDialog(`Invoice #${invoice.id} download has started.`, 'Downloading')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
          >
            <Download className="h-4 w-4" /> Download
          </button>
          {status === 'Due' && (
            <button
              type="button"
              onClick={pay}
              className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Pay {money(due)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  strong,
  danger,
}: {
  label: string
  value: string
  strong?: boolean
  danger?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={strong ? 'font-bold text-slate-800' : 'text-slate-600'}>{label}</dt>
      <dd
        className={
          danger
            ? 'font-bold text-rose-600 tabular-nums'
            : strong
              ? 'font-bold text-slate-900 tabular-nums'
              : 'text-slate-700 tabular-nums'
        }
      >
        {value}
      </dd>
    </div>
  )
}
