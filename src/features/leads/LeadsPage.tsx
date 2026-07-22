import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus,
  RefreshCw,
  UploadCloud,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { MultiSelect } from '../../components/MultiSelect'
import { ExportButtons } from '../../components/ExportButtons'
import { DotsLoader, Field, PageBtn, SingleSelect } from '../../components/DataTableUI'
import { formatDateTime } from '../../components/DateTimePicker'
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
import { AssignStaffDialog } from './components/AssignStaffDialog'
import { ConvertCounselingDialog } from './components/ConvertCounselingDialog'
import { AlertDialog } from '../../components/ui/AlertDialog'
import { SuccessDialog } from '../../components/ui/SuccessDialog'

/** A lead may carry at most this many tags. */
const MAX_TAGS = 5

const PAGE_SIZES = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 1000, label: '100+' },
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
  const [assignLead, setAssignLead] = useState<Lead | null>(null)
  const [counselLead, setCounselLead] = useState<Lead | null>(null)
  const [successMsg, setSuccessMsg] = useState('')
  // Owner per lead id, seeded from the mock so re-assignment persists in the UI.
  const [assignees, setAssignees] = useState<Record<number, string | null>>(() =>
    Object.fromEntries(leads.map((l) => [l.id, l.assignedTo])),
  )
  const [recentTags, setRecentTags] = useState<string[]>(initialRecentTags)
  // Status per lead id, seeded from the mock so "Change Status to" persists in the UI.
  const [rowStatuses, setRowStatuses] = useState<Record<number, string>>(() =>
    Object.fromEntries(leads.map((l) => [l.id, l.status])),
  )
  // Next follow-up per lead id — scheduling a counselling session updates it.
  const [followups, setFollowups] = useState<Record<number, string | null>>(() =>
    Object.fromEntries(leads.map((l) => [l.id, l.nextFollowup])),
  )
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
    if (type === 'Assign') return setAssignLead(lead)
    if (type === 'View') return window.location.assign(`/leads/${lead.id}`)
    showToast(`${type}: ${lead.name} (#${lead.id})`)
  }

  const saveAssignee = (member: string) => {
    if (!assignLead) return
    setAssignees((prev) => ({ ...prev, [assignLead.id]: member }))
    setAssignLead(null)
    setSuccessMsg('Lead Assigned Successfully')
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

  const changeStatus = (lead: Lead, next: string) => {
    // Counseling needs a counsellor + date first — the dialog applies the
    // status itself on Update. Re-selecting it re-opens the dialog to modify.
    if (next === 'Counseling') return setCounselLead(lead)
    if ((rowStatuses[lead.id] ?? lead.status) === next) return
    setRowStatuses((prev) => ({ ...prev, [lead.id]: next }))
    setSuccessMsg('Lead Status Changed Successfully')
  }

  const convertToCounseling = (counsellor: string, when: Date) => {
    if (!counselLead) return
    const formatted = formatDateTime(when)
    setRowStatuses((prev) => ({ ...prev, [counselLead.id]: 'Counseling' }))
    // The counselling slot becomes the lead's next follow-up, and the
    // counsellor becomes the assignee.
    setFollowups((prev) => ({ ...prev, [counselLead.id]: formatted }))
    setAssignees((prev) => ({ ...prev, [counselLead.id]: counsellor }))
    setCounselLead(null)
    setSuccessMsg('Lead Status Changed Successfully')
  }

  const removeTag = (leadId: number, tag: string) => {
    setLeadTags((prev) => ({ ...prev, [leadId]: (prev[leadId] ?? []).filter((t) => t !== tag) }))
    showToast(`Tag "${tag}" removed`)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads.filter((l) => {
      if (statuses.length && !statuses.includes(rowStatuses[l.id] ?? l.status)) return false
      if (countriesInterested.length && !countriesInterested.includes(l.countryInterested))
        return false
      if (staff && (assignees[l.id] ?? null) !== staff) return false
      if (branch !== 'All Branch' && l.branch !== branch) return false
      if (q) {
        const hay = `${l.id} ${l.name} ${l.email} ${l.phone} ${l.phoneNote}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [search, statuses, countriesInterested, staff, branch, assignees, rowStatuses])

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

  const exportHeader = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Assigned To', 'Branch', 'Created']
  const exportRows = filtered.map((l) => [
    l.id,
    l.name,
    l.email,
    l.phone,
    rowStatuses[l.id] ?? l.status,
    assignees[l.id] ?? 'Unassigned',
    l.branch,
    l.created,
  ])

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
          <div className="group relative">
            <button
              onClick={handleRefresh}
              aria-label="Refresh List"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            </button>
            {/* Tooltip sits below — these buttons are near the top of the page. */}
            <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-slate-700 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
              Refresh List
            </span>
          </div>
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
            <ExportButtons
              title="Leads"
              filename="leads"
              header={exportHeader}
              rows={exportRows}
              onDone={showToast}
            />
          </div>
        </div>

        {/* Table — horizontal scroll below xl so the expanded sidebar never
            pushes the row icons past the card edge; from xl up the wrapper is
            overflow-visible so the sticky header can anchor to the page. */}
        <div className="overflow-x-auto xl:overflow-x-visible">
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
                      status={rowStatuses[lead.id] ?? lead.status}
                      nextFollowup={followups[lead.id] ?? null}
                      tags={leadTags[lead.id] ?? []}
                      assignedTo={assignees[lead.id] ?? null}
                      selected={selected.has(lead.id)}
                      onToggle={() => toggleOne(lead.id)}
                      onAction={(type) => rowAction(type, lead)}
                      onRemoveTag={(tag) => removeTag(lead.id, tag)}
                      onChangeStatus={(next) => changeStatus(lead, next)}
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

      {/* Assign staff */}
      {assignLead && (
        <AssignStaffDialog
          lead={assignLead}
          assignedTo={assignees[assignLead.id] ?? null}
          staff={leadStaff}
          onClose={() => setAssignLead(null)}
          onSave={saveAssignee}
        />
      )}

      {/* Convert to counselling */}
      {counselLead && (
        <ConvertCounselingDialog
          lead={counselLead}
          counsellors={leadStaff}
          initialCounsellor={assignees[counselLead.id]}
          onClose={() => setCounselLead(null)}
          onUpdate={convertToCounseling}
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

      {/* Status-change success */}
      {successMsg &&
        createPortal(
          <SuccessDialog open message={successMsg} onOk={() => setSuccessMsg('')} />,
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
