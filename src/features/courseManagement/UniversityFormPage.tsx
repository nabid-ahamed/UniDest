import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Field } from '../../components/DataTableUI'
import { finderCountries } from '../../mock/courseFinder'
import {
  getUniversity,
  addUniversity,
  updateUniversity,
  universityTypes,
  type UniversityType,
  type ActiveStatus,
} from '../../mock/courseManagement'

// Gradient options for the logo placeholder, matching the finder palette.
const LOGO_OPTIONS = [
  { label: 'Navy', value: 'from-blue-900 to-blue-700' },
  { label: 'Crimson', value: 'from-rose-900 to-rose-700' },
  { label: 'Green', value: 'from-emerald-900 to-emerald-700' },
  { label: 'Gold', value: 'from-amber-700 to-amber-500' },
  { label: 'Violet', value: 'from-violet-900 to-violet-700' },
  { label: 'Teal', value: 'from-teal-900 to-teal-700' },
  { label: 'Slate', value: 'from-slate-800 to-slate-600' },
]

const num = (v: string) => (v.trim() === '' ? null : Number(v))

export default function UniversityFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = id ? getUniversity(Number(id)) : undefined
  const isEdit = Boolean(id)

  const [name, setName] = useState(editing?.name ?? '')
  const [country, setCountry] = useState(editing?.country ?? '')
  const [city, setCity] = useState(editing?.city ?? '')
  const [website, setWebsite] = useState(editing?.website ?? '')
  const [type, setType] = useState<UniversityType>(editing?.type ?? 'Public')
  const [established, setEstablished] = useState(editing?.established != null ? String(editing.established) : '')
  const [ranking, setRanking] = useState(editing?.ranking != null ? String(editing.ranking) : '')
  const [showToAgent, setShowToAgent] = useState(editing?.showToAgent ?? true)
  const [logoClass, setLogoClass] = useState(editing?.logoClass ?? LOGO_OPTIONS[0].value)
  const [status, setStatus] = useState<ActiveStatus>(editing?.status ?? 'Active')
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (isEdit && !editing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">University not found.</p>
        <a href="/universities" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Universities
        </a>
      </div>
    )
  }

  const submit = () => {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Please enter a university name.'
    if (!country) next.country = 'Please choose a country.'
    setErrors(next)
    if (Object.keys(next).length) return

    const payload = {
      name: name.trim(),
      country,
      city: city.trim(),
      website: website.trim(),
      type,
      established: num(established),
      ranking: num(ranking),
      showToAgent,
      logoClass,
      status,
    }
    if (isEdit && editing) {
      updateUniversity(editing.id, payload)
      navigate(`/universities/${editing.id}`)
    } else {
      const created = addUniversity(payload)
      navigate(`/universities/${created.id}`)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit University' : 'Add University'}</h1>
        <a
          href="/universities"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </a>
      </div>

      <div className="mt-6 max-w-2xl space-y-5">
        <div>
          <label htmlFor="uf-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
            University Name <span className="text-rose-600">*</span>
          </label>
          <input
            id="uf-name"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })) }}
            className={cn('input', errors.name && 'border-rose-500')}
          />
          {errors.name && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Country *">
            <select
              value={country}
              onChange={(e) => { setCountry(e.target.value); setErrors((p) => ({ ...p, country: '' })) }}
              className={cn('input', errors.country && 'border-rose-500')}
            >
              <option value="">Select country</option>
              {finderCountries.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {errors.country && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.country}</p>}
          </Field>
          <Field label="City">
            <input value={city} onChange={(e) => setCity(e.target.value)} className="input" />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value as UniversityType)} className="input">
              {universityTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Website">
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="example.edu" className="input" />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Established (Year)">
            <input type="number" min="0" value={established} onChange={(e) => setEstablished(e.target.value)} className="input" />
          </Field>
          <Field label="World Ranking">
            <input type="number" min="0" value={ranking} onChange={(e) => setRanking(e.target.value)} className="input" />
          </Field>
        </div>

        <Field label="Logo Colour">
          <div className="flex flex-wrap gap-2">
            {LOGO_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setLogoClass(o.value)}
                aria-label={o.label}
                aria-pressed={logoClass === o.value}
                className={cn(
                  'h-9 w-9 rounded-lg bg-gradient-to-br transition-transform hover:scale-110',
                  o.value,
                  logoClass === o.value && 'ring-2 ring-brand-500 ring-offset-2',
                )}
              />
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Show To Agent</span>
            <label className="inline-flex cursor-pointer items-center gap-3 pt-1.5">
              <input
                type="checkbox"
                checked={showToAgent}
                onChange={(e) => setShowToAgent(e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="text-sm text-slate-700">Visible to sub-agents</span>
            </label>
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Status</span>
            <div className="flex items-center gap-6 pt-1.5">
              {(['Active', 'Inactive'] as const).map((s) => (
                <label key={s} className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="radio"
                    name="uf_status"
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 border-t border-slate-100 pt-5">
          <button
            onClick={submit}
            className="rounded-lg bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            {isEdit ? 'Save Changes' : 'Create University'}
          </button>
          <a
            href="/universities"
            className="rounded-lg border border-slate-300 bg-white px-8 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
  )
}
