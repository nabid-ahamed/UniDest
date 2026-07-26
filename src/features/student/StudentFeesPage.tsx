import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Download } from 'lucide-react'
import { showSuccessDialog } from '../../store/successDialog'
import { StatusPill } from './components/StatusPill'
import {
  myInvoices,
  invoiceAmountLabel,
  invoiceStatus,
  invoiceStatusColor,
  payInvoice,
} from '../../mock/student/portal'

/** "dd-mm-yyyy hh:mm am" → "dd/mm/yyyy" (date part only, like the reference). */
const dateOnly = (d: string) => d.split(' ')[0].replace(/-/g, '/')

/**
 * "My Invoices" — the student's own invoices, derived live from the admin
 * Student Invoices module (filtered via `myInvoices()`). Pay records a payment
 * on the shared record; View opens the invoice; Download is a mock download.
 * Matches demo.eductrl.com/cn4/my-invoices.
 */
export default function StudentFeesPage() {
  const navigate = useNavigate()
  const [, setRev] = useState(0)
  const invoices = myInvoices()

  const pay = (id: number) => {
    const inv = invoices.find((i) => i.id === id)
    if (inv && payInvoice(inv)) {
      setRev((n) => n + 1)
      showSuccessDialog('Your payment has been received. Thank you!', 'Payment Successful')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">My Invoices</h1>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {invoices.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">You have no invoices yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const status = invoiceStatus(inv)
                  return (
                    <tr key={inv.id} className="border-b border-slate-100 text-sm last:border-0">
                      <td className="whitespace-nowrap px-6 py-5 text-slate-600">{dateOnly(inv.date)}</td>
                      <td className="px-6 py-5">
                        <button
                          type="button"
                          onClick={() => navigate(`/portal/fees/${inv.id}`)}
                          className="font-semibold text-brand-600 tabular-nums hover:underline"
                        >
                          {inv.id}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-6 py-5 font-bold text-slate-800 tabular-nums">
                        {invoiceAmountLabel(inv)}
                      </td>
                      <td className="px-6 py-5">
                        <StatusPill label={status} color={invoiceStatusColor(status)} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {status === 'Due' && (
                            <button
                              type="button"
                              onClick={() => pay(inv.id)}
                              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                            >
                              Pay
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => navigate(`/portal/fees/${inv.id}`)}
                            aria-label="View invoice"
                            className="rounded-lg border border-brand-300 p-2 text-brand-600 transition-colors hover:bg-brand-50"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              showSuccessDialog(`Invoice #${inv.id} download has started.`, 'Downloading')
                            }
                            aria-label="Download invoice"
                            className="rounded-lg border border-brand-300 p-2 text-brand-600 transition-colors hover:bg-brand-50"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
