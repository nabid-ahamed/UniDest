import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  Plus,
  Power,
  Trash2,
  Filter as FilterIcon,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { PageBtn } from '../../components/DataTableUI'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  workflows,
  campaigns,
  campaignStatuses,
  messageCount,
  toggleWorkflowStatus,
  deleteWorkflow,
  deleteCampaign,
  audienceSummary,
  type Workflow,
  type Campaign,
} from '../../mock/automation'

const TABS = ['Workflows', 'Campaigns'] as const
const PAGE_SIZES = [50, 100, 200]

export default function AutomationPage() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const tab: (typeof TABS)[number] = pathname.includes('/automation/campaigns') ? 'Campaigns' : 'Workflows'
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h1 className="text-xl font-bold text-slate-900">{tab}</h1>

      {/* Tabs */}
      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => navigate(t === 'Campaigns' ? '/automation/campaigns' : '/automation')}
            className={cn(
              'rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors',
              tab === t ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'Workflows' ? (
          <WorkflowsTab onToast={showToast} />
        ) : (
          <CampaignsTab onToast={showToast} />
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
/* Shared row-action menu (eye + 3-dot dropdown)                       */
/* ------------------------------------------------------------------ */

function RowActions({
  viewHref,
  items,
}: {
  viewHref: string
  items: { label: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void; danger?: boolean }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative inline-flex items-center gap-1">
      <a
        href={viewHref}
        aria-label="View details"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500 text-white transition-colors hover:bg-sky-600"
      >
        <Eye className="h-4 w-4" />
      </a>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-600 text-white transition-colors hover:bg-slate-700"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              onClick={() => {
                it.onClick()
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors',
                it.danger
                  ? 'text-rose-600 hover:bg-rose-50'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-brand-600',
              )}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Toolbar({
  pageSize,
  onPageSize,
  search,
  onSearch,
  searchLabel,
}: {
  pageSize: number
  onPageSize: (n: number) => void
  search: string
  onSearch: (s: string) => void
  searchLabel: string
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <label className="flex items-center gap-2 text-sm text-slate-600 md:flex-1">
        Show
        <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="input w-20 py-1.5">
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        entries
      </label>
      <div className="flex justify-end md:flex-1">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search..."
            aria-label={searchLabel}
            className="input w-full pl-9"
          />
        </div>
      </div>
    </div>
  )
}

function Pagination({
  from,
  to,
  total,
  page,
  totalPages,
  onPage,
}: {
  from: number
  to: number
  total: number
  page: number
  totalPages: number
  onPage: (n: number) => void
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-slate-500">
        Showing {from} to {to} of {total} entries
      </p>
      <div className="flex items-center gap-1">
        <PageBtn onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}>
          <ChevronLeft className="h-4 w-4" />
        </PageBtn>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onPage(n)}
            className={cn(
              'h-8 min-w-8 rounded-md px-2 text-sm font-medium',
              n === page ? 'bg-brand-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
            )}
          >
            {n}
          </button>
        ))}
        <PageBtn onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
          <ChevronRight className="h-4 w-4" />
        </PageBtn>
      </div>
    </div>
  )
}

const ModePill = ({ mode }: { mode: string }) => {
  const color =
    mode === 'Email'
      ? 'bg-sky-50 text-sky-700'
      : mode === 'SMS'
        ? 'bg-violet-50 text-violet-700'
        : 'bg-emerald-50 text-emerald-700'
  return <span className={cn('rounded-md px-2.5 py-1 text-xs font-semibold', color)}>{mode}</span>
}

const StatusBadge = ({ active }: { active: boolean }) => (
  <span
    className={cn(
      'rounded-md px-2.5 py-1 text-xs font-semibold',
      active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
    )}
  >
    {active ? 'Active' : 'Inactive'}
  </span>
)

/* ------------------------------------------------------------------ */
/* Workflows tab                                                       */
/* ------------------------------------------------------------------ */

function WorkflowsTab({ onToast }: { onToast: (msg: string) => void }) {
  const [rev, setRev] = useState(0)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(50)
  const [page, setPage] = useState(1)
  const [confirm, setConfirm] = useState<Workflow | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return workflows
    return workflows.filter((w) =>
      `${w.title} ${w.mode} ${w.type} ${w.status}`.toLowerCase().includes(q),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, rev])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <a
          href="/automation/create/workflow"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> New Workflow
        </a>
      </div>

      <Toolbar
        pageSize={pageSize}
        onPageSize={(n) => {
          setPageSize(n)
          setPage(1)
        }}
        search={search}
        onSearch={(s) => {
          setSearch(s)
          setPage(1)
        }}
        searchLabel="Search workflows"
      />

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[880px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">No. of Messages</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((w) => (
              <tr key={w.id} className="border-b border-slate-100 text-sm">
                <td className="px-4 py-4">
                  <a
                    href={`/automation/workflow/${w.id}`}
                    className="font-bold text-slate-800 hover:text-brand-600 hover:underline [overflow-wrap:anywhere]"
                  >
                    {w.title}
                  </a>
                </td>
                <td className="px-4 py-4">
                  <ModePill mode={w.mode} />
                </td>
                <td className="px-4 py-4 text-slate-600">{w.type}</td>
                <td className="px-4 py-4 tabular-nums text-slate-600">{messageCount(w)}</td>
                <td className="px-4 py-4">
                  <StatusBadge active={w.status === 'Active'} />
                </td>
                <td className="px-4 py-4">
                  <RowActions
                    viewHref={`/automation/workflow/${w.id}`}
                    items={[
                      {
                        label: w.status === 'Active' ? 'Deactivate' : 'Activate',
                        icon: Power,
                        onClick: () => {
                          toggleWorkflowStatus(w.id)
                          onToast(`Workflow ${w.status === 'Active' ? 'deactivated' : 'activated'}`)
                          setRev((n) => n + 1)
                        },
                      },
                      { label: 'Delete', icon: Trash2, danger: true, onClick: () => setConfirm(w) },
                    ]}
                  />
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                  No workflows found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        from={from}
        to={to}
        total={filtered.length}
        page={currentPage}
        totalPages={totalPages}
        onPage={setPage}
      />

      <ConfirmDialog
        open={confirm !== null}
        title="Delete workflow"
        message={`Delete "${confirm?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            deleteWorkflow(confirm.id)
            onToast('Workflow deleted')
            setConfirm(null)
            setRev((n) => n + 1)
          }
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Campaigns tab                                                       */
/* ------------------------------------------------------------------ */

const campaignStatusColor: Record<string, string> = {
  Queued: 'bg-emerald-100 text-emerald-700',
  Sent: 'bg-sky-100 text-sky-700',
  Draft: 'bg-slate-100 text-slate-600',
  Failed: 'bg-rose-100 text-rose-700',
}

function CampaignsTab({ onToast }: { onToast: (msg: string) => void }) {
  const [rev, setRev] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [applied, setApplied] = useState('')
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(50)
  const [page, setPage] = useState(1)
  const [confirm, setConfirm] = useState<Campaign | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return campaigns
      .filter((c) => !applied || c.status === applied)
      .filter((c) => !q || `${c.title} ${c.mode} ${c.status} ${c.scheduledAt}`.toLowerCase().includes(q))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, applied, rev])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  return (
    <div>
      {/* Status filter + New Campaign */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="cp-status" className="mb-1 block text-xs font-medium text-slate-600">
              Status
            </label>
            <select
              id="cp-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-52"
            >
              <option value="">Select</option>
              {campaignStatuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setApplied(statusFilter)
              setPage(1)
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <FilterIcon className="h-4 w-4" /> Filter
          </button>
          <button
            onClick={() => {
              setStatusFilter('')
              setApplied('')
              setPage(1)
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
        <a
          href="/automation/create/campaign"
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 sm:self-auto"
        >
          <Plus className="h-4 w-4" /> New Campaign
        </a>
      </div>

      <div className="mt-4">
        <Toolbar
          pageSize={pageSize}
          onPageSize={(n) => {
            setPageSize(n)
            setPage(1)
          }}
          search={search}
          onSearch={(s) => {
            setSearch(s)
            setPage(1)
          }}
          searchLabel="Search campaigns"
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Scheduled/Sent At</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Sent To</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 text-sm">
                <td className="px-4 py-4">
                  <a
                    href={`/automation/campaign/${c.id}`}
                    className="font-bold text-slate-800 hover:text-brand-600 hover:underline [overflow-wrap:anywhere]"
                  >
                    {c.title}
                  </a>
                  <p className="text-xs text-slate-500">{audienceSummary(c.audience)}</p>
                </td>
                <td className="px-4 py-4">
                  <span className={cn('rounded-md px-2.5 py-1 text-xs font-semibold', campaignStatusColor[c.status])}>
                    {c.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">{c.scheduledAt}</td>
                <td className="px-4 py-4">
                  <ModePill mode={c.mode} />
                </td>
                <td className="px-4 py-4 tabular-nums text-slate-600">{c.sentTo}</td>
                <td className="px-4 py-4">
                  <RowActions
                    viewHref={`/automation/campaign/${c.id}`}
                    items={[{ label: 'Delete', icon: Trash2, danger: true, onClick: () => setConfirm(c) }]}
                  />
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                  No campaigns found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        from={from}
        to={to}
        total={filtered.length}
        page={currentPage}
        totalPages={totalPages}
        onPage={setPage}
      />

      <ConfirmDialog
        open={confirm !== null}
        title="Delete campaign"
        message={`Delete "${confirm?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            deleteCampaign(confirm.id)
            onToast('Campaign deleted')
            setConfirm(null)
            setRev((n) => n + 1)
          }
        }}
      />
    </div>
  )
}
