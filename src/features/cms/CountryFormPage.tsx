import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Save, Globe2, Building2 } from 'lucide-react'
import {
  getCmsCountry,
  updateCmsCountry,
  universitiesInCountry,
  countryStatuses,
  slugify,
  type CountryStatus,
} from '../../mock/cms'

export default function CountryFormPage() {
  const { id } = useParams()
  const country = getCmsCountry(Number(id))

  const [heading, setHeading] = useState(country?.heading ?? '')
  const [intro, setIntro] = useState(country?.intro ?? '')
  const [slug, setSlug] = useState(country?.slug ?? '')
  const [status, setStatus] = useState<CountryStatus>(country?.status ?? 'Published')
  const [saved, setSaved] = useState(false)

  if (!country) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Country not found.</p>
        <a href="/cms/countries" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Countries
        </a>
      </div>
    )
  }

  const unis = universitiesInCountry(country.name)

  const onSave = () => {
    updateCmsCountry(country.id, { heading, intro, slug: slugify(slug || country.name), status })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2600)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Globe2 className="h-5 w-5 text-brand-500" /> Edit — Study in {country.name}
        </h1>
        <a
          href="/cms/countries"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </a>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {/* Connected stat from Course Management */}
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-slate-600">
          <Building2 className="h-4 w-4 text-brand-500" />
          <span>
            <span className="font-bold text-slate-800">{unis}</span> partner{' '}
            {unis === 1 ? 'university' : 'universities'} in {country.name} —{' '}
            <a href="/universities" className="font-semibold text-brand-600 hover:underline">
              manage in Course Management
            </a>
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="heading" className="mb-1 block text-sm font-semibold text-slate-700">
              Page Heading
            </label>
            <input id="heading" value={heading} onChange={(e) => setHeading(e.target.value)} className="input" />
          </div>

          <div>
            <label htmlFor="slug" className="mb-1 block text-sm font-semibold text-slate-700">
              URL Slug
            </label>
            <div className="flex items-center rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-400 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500">
              <span className="shrink-0">/study-in/</span>
              <input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-transparent py-2 text-slate-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="intro" className="mb-1 block text-sm font-semibold text-slate-700">
              Intro Text
            </label>
            <textarea
              id="intro"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={4}
              className="input resize-y"
            />
          </div>

          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-semibold text-slate-700">
              Status
            </label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value as CountryStatus)} className="input w-auto">
              {countryStatuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={onSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Save className="h-4 w-4" /> Save Changes
          </button>
          {saved && <span className="text-sm font-medium text-emerald-600">Saved ✓</span>}
        </div>
      </div>
    </div>
  )
}
