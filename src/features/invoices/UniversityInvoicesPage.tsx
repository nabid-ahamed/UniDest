import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Mail,
  Trash2,
  BadgeCheck,
  Wallet,
  FilePlus2,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { pickTextColor } from '../../lib/contrast'
import { ExportButtons } from '../../components/ExportButtons'
import { Field, PageBtn, SingleSelect } from '../../components/DataTableUI'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { applications, applicationStatuses, applicationChannels, intakes } from '../../mock/applications'
import {
  universityInvoices,
  invoiceUniversities,
  invoiceStatuses,
  invoiceCurrencies,
  paymentLabels,
  isInvoiceable,
  invoiceCountForApplication,
  formatMoney,
  addInvoice,
  updateInvoice,
  deleteInvoice,
  type UniversityInvoice,
} from '../../mock/invoices'

const TABS = ['Invoices', 'University Applications'] as const
const PAGE_SIZES = [25, 50, 100]

const statusPill = (status: string) =>
  status === 'Paid' ? 'text-emerald-600' : 'text-rose-600'

export default function UniversityInvoicesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Invoices')
  const [toast, setToast] = useState('')
  // A bump counter forces the memoised lists to recompute after a mutation,
  // since the underlying arrays are module singletons.
  const [rev, setRev] = useState(0)
  const bump = () => setRev((n) => n + 1)

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h1 className="text-xl font-bold text-slate-900">University Invoices</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        {tab === 'Invoices'
          ? 'Invoices to university / apply through agent for your referred students.'
          : 'Raise an invoice to the university / apply through agent for students referred by you.'}
      </p>

      {/* Tabs */}
      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors',
              tab === t
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'Invoices' ? (
          <InvoicesTab key={`inv-${rev}`} onToast={showToast} onMutate={bump} onGoApplications={() => setTab('University Applications')} />
        ) : (
          <ApplicationsTab
            key={`app-${rev}`}
            onToast={showToast}
            onCreated={() => {
              bump()
              setTab('Invoices')
            }}
          />
        )}
      </div>

      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[120] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Invoices tab                                                        */
/* ------------------------------------------------------------------ */

function InvoicesTab({
  onToast,
  onMutate,
  onGoApplications,
}: {
  onToast: (msg: string) => void
  onMutate: () => void
  onGoApplications: () => void
}) {
  const [search, setSearch] = useState('')
  const [tableSearch, setTableSearch] = useState('')
  const [university, setUniversity] = useState('')
  const [status, setStatus] = useState('')
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [viewInvoice, setViewInvoice] = useState<UniversityInvoice | null>(null)
  const [payInvoice, setPayInvoice] = useState<UniversityInvoice | null>(null)
  const [deleteInvoiceRow, setDeleteInvoiceRow] = useState<UniversityInvoice | null>(null)

  const clearFilters = () => {
    setSearch('')
    setUniversity('')
    setStatus('')
    setPage(1)
  }

  const filtered = useMemo(() => {
    const top = search.trim().toLowerCase()
    const tbl = tableSearch.trim().toLowerCase()
    return universityInvoices.filter((inv) => {
      if (university && inv.university !== university) return false
      if (status && inv.status !== status) return false
      const hay = `${inv.id} ${inv.university} ${inv.country} ${inv.student} ${inv.agent ?? ''} ${inv.appliedThrough}`.toLowerCase()
      if (top && !hay.includes(top)) return false
      if (tbl && !`${hay} ${inv.date} ${inv.status} ${inv.currency}${inv.amount}`.toLowerCase().includes(tbl))
        return false
      return true
    })
  }, [search, tableSearch, university, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  const exportHeader = ['Date', 'Invoice #', 'University', 'Student', 'Amount', 'Status']
  const exportRows = filtered.map((inv) => [
    inv.date,
    inv.id,
    `${inv.university}, ${inv.country}`,
    inv.student,
    formatMoney(inv.currency, inv.amount),
    inv.status,
  ])

  const recordPayment = (amount: number, date: string, note: string) => {
    if (!payInvoice) return
    updateInvoice({
      ...payInvoice,
      status: 'Paid',
      nextPayment: null,
      payments: [...payInvoice.payments, { label: payInvoice.paymentLabel, amount, date, note }],
    })
    onToast(`Payment recorded for invoice #${payInvoice.id}`)
    setPayInvoice(null)
    onMutate()
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="grid grid-cols-1 items-end gap-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
        <Field label="Search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by Invoice No, University"
              className="input w-full pl-9"
            />
          </div>
        </Field>
        <Field label="University">
          <SingleSelect
            options={invoiceUniversities}
            value={university}
            onChange={(v) => {
              setUniversity(v)
              setPage(1)
            }}
            placeholder="All Universities"
          />
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
            {invoiceStatuses.map((s) => (
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
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
            title="University Invoices"
            filename="university-invoices"
            header={exportHeader}
            rows={exportRows}
            onDone={onToast}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Invoice #</th>
              <th className="px-4 py-3">Invoice To / Application Details</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((inv) => (
              <tr key={inv.id} className="border-b border-slate-100 align-top text-sm">
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">{inv.date}</td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => setViewInvoice(inv)}
                    className="font-semibold text-brand-600 hover:underline"
                  >
                    {inv.id}
                  </button>
                </td>
                <td className="px-4 py-4 text-slate-700">
                  <p className="font-bold text-slate-800 [overflow-wrap:anywhere]">
                    {inv.university}, {inv.country}
                  </p>
                  {inv.agent && <p className="text-slate-500">(Master Agent)</p>}
                  <p className="text-slate-500">({inv.paymentLabel})</p>
                  <p className="text-slate-500">Appl ID: {inv.applicationId}</p>
                  <p className="text-slate-500">University: {inv.university}</p>
                  <p className="text-slate-500">Student: {inv.student}</p>
                  {inv.agent && <p className="text-slate-500">Agent: {inv.agent}</p>}
                  {inv.nextPayment && (
                    <p className="mt-1 text-slate-400">Next Payment: {inv.nextPayment}</p>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-800">
                  {formatMoney(inv.currency, inv.amount)}
                </td>
                <td className="px-4 py-4">
                  <span className={cn('font-semibold', statusPill(inv.status))}>{inv.status}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <ActionIcon
                        icon={Eye}
                        label="View"
                        onClick={() => setViewInvoice(inv)}
                        className="border-brand-300 text-brand-600 hover:border-brand-600 hover:bg-brand-600 hover:text-white"
                      />
                      {inv.status !== 'Paid' && (
                        <ActionIcon
                          icon={Wallet}
                          label="Record Payment"
                          onClick={() => setPayInvoice(inv)}
                          className="border-sky-300 text-sky-600 hover:border-sky-600 hover:bg-sky-600 hover:text-white"
                        />
                      )}
                      <ActionIcon
                        icon={Download}
                        label="Download"
                        onClick={() => {
                          downloadInvoicePdf(inv)
                          onToast(`Invoice #${inv.id} downloaded`)
                        }}
                        className="border-amber-300 text-amber-600 hover:border-amber-600 hover:bg-amber-600 hover:text-white"
                      />
                      <ActionIcon
                        icon={Mail}
                        label="Send Email"
                        onClick={() => onToast(`Invoice #${inv.id} emailed to ${inv.student}`)}
                        className="border-emerald-300 text-emerald-600 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
                      />
                      <ActionIcon
                        icon={Trash2}
                        label="Delete"
                        onClick={() => setDeleteInvoiceRow(inv)}
                        className="border-rose-300 text-rose-600 hover:border-rose-600 hover:bg-rose-600 hover:text-white"
                      />
                    </div>
                    {inv.agentInvoiceRequested && (
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">
                        <BadgeCheck className="h-3.5 w-3.5" /> Agent Invoice Requested
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                  No invoices found.
                  <button onClick={onGoApplications} className="ml-1 font-semibold text-brand-600 hover:underline">
                    Raise one from an application
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-500">
          Showing {from} to {to} of {filtered.length} entries
        </p>
        <Pagination current={currentPage} total={totalPages} onChange={setPage} />
      </div>

      {/* Modals */}
      {viewInvoice && <ViewInvoiceModal invoice={viewInvoice} onClose={() => setViewInvoice(null)} />}
      {payInvoice && (
        <RecordPaymentModal invoice={payInvoice} onClose={() => setPayInvoice(null)} onSave={recordPayment} />
      )}
      {deleteInvoiceRow &&
        createPortal(
          <ConfirmDialog
            open
            title="Delete this invoice?"
            message={
              <>
                Invoice <span className="font-medium text-slate-700">#{deleteInvoiceRow.id}</span> (
                {deleteInvoiceRow.university} — {deleteInvoiceRow.student}) will be removed permanently.
              </>
            }
            confirmLabel="Delete"
            onConfirm={() => {
              deleteInvoice(deleteInvoiceRow.id)
              onToast(`Invoice #${deleteInvoiceRow.id} deleted`)
              setDeleteInvoiceRow(null)
              onMutate()
            }}
            onCancel={() => setDeleteInvoiceRow(null)}
          />,
          document.body,
        )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* University Applications tab                                         */
/* ------------------------------------------------------------------ */

function ApplicationsTab({
  onToast,
  onCreated,
}: {
  onToast: (msg: string) => void
  onCreated: () => void
}) {
  const [intake, setIntake] = useState('')
  const [university, setUniversity] = useState('')
  const [appliedThrough, setAppliedThrough] = useState('')
  const [noInvoicesOnly, setNoInvoicesOnly] = useState(false)
  const [tableSearch, setTableSearch] = useState('')
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [createFor, setCreateFor] = useState<(typeof eligible)[number] | null>(null)

  const eligible = useMemo(() => applications.filter(isInvoiceable), [])

  const clearFilters = () => {
    setIntake('')
    setUniversity('')
    setAppliedThrough('')
    setNoInvoicesOnly(false)
    setPage(1)
  }

  const filtered = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    return eligible.filter((a) => {
      if (intake && a.intake !== intake) return false
      if (university && a.university !== university) return false
      if (appliedThrough && a.appliedThrough !== appliedThrough) return false
      if (noInvoicesOnly && invoiceCountForApplication(a.id) > 0) return false
      if (q) {
        const hay = `${a.id} ${a.student} ${a.university} ${a.country} ${a.course}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [eligible, intake, university, appliedThrough, noInvoicesOnly, tableSearch])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  const universities = [...new Set(eligible.map((a) => a.university))].sort()

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-slate-600">
        Offer Letter Received &amp; Payment Received applications are shown on this page.
      </p>

      {/* Filter bar */}
      <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
          <Field label="Intake">
            <SingleSelect
              options={intakes}
              value={intake}
              onChange={(v) => {
                setIntake(v)
                setPage(1)
              }}
              placeholder="All Intakes"
            />
          </Field>
          <Field label="University">
            <SingleSelect
              options={universities}
              value={university}
              onChange={(v) => {
                setUniversity(v)
                setPage(1)
              }}
              placeholder="All Universities"
            />
          </Field>
          <Field label="Applied Through">
            <select
              value={appliedThrough}
              onChange={(e) => {
                setAppliedThrough(e.target.value)
                setPage(1)
              }}
              className="input"
            >
              <option value="">All</option>
              {applicationChannels.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <button
            onClick={clearFilters}
            className="self-end rounded-lg border border-brand-300 bg-white px-6 py-2.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
          >
            Clear
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={noInvoicesOnly}
            onChange={(e) => {
              setNoInvoicesOnly(e.target.checked)
              setPage(1)
            }}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Applications with no invoices
        </label>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
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
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={tableSearch}
            onChange={(e) => {
              setTableSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search..."
            aria-label="Search applications"
            className="input w-full pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Date Created</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((a) => {
              const color =
                applicationStatuses.find((s) => s.label === a.status)?.color ?? a.statusColor
              const count = invoiceCountForApplication(a.id)
              return (
                <tr key={a.id} className="border-b border-slate-100 align-top text-sm">
                  <td className="px-4 py-4 font-semibold tabular-nums text-brand-600">{a.id}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{a.dateCreated}</td>
                  <td className="px-4 py-4 font-bold text-slate-800 [overflow-wrap:anywhere]">
                    {a.student}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-700">{a.country}</td>
                  <td className="px-4 py-4 text-slate-600">
                    <p className="font-bold text-slate-800 [overflow-wrap:anywhere]">{a.university}</p>
                    <p>{a.course}</p>
                    <p>Intake: {a.intake}</p>
                    <p>Applied Through: {a.appliedThrough}</p>
                    <p className="mt-1 text-slate-400">Invoices Created: {count}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className="whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold"
                      style={{ backgroundColor: color, color: pickTextColor(color) }}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => setCreateFor(a)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      <FilePlus2 className="h-4 w-4" /> Create Invoice
                    </button>
                  </td>
                </tr>
              )
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                  No applications ready for invoicing.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-500">
          Showing {from} to {to} of {filtered.length} entries
        </p>
        <Pagination current={currentPage} total={totalPages} onChange={setPage} />
      </div>

      {createFor && (
        <CreateInvoiceModal
          application={createFor}
          onClose={() => setCreateFor(null)}
          onCreate={(payload) => {
            const inv = addInvoice(payload)
            onToast(`Invoice #${inv.id} created for ${createFor.student}`)
            setCreateFor(null)
            onCreated()
          }}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

function Pagination({
  current,
  total,
  onChange,
}: {
  current: number
  total: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <PageBtn onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1}>
        <ChevronLeft className="h-4 w-4" />
      </PageBtn>
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={cn(
            'h-8 min-w-8 rounded-md px-2 text-sm font-medium',
            n === current ? 'bg-brand-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
          )}
        >
          {n}
        </button>
      ))}
      <PageBtn onClick={() => onChange(Math.min(total, current + 1))} disabled={current === total}>
        <ChevronRight className="h-4 w-4" />
      </PageBtn>
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

function ViewInvoiceModal({ invoice, onClose }: { invoice: UniversityInvoice; onClose: () => void }) {
  const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
  const rows: [string, string][] = [
    ['Invoice #', String(invoice.id)],
    ['Date', invoice.date],
    ['University', `${invoice.university}, ${invoice.country}`],
    ['Student', invoice.student],
    ['Application ID', String(invoice.applicationId)],
    ['Applied Through', invoice.appliedThrough],
    ...(invoice.agent ? ([['Agent (Master Agent)', invoice.agent]] as [string, string][]) : []),
    ['Payment', invoice.paymentLabel],
    ['Amount', formatMoney(invoice.currency, invoice.amount)],
    ['Status', invoice.status],
    ...(invoice.nextPayment ? ([['Next Payment', invoice.nextPayment]] as [string, string][]) : []),
  ]
  return (
    <ModalShell title={`Invoice #${invoice.id}`} onClose={onClose} wide>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-slate-100 pb-2 text-sm">
            <dt className="text-slate-500">{k}</dt>
            <dd className="text-right font-semibold text-slate-800 [overflow-wrap:anywhere]">{v}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-5 text-sm font-bold text-slate-800">Payment History</h3>
      {invoice.payments.length ? (
        <table className="mt-2 w-full border border-slate-200 text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left font-semibold text-slate-600">
              <th className="px-3 py-2">Instalment</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {invoice.payments.map((p, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="px-3 py-2 text-slate-700">{p.label}</td>
                <td className="px-3 py-2 text-slate-600">{p.date}</td>
                <td className="px-3 py-2 font-medium text-slate-800">{formatMoney(invoice.currency, p.amount)}</td>
                <td className="px-3 py-2 text-slate-500">{p.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-2 text-sm text-slate-500">No payments recorded yet.</p>
      )}
      <p className="mt-3 text-sm text-slate-600">
        <span className="font-semibold">Paid:</span> {formatMoney(invoice.currency, paid)} /{' '}
        {formatMoney(invoice.currency, invoice.amount)}
      </p>

      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={() => downloadInvoicePdf(invoice)}
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

function RecordPaymentModal({
  invoice,
  onClose,
  onSave,
}: {
  invoice: UniversityInvoice
  onClose: () => void
  onSave: (amount: number, date: string, note: string) => void
}) {
  const [amount, setAmount] = useState(String(invoice.amount))
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
          {invoice.student} · {invoice.university} · {formatMoney(invoice.currency, invoice.amount)}
        </p>
        <div>
          <label htmlFor="pay-amount" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Amount ({invoice.currency}) <span className="text-rose-600">*</span>
          </label>
          <input
            id="pay-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={cn('input', tried && (!Number(amount) || Number(amount) <= 0) && 'border-rose-500')}
          />
        </div>
        <div>
          <label htmlFor="pay-date" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Payment Date <span className="text-rose-600">*</span>
          </label>
          <input
            id="pay-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={cn('input', tried && !date && 'border-rose-500')}
          />
        </div>
        <div>
          <label htmlFor="pay-note" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Note
          </label>
          <input id="pay-note" value={note} onChange={(e) => setNote(e.target.value)} className="input" />
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

function CreateInvoiceModal({
  application,
  onClose,
  onCreate,
}: {
  application: (typeof applications)[number]
  onClose: () => void
  onCreate: (payload: Omit<UniversityInvoice, 'id'>) => void
}) {
  const [currency, setCurrency] = useState(invoiceCurrencies[0])
  const [amount, setAmount] = useState('')
  const [paymentLabel, setPaymentLabel] = useState(paymentLabels[0])
  const [throughAgent, setThroughAgent] = useState(Boolean(application.agent))
  const [nextPayment, setNextPayment] = useState('')
  const [tried, setTried] = useState(false)

  const submit = () => {
    setTried(true)
    const value = Number(amount)
    if (!value || value <= 0) return
    const now = new Date()
    const date =
      new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
        .format(now)
        .replace(/\//g, '-') +
      ' ' +
      new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        .format(now)
        .toLowerCase()
    onCreate({
      date,
      applicationId: application.id,
      university: application.university,
      country: application.country,
      student: application.student,
      agent: throughAgent ? application.agent ?? 'Master Agent' : null,
      appliedThrough: application.appliedThrough,
      paymentLabel,
      currency,
      amount: value,
      status: 'Due',
      nextPayment: nextPayment
        ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(
            new Date(nextPayment),
          )
        : null,
      agentInvoiceRequested: throughAgent,
      payments: [],
    })
  }

  return (
    <ModalShell title="Create Invoice" onClose={onClose} wide>
      <div className="space-y-4">
        <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">
          <p className="font-bold">{application.university}, {application.country}</p>
          <p>Student: {application.student} · Appl ID: {application.id}</p>
          <p>{application.course} · Intake: {application.intake} · {application.appliedThrough}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Payment">
            <select value={paymentLabel} onChange={(e) => setPaymentLabel(e.target.value)} className="input">
              {paymentLabels.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Currency">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input">
              {invoiceCurrencies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <div>
            <label htmlFor="ci-amount" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Amount <span className="text-rose-600">*</span>
            </label>
            <input
              id="ci-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1500"
              className={cn('input', tried && (!Number(amount) || Number(amount) <= 0) && 'border-rose-500')}
            />
            {tried && (!Number(amount) || Number(amount) <= 0) && (
              <p role="alert" className="mt-1.5 text-sm text-rose-600">
                Please enter a valid amount.
              </p>
            )}
          </div>
          <Field label="Next Payment (optional)">
            <input type="date" value={nextPayment} onChange={(e) => setNextPayment(e.target.value)} className="input" />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={throughAgent}
            onChange={(e) => setThroughAgent(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Apply through agent (raise agent invoice request)
        </label>
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
            Create Invoice
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

/** Generate a printable one-page PDF for an invoice (reuses jsPDF like the profile export). */
function downloadInvoicePdf(inv: UniversityInvoice) {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text('GlobalEd — University Invoice', 14, 20)
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(`Invoice #${inv.id}`, 14, 30)
  doc.text(inv.date, 196, 30, { align: 'right' })

  autoTable(doc, {
    startY: 40,
    theme: 'grid',
    head: [['Field', 'Value']],
    body: [
      ['University', `${inv.university}, ${inv.country}`],
      ['Student', inv.student],
      ['Application ID', String(inv.applicationId)],
      ['Applied Through', inv.appliedThrough],
      ...(inv.agent ? [['Agent (Master Agent)', inv.agent]] : []),
      ['Payment', inv.paymentLabel],
      ['Amount', formatMoney(inv.currency, inv.amount)],
      ['Status', inv.status],
      ...(inv.nextPayment ? [['Next Payment', inv.nextPayment]] : []),
    ],
    headStyles: { fillColor: [37, 99, 235] },
  })

  doc.save(`invoice-${inv.id}.pdf`)
}
