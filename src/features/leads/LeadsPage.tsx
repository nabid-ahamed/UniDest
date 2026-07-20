import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus,
  RefreshCw,
  UploadCloud,
  Filter,
  Search,
  Printer,
  Copy,
  Table,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { cn } from '../../lib/cn'
import { MultiSelect } from '../../components/MultiSelect'
import type { Lead } from '../../mock/leads'
import {
  leads,
  leadStatuses,
  leadStaff,
  leadCountries,
  leadBranches,
  allCountries,
  studyLevels,
  coursesInterested,
  intakes,
  followupDateOptions,
  leadSources,
  services,
  recentTags as initialRecentTags,
} from '../../mock/leads'
import { LeadRow } from './components/LeadRow'
import { AddTagDialog } from './components/AddTagDialog'
import { AlertDialog } from '../../components/ui/AlertDialog'

/** A lead may carry at most this many tags. */
const MAX_TAGS = 5

const PAGE_SIZES = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 1000, label: '100+' },
]

/** Excel logo-style mark (lucide has no brand icon). */
function ExcelIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <path d="M14 4v16" />
      <path d="M6 8.5l5 7M11 8.5l-5 7" />
    </svg>
  )
}

/** PDF document mark with "PDF" label (lucide has no brand icon). */
function PdfIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <text
        x="12"
        y="17.5"
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        PDF
      </text>
    </svg>
  )
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const EXPORTS = [
  { label: 'Copy', icon: Copy, btn: 'hover:border-slate-600 hover:bg-slate-600', tip: 'bg-slate-700' },
  { label: 'Excel', icon: ExcelIcon, btn: 'hover:border-emerald-600 hover:bg-emerald-600', tip: 'bg-emerald-600' },
  { label: 'CSV', icon: Table, btn: 'hover:border-sky-600 hover:bg-sky-600', tip: 'bg-sky-600' },
  { label: 'PDF', icon: PdfIcon, btn: 'hover:border-rose-600 hover:bg-rose-600', tip: 'bg-rose-600' },
  { label: 'Print', icon: Printer, btn: 'hover:border-indigo-600 hover:bg-indigo-600', tip: 'bg-indigo-600' },
]

export default function LeadsPage() {
  const [search, setSearch] = useState('')
  const [statuses, setStatuses] = useState<string[]>([])
  const [countriesInterested, setCountriesInterested] = useState<string[]>([])
  const [intake, setIntake] = useState('')
  const [service, setService] = useState('')
  const [staff, setStaff] = useState('')
  const [branch, setBranch] = useState('All Branch')
  const [country, setCountry] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [filterOpen, setFilterOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [bulkAction, setBulkAction] = useState('')
  const [toast, setToast] = useState('')
  const [tagLead, setTagLead] = useState<Lead | null>(null)
  const [limitLead, setLimitLead] = useState<Lead | null>(null)
  const [recentTags, setRecentTags] = useState<string[]>(initialRecentTags)
  // Tags per lead id, seeded from the mock. Kept in state so add/remove works.
  const [leadTags, setLeadTags] = useState<Record<number, string[]>>(() =>
    Object.fromEntries(leads.map((l) => [l.id, l.tags ?? []])),
  )

  // Initial "fetch" preloader on mount.
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 700)
    return () => window.clearTimeout(t)
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2500)
  }

  const clearFilters = () => {
    setSearch('')
    setStatuses([])
    setCountriesInterested([])
    setIntake('')
    setService('')
    setStaff('')
    setBranch('All Branch')
    setCountry('')
    setPage(1)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setLoading(true)
    window.setTimeout(() => {
      setRefreshing(false)
      setLoading(false)
    }, 700)
    showToast('List refreshed')
  }

  const handleExport = (label: string) => {
    const header = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Assigned To', 'Branch', 'Created']
    const rows = filtered.map((l) => [
      l.id,
      l.name,
      l.email,
      l.phone,
      l.status,
      l.assignedTo ?? 'Unassigned',
      l.branch,
      l.created,
    ])
    if (label === 'Print') {
      const style =
        'body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}h2{margin:0 0 12px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}th{background:#1f47f5;color:#fff}'
      const table = `<h2>Leads</h2><table><thead><tr>${header
        .map((h) => `<th>${h}</th>`)
        .join('')}</tr></thead><tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`
      const w = window.open('', '_blank', 'width=920,height=680')
      if (!w) {
        showToast('Allow pop-ups to print')
        return
      }
      w.document.write(
        `<!doctype html><html><head><title>Leads</title><style>${style}</style></head><body>${table}</body></html>`,
      )
      w.document.close()
      w.focus()
      w.print()
      return
    }
    if (label === 'Copy') {
      const text = [header, ...rows].map((r) => r.join('\t')).join('\n')
      navigator.clipboard?.writeText(text)
      showToast(`Copied ${filtered.length} rows`)
    } else if (label === 'CSV') {
      const cell = (v: string | number) => {
        const s = String(v)
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      }
      const csv = [header, ...rows].map((r) => r.map(cell).join(',')).join('\n')
      downloadFile('leads.csv', csv, 'text/csv;charset=utf-8')
      showToast('CSV downloaded')
    } else if (label === 'Excel') {
      const html = `<table border="1">${[header, ...rows]
        .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
        .join('')}</table>`
      downloadFile('leads.xls', html, 'application/vnd.ms-excel')
      showToast('Excel downloaded')
    } else if (label === 'PDF') {
      const doc = new jsPDF()
      doc.setFontSize(14)
      doc.text('Leads', 14, 15)
      autoTable(doc, {
        head: [header],
        body: rows.map((r) => r.map(String)),
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [31, 71, 245] },
      })
      doc.save('leads.pdf')
      showToast('PDF downloaded')
    }
  }

  const applyBulk = () => {
    if (!bulkAction) return showToast('Choose a bulk action first')
    if (selected.size === 0) return showToast('Select at least one lead')
    showToast(`${bulkAction} — ${selected.size} lead(s)`)
    setBulkAction('')
  }

  const rowAction = (type: string, lead: Lead) => {
    if (type === 'Add tag') {
      // Block at the limit before opening the dialog, so the warning is never
      // stacked underneath it.
      if ((leadTags[lead.id] ?? []).length >= MAX_TAGS) return setLimitLead(lead)
      return setTagLead(lead)
    }
    showToast(`${type}: ${lead.name} (#${lead.id})`)
  }

  /** Attach a tag to the lead and move it to the front of the recent list. */
  const applyTag = (tag: string) => {
    if (!tagLead) return
    const current = leadTags[tagLead.id] ?? []
    const already = current.includes(tag)
    if (current.length >= MAX_TAGS) {
      setTagLead(null)
      setLimitLead(tagLead)
      return
    }
    if (already) {
      showToast(`"${tag}" is already on ${tagLead.name}`)
    } else {
      setLeadTags((prev) => ({ ...prev, [tagLead.id]: [...(prev[tagLead.id] ?? []), tag] }))
      setRecentTags((prev) => [tag, ...prev.filter((t) => t !== tag)].slice(0, 10))
      showToast(`Tag "${tag}" added to ${tagLead.name}`)
    }
    setTagLead(null)
  }

  const removeTag = (leadId: number, tag: string) => {
    setLeadTags((prev) => ({ ...prev, [leadId]: (prev[leadId] ?? []).filter((t) => t !== tag) }))
    showToast(`Tag "${tag}" removed`)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads.filter((l) => {
      if (statuses.length && !statuses.includes(l.status)) return false
      if (countriesInterested.length && !countriesInterested.includes(l.countryInterested))
        return false
      if (staff && l.assignedTo !== staff) return false
      if (branch !== 'All Branch' && l.branch !== branch) return false
      if (q) {
        const hay = `${l.id} ${l.name} ${l.email} ${l.phone} ${l.phoneNote}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [search, statuses, countriesInterested, staff, branch])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((l) => selected.has(l.id))

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) pageRows.forEach((l) => next.delete(l.id))
      else pageRows.forEach((l) => next.add(l.id))
      return next
    })
  }

  const resetToFirst = () => setPage(1)

  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  const activeFilterCount =
    statuses.length +
    countriesInterested.length +
    (staff ? 1 : 0) +
    (country ? 1 : 0) +
    (branch !== 'All Branch' ? 1 : 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Leads</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOpen(true)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors',
              activeFilterCount > 0
                ? 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700'
                : 'border-brand-300 bg-white text-brand-600 hover:bg-brand-50',
            )}
          >
            <Filter className="h-4 w-4" /> Filter
            {activeFilterCount > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-brand-600">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={handleRefresh}
            aria-label="Refresh"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </button>
          <button
            onClick={() => showToast('Import — coming soon')}
            aria-label="Import"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
          >
            <UploadCloud className="h-4 w-4" />
          </button>
          <a
            href="/leads/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> New Lead
          </a>
        </div>
      </div>

      {/* Filter modal */}
      {filterOpen &&
        createPortal(
      <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4">
        <div
          className="animate-fade-in absolute inset-0 bg-slate-500/60"
          onClick={() => setFilterOpen(false)}
        />
        <div className="animate-dialog-in relative my-8 w-full max-w-5xl rounded-xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-800">Filter Leads</h2>
            <button
              onClick={() => setFilterOpen(false)}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Lead Status">
            <MultiSelect
              options={leadStatuses.map((s) => s.label)}
              selected={statuses}
              onChange={(next) => {
                setStatuses(next)
                resetToFirst()
              }}
              placeholder="- Select -"
            />
          </Field>
          <Field label="Assigned To Staff">
            <select value={staff} onChange={(e) => { setStaff(e.target.value); resetToFirst() }} className="input">
              <option value="">- Select -</option>
              {leadStaff.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Country of Residence">
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="input">
              <option value="">- Select -</option>
              {leadCountries.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Branch">
            <select value={branch} onChange={(e) => { setBranch(e.target.value); resetToFirst() }} className="input">
              {leadBranches.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Advanced filters */}
        <div className="space-y-4 border-t border-slate-200 pt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Country Interested In">
                <MultiSelect
                  options={allCountries}
                  selected={countriesInterested}
                  onChange={(next) => {
                    setCountriesInterested(next)
                    resetToFirst()
                  }}
                  placeholder="- Select -"
                />
              </Field>
              <Field label="Study Level Interested">
                <select className="input" defaultValue="">
                  <option value="">Select Study Level</option>
                  {studyLevels.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Course Interested to Study In">
                <select className="input" defaultValue="">
                  <option value="">Select Course Interested</option>
                  {coursesInterested.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Intake">
                <SingleSelect
                  options={intakes}
                  value={intake}
                  onChange={setIntake}
                  placeholder="Intake"
                />
              </Field>

              <Field label="Service Interested In">
                <SingleSelect
                  options={services}
                  value={service}
                  onChange={setService}
                  placeholder="Select Service"
                />
              </Field>
              <Field label="Created Date">
                <input type="date" className="input" />
              </Field>
              <Field label="Next Follow-up/Counselling Date">
                <select className="input" defaultValue="">
                  <option value="">- Select -</option>
                  {followupDateOptions.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Lead Source">
                <select className="input" defaultValue="">
                  <option value="">Lead Source</option>
                  {leadSources.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>

              <Field label="Lead Age Greater Than">
                <input type="number" className="input" placeholder="Days" />
              </Field>
              <Field label="No Activity Since">
                <input type="number" className="input" placeholder="Days" />
              </Field>
              <Field label="Tags">
                <input className="input" placeholder="Tags" />
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                Leads with No Follow-up
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                My Leads Only
              </label>
            </div>

          </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
            <button
              onClick={clearFilters}
              className="rounded-lg border border-brand-300 bg-white px-6 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
            >
              Clear
            </button>
            <button
              onClick={() => setFilterOpen(false)}
              className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>,
          document.body,
        )}

      {/* Table card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center">
          <label className="flex items-center gap-2 text-sm text-slate-600 md:flex-1">
            Show
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                resetToFirst()
              }}
              className="input w-20 py-1.5"
            >
              {PAGE_SIZES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            entries
          </label>

          <div className="flex justify-center md:flex-[2] md:px-2">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  resetToFirst()
                }}
                placeholder="ID, Name, Mobile, Email, Lead Source/Details..."
                className="input w-full pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:flex-1 md:justify-end">
            <div className="hidden items-center gap-1.5 sm:flex">
              {EXPORTS.map((ex) => (
                <div key={ex.label} className="group relative">
                  <button
                    onClick={() => handleExport(ex.label)}
                    aria-label={ex.label}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:text-white',
                      ex.btn,
                    )}
                  >
                    <ex.icon className="h-4 w-4" />
                  </button>
                  <span
                    className={cn(
                      'pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100',
                      ex.tip,
                    )}
                  >
                    {ex.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table — horizontal scroll only below lg, so the sticky header can
            anchor to the page (an overflow container would trap it). */}
        <div className="overflow-x-auto lg:overflow-x-visible">
          <table className="w-full min-w-[900px]">
            <thead className="sticky top-16 z-10">
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-[0_1px_0_0_rgb(226_232_240)]">
                <th className="bg-slate-50 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
                <th className="bg-slate-50 px-3 py-3">ID</th>
                <th className="bg-slate-50 px-3 py-3">Lead</th>
                <th className="bg-slate-50 px-3 py-3">Next Followup</th>
                <th className="bg-slate-50 px-3 py-3">Status</th>
                <th className="bg-slate-50 px-3 py-3">Assigned to</th>
                <th className="bg-slate-50 px-3 py-3">Created</th>
                <th className="bg-slate-50 px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-16">
                    <DotsLoader />
                  </td>
                </tr>
              ) : (
                <>
                  {pageRows.map((lead) => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      tags={leadTags[lead.id] ?? []}
                      selected={selected.has(lead.id)}
                      onToggle={() => toggleOne(lead.id)}
                      onAction={(type) => rowAction(type, lead)}
                      onRemoveTag={(tag) => removeTag(lead.id, tag)}
                    />
                  ))}
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-sm text-slate-500">
                        No leads found.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">
            Showing {from} to {to} of {filtered.length} entries
            {filtered.length < leads.length && (
              <span className="text-slate-500">
                {' '}
                (filtered from {leads.length} total entries)
              </span>
            )}
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
                  n === currentPage
                    ? 'bg-brand-600 text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
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
      </div>

      {/* Bulk actions */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={bulkAction}
          onChange={(e) => setBulkAction(e.target.value)}
          className="input w-56"
        >
          <option value="">- Bulk Actions -</option>
          <option>Assign to staff</option>
          <option>Change status</option>
          <option>Delete selected</option>
        </select>
        <button
          onClick={applyBulk}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Apply
        </button>
        {selected.size > 0 && (
          <span className="text-sm text-slate-500">{selected.size} selected</span>
        )}
      </div>

      <p className="text-xs text-slate-500">
        <span className="font-semibold text-slate-500">Notes:</span> By default "All open leads" are
        shown. It shows all leads except "Converted" / "Disqualified". To view those, select the
        status in the filter and click "Filter".
      </p>

      {/* Add tag */}
      {tagLead && (
        <AddTagDialog
          lead={tagLead}
          recentTags={recentTags}
          tagCount={(leadTags[tagLead.id] ?? []).length}
          maxTags={MAX_TAGS}
          onClose={() => setTagLead(null)}
          onAdd={applyTag}
        />
      )}

      {/* Tag limit warning */}
      {limitLead &&
        createPortal(
          <AlertDialog
            open
            title="Tag limit reached"
            message={
              <>
                <span className="font-medium text-slate-700">{limitLead.name}</span> already has all{' '}
                {MAX_TAGS} tags. Remove one from the row before adding another.
              </>
            }
            okLabel="Got it"
            onOk={() => setLimitLead(null)}
          />,
          document.body,
        )}

      {/* Toast */}
      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[60] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

function DotsLoader() {
  return (
    <div className="flex items-center justify-center gap-2" role="status" aria-label="Loading">
      <span className="h-3.5 w-3.5 animate-bounce rounded-full bg-brand-600 [animation-delay:-0.3s]" />
      <span className="h-3.5 w-3.5 animate-bounce rounded-full bg-brand-600 [animation-delay:-0.15s]" />
      <span className="h-3.5 w-3.5 animate-bounce rounded-full bg-brand-600" />
    </div>
  )
}

function SingleSelect({
  options,
  value,
  onChange,
  placeholder = '- Select -',
}: {
  options: string[]
  value: string
  onChange: (val: string) => void
  placeholder?: string
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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[38px] w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-left text-sm focus:border-brand-500"
      >
        <span className={value ? 'text-slate-700' : 'text-slate-500'}>{value || placeholder}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onChange(o)
                setOpen(false)
              }}
              className={cn(
                'block w-full px-3 py-1.5 text-left text-sm hover:bg-brand-50 hover:text-brand-600',
                o === value ? 'font-semibold text-brand-600' : 'text-slate-700',
              )}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  )
}

function PageBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}
