import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, ChevronLeft, ChevronRight, BadgeDollarSign } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ExportButtons } from '../../components/ExportButtons'
import { PageBtn } from '../../components/DataTableUI'
import {
  referralSignups,
  referralCurrency,
  formatCommission,
  setReferralCommission,
  type ReferralSignup,
} from '../../mock/referrals'

const PAGE_SIZES = [10, 25, 50, 100]

export default function ReferralSignupsPage() {
  const [rev, setRev] = useState(0)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<ReferralSignup | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return referralSignups
    return referralSignups.filter((r) =>
      `${r.id} ${r.date} ${r.student} ${r.studentId} ${r.referrer ?? ''} ${r.referrerId ?? ''}`
        .toLowerCase()
        .includes(q),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, rev])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  const exportHeader = ['SI No.', 'Date', 'Name', 'Refered By', 'Commission']
  const exportRows = filtered.map((r, i) => [
    i + 1,
    r.date,
    `${r.student} (ID: ${r.studentId})`,
    r.referrer ? `${r.referrer} (ID: ${r.referrerId})` : `ID: ${r.referrerId ?? '--'}`,
    r.commission != null ? formatCommission(r.commission) : '--',
  ])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h1 className="text-xl font-bold text-slate-900">Student Referral Signups</h1>

      {/* Toolbar */}
      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
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
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search..."
              aria-label="Search referral signups"
              className="input w-full pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 md:flex-1 md:justify-end">
          <ExportButtons
            title="Student Referral Signups"
            filename="referral-signups"
            header={exportHeader}
            rows={exportRows}
            onDone={showToast}
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">SI No.</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Refered By</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr key={r.id} className="border-b border-slate-100 align-top text-sm">
                <td className="px-4 py-4 tabular-nums text-slate-600">
                  {(currentPage - 1) * pageSize + i + 1}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">{r.date}</td>
                <td className="px-4 py-4">
                  <a
                    href={`/students/${r.studentId}`}
                    className="font-bold text-slate-800 hover:text-brand-600 hover:underline [overflow-wrap:anywhere]"
                  >
                    {r.student}
                  </a>
                  <p className="text-xs tabular-nums text-slate-500">ID: {r.studentId}</p>
                </td>
                <td className="px-4 py-4">
                  {r.referrer ? (
                    <a
                      href={`/students/${r.referrerId}`}
                      className="font-medium text-slate-700 hover:text-brand-600 hover:underline [overflow-wrap:anywhere]"
                    >
                      {r.referrer}
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                  <p className="text-xs tabular-nums text-slate-500">ID: {r.referrerId ?? '--'}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  {r.commission != null ? (
                    <span className="font-semibold text-slate-800">
                      {formatCommission(r.commission)}
                    </span>
                  ) : (
                    <span className="text-slate-400">--</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => setEditing(r)}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                  >
                    <BadgeDollarSign className="h-4 w-4" /> Set/Update Commission
                  </button>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                  No referral signups found.
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

      {/* Set/Update Referral Amount modal */}
      {editing && (
        <CommissionModal
          signup={editing}
          onClose={() => setEditing(null)}
          onSave={(amount) => {
            setReferralCommission(editing.id, amount)
            showToast(`Referral commission set for ${editing.student}`)
            setEditing(null)
            setRev((n) => n + 1)
          }}
        />
      )}

      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[120] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

function CommissionModal({
  signup,
  onClose,
  onSave,
}: {
  signup: ReferralSignup
  onClose: () => void
  onSave: (amount: number) => void
}) {
  const [amount, setAmount] = useState(signup.commission != null ? String(signup.commission) : '')
  const [tried, setTried] = useState(false)

  const submit = () => {
    setTried(true)
    const value = Number(amount)
    if (!value || value <= 0) return
    onSave(value)
  }

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="animate-fade-in absolute inset-0 bg-slate-500/60" onClick={onClose} />
      <div className="animate-dialog-in relative w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">Set/Update Referral Amount</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
            {signup.student}
            {signup.referrer && <> · referred by {signup.referrer}</>}
          </p>
          <div>
            <label htmlFor="ref-amount" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Amount ({referralCurrency}) <span className="text-rose-600">*</span>
            </label>
            <input
              id="ref-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className={cn('input', tried && (!Number(amount) || Number(amount) <= 0) && 'border-rose-500')}
            />
            {tried && (!Number(amount) || Number(amount) <= 0) && (
              <p role="alert" className="mt-1.5 text-sm text-rose-600">
                Please enter a valid amount.
              </p>
            )}
          </div>
          <div className="flex justify-center pt-1">
            <button
              onClick={submit}
              className="rounded-lg bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
