import { useMemo, useState } from 'react'
import { Wallet, ArrowRight } from 'lucide-react'
import { Field } from '../../components/DataTableUI'
import { ExportButtons } from '../../components/ExportButtons'
import { payoutMonths, computePayouts, formatCommission } from '../../mock/referrals'

export default function ReferralPayoutPage() {
  const months = useMemo(() => payoutMonths(), [])
  const [month, setMonth] = useState('')
  const [applied, setApplied] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2500)
  }

  const rows = useMemo(() => (applied ? computePayouts(applied) : []), [applied])
  const monthLabel = months.find((m) => m.value === applied)?.label ?? ''
  const totalReward = rows.reduce((s, r) => s + r.reward, 0)
  const totalReferrals = rows.reduce((s, r) => s + r.count, 0)

  const exportHeader = ['Referer', 'Pay Pref. Mode', 'Pay Pref. Details', 'No. of Referrals', 'Reward']
  const exportRows = rows.map((r) => [r.referrer, r.mode, r.details, r.count, formatCommission(r.reward)])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h1 className="text-xl font-bold text-slate-900">Referral Payout</h1>

      {/* Month picker */}
      <div className="mt-5 flex flex-wrap items-end gap-4">
        <div className="w-full max-w-xs">
          <Field label="Select Month">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="input"
              aria-label="Select Month"
            >
              <option value="">Select Month</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <button
          onClick={() => {
            if (!month) return showToast('Please select a month')
            setApplied(month)
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Summary + export once a month is applied */}
      {applied && rows.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 font-semibold text-brand-700">
              <Wallet className="h-4 w-4" /> {monthLabel}
            </span>
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-slate-600">
              {totalReferrals} referral{totalReferrals === 1 ? '' : 's'}
            </span>
            <span className="rounded-lg bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
              Total reward: {formatCommission(totalReward)}
            </span>
          </div>
          <ExportButtons
            title={`Referral Payout — ${monthLabel}`}
            filename={`referral-payout-${applied}`}
            header={exportHeader}
            rows={exportRows}
            onDone={showToast}
          />
        </div>
      )}

      {/* Payout table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">Referer</th>
              <th className="px-4 py-3">Pay Pref. Mode</th>
              <th className="px-4 py-3">Pay Pref. Details</th>
              <th className="px-4 py-3">No. of Referrals</th>
              <th className="px-4 py-3">Reward</th>
            </tr>
          </thead>
          <tbody>
            {!applied ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  Select a month and click Continue to view referral payouts.
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  No referrals for {monthLabel}.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.referrerId} className="border-b border-slate-100 text-sm">
                  <td className="px-4 py-4">
                    <a
                      href={`/students/${r.referrerId}`}
                      className="font-bold text-slate-800 hover:text-brand-600 hover:underline [overflow-wrap:anywhere]"
                    >
                      {r.referrer}
                    </a>
                    <p className="text-xs tabular-nums text-slate-500">ID: {r.referrerId}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {r.mode}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 [overflow-wrap:anywhere]">{r.details}</td>
                  <td className="px-4 py-4 tabular-nums text-slate-700">{r.count}</td>
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-800">
                    {formatCommission(r.reward)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[120] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
