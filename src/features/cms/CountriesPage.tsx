import { useMemo, useState } from 'react'
import { Search, Pencil, Eye, Globe2, Building2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ExportButtons } from '../../components/ExportButtons'
import { HighlightMatch } from '../../components/ui/HighlightMatch'
import { countryStatuses, universitiesInCountry, type CountryStatus } from '../../mock/cms'
import { useCmsList, useUpdateCms } from '../../lib/api'

const STATUS_BADGE: Record<CountryStatus, string> = {
  Published: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
  'Default Only': 'bg-slate-200 text-slate-600 hover:bg-slate-300',
  Hidden: 'bg-rose-100 text-rose-700 hover:bg-rose-200',
}

export default function CountriesPage() {
  const { data: cmsCountries = [], isPending } = useCmsList('country')
  const updateCountry = useUpdateCms()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cmsCountries
      .filter((c) => !statusFilter || c.status === statusFilter)
      .filter((c) => !q || `${c.title} ${c.slug}`.toLowerCase().includes(q))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmsCountries, search, statusFilter])

  const exportRows = filtered.map((c) => [c.title, c.slug, c.status, universitiesInCountry(c.title)])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Globe2 className="h-5 w-5 text-brand-500" /> Countries — Study Destinations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage the public page content for each study destination country. Countries with partner universities are
            published automatically.
          </p>
        </div>
        <ExportButtons
          title="Study Destinations"
          filename="countries"
          header={['Country', 'Slug', 'Status', 'Universities']}
          rows={exportRows}
          onDone={showToast}
        />
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto py-1.5"
          >
            <option value="">All</option>
            {countryStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search country or slug..."
            aria-label="Search countries"
            className="input w-full pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Universities</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const unis = universitiesInCountry(c.title)
              return (
                <tr key={c.id} className="border-b border-slate-100 text-sm">
                  <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-800"><HighlightMatch text={c.title} query={search} /></td>
                  <td className="px-4 py-3.5">
                    <code className="rounded bg-slate-50 px-1.5 py-0.5 text-xs text-rose-600">/study-in/<HighlightMatch text={c.slug} query={search} /></code>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" /> {unis}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => {
                        // Cycle through the configured statuses — the same
                        // rotation the mock's cycleCountryStatus applied.
                        const order = countryStatuses
                        const next = order[(order.indexOf(c.status as CountryStatus) + 1) % order.length]
                        updateCountry.mutate({ kind: 'country', id: c.id, status: next })
                      }}
                      title="Click to change status"
                      className={cn('rounded-md px-2.5 py-1 text-xs font-semibold transition-colors', STATUS_BADGE[c.status as CountryStatus])}
                    >
                      {c.status}
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`/cms/countries/${c.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </a>
                      <a
                        href={`/course-finder?country=${encodeURIComponent(c.title)}`}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </a>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  {isPending ? 'Loading countries…' : 'No countries found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-slate-500">Showing {filtered.length} of {cmsCountries.length} countries</p>

      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[120] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
