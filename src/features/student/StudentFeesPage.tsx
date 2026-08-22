import { useNavigate } from 'react-router-dom'
import { Eye, Download } from 'lucide-react'
import { showSuccessDialog } from '../../store/successDialog'
import { StatusPill } from './components/StatusPill'
import { useInvoices, formatMoney } from '../../lib/api'

/**
 * Pill colour per invoice status. Mirrors StudentInvoiceDetailPage rather than
 * the portal mock's map, which covered only the two states the fake invoices
 * had — the API also reports "Partially Paid".
 */
const STATUS_COLORS: Record<string, string> = {
  Paid: '#15803d',
  'Partially Paid': '#a16207',
  Due: '#b91c1c',
}
const statusColor = (s: string) => STATUS_COLORS[s] ?? '#475569'

/**
 * "My Invoices" — the student's own invoices, read from the API.
 *
 * The list is scoped server-side: the controller overrides `studentNo` with the
 * one on the caller's token, so the portal cannot see anyone else's bills even
 * if it asked. Totals arrive computed, so this table, the detail page and the
 * staff list cannot disagree about what is owed.
 */
export default function StudentFeesPage() {
  const navigate = useNavigate()
  const { data: invoices = [], isPending } = useInvoices('student')

  /**
   * Students can read their invoice but not settle it: recording a payment
   * needs the `invoice` permission, and letting a student mark their own bill
   * paid with no payment gateway behind it would be an accounting hole. The
   * button therefore tells them how to pay rather than pretending it did.
   */
  const pay = () => {
    showSuccessDialog(
      'Please contact your counsellor to complete this payment.',
      'Payment Instructions',
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">My Invoices</h1>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isPending ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">Loading invoices…</div>
        ) : invoices.length === 0 ? (
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
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100 text-sm last:border-0">
                    <td className="whitespace-nowrap px-6 py-5 text-slate-600">{inv.date}</td>
                    <td className="px-6 py-5">
                      <button
                        type="button"
                        onClick={() => navigate(`/portal/fees/${inv.id}`)}
                        className="font-semibold text-brand-600 tabular-nums hover:underline"
                      >
                        {inv.invoiceNo}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 font-bold text-slate-800 tabular-nums">
                      {formatMoney(inv.currency, inv.grandTotal)}
                    </td>
                    <td className="px-6 py-5">
                      <StatusPill label={inv.status} color={statusColor(inv.status)} />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {inv.due > 0 && (
                          <button
                            type="button"
                            onClick={pay}
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
                            showSuccessDialog(
                              `Invoice #${inv.invoiceNo} download has started.`,
                              'Downloading',
                            )
                          }
                          aria-label="Download invoice"
                          className="rounded-lg border border-brand-300 p-2 text-brand-600 transition-colors hover:bg-brand-50"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
