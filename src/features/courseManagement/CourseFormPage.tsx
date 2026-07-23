import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Field } from '../../components/DataTableUI'
import { MultiSelect } from '../../components/MultiSelect'
import { disciplineAreas } from '../../mock/courseFinder'
import {
  getCourse,
  addCourse,
  updateCourse,
  universityByName,
  universityNames,
  categoryNames,
  studyLevels,
  currencies,
  type CourseStatus,
} from '../../mock/courseManagement'

// Intake months as 3-letter codes, matching the shared course catalogue.
const INTAKES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Split a stored "USD 100000" fee into currency + amount for the form. */
function splitFee(fee: string | null): { amount: string } {
  const m = fee?.match(/[\d.,]+/)
  return { amount: m ? m[0].replace(/,/g, '') : '' }
}
const num = (v: string) => (v.trim() === '' ? null : Number(v))
const composeFee = (currency: string, amount: string) =>
  amount.trim() === '' ? null : `${currency} ${amount.trim()}`

export default function CourseFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = id ? getCourse(Number(id)) : undefined
  const isEdit = Boolean(id)

  const unis = universityNames()
  const cats = categoryNames()

  const [title, setTitle] = useState(editing?.title ?? '')
  const [university, setUniversity] = useState(editing?.university ?? '')
  const [studyLevel, setStudyLevel] = useState(editing?.studyLevel ?? '')
  const [category, setCategory] = useState(editing?.studyArea ?? '')
  const [discipline, setDiscipline] = useState(editing?.disciplineArea ?? '')
  const [concentration, setConcentration] = useState(editing?.concentration ?? '')
  const [city, setCity] = useState(editing?.city ?? '')
  const [country, setCountry] = useState(editing?.country ?? '')
  const [durationMonths, setDurationMonths] = useState(
    editing?.durationMonths != null ? String(editing.durationMonths) : '',
  )
  const [intakes, setIntakes] = useState<string[]>(editing?.intakes ?? [])
  const [description, setDescription] = useState(editing?.description ?? '')
  const [entryRequirements, setEntryRequirements] = useState(editing?.entryRequirements ?? '')

  const [ielts, setIelts] = useState(editing?.ielts != null ? String(editing.ielts) : '')
  const [ieltsNoBand, setIeltsNoBand] = useState(editing?.ieltsNoBand != null ? String(editing.ieltsNoBand) : '')
  const [toefl, setToefl] = useState(editing?.toefl != null ? String(editing.toefl) : '')
  const [pte, setPte] = useState(editing?.pte != null ? String(editing.pte) : '')
  const [gre, setGre] = useState(editing?.gre != null ? String(editing.gre) : '')
  const [gmat, setGmat] = useState(editing?.gmat != null ? String(editing.gmat) : '')

  const [currency, setCurrency] = useState(editing?.tuitionFee?.match(/^[A-Z]{3}/)?.[0] ?? 'USD')
  const [tuition, setTuition] = useState(splitFee(editing?.tuitionFee ?? null).amount)
  const [appFee, setAppFee] = useState(splitFee(editing?.applicationFee ?? null).amount)
  const [commission, setCommission] = useState(editing?.commission ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(editing?.websiteUrl ?? '')
  const [status, setStatus] = useState<CourseStatus>(editing?.status ?? 'Enabled')

  const [errors, setErrors] = useState<Record<string, string>>({})

  const disciplineOptions = category ? disciplineAreas[category] ?? [] : []

  if (isEdit && !editing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Course not found.</p>
        <a href="/courses" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Courses
        </a>
      </div>
    )
  }

  // Selecting a university fills in its country/city so the record always
  // matches the institution (a specific campus city can still be edited after).
  const onUniversity = (name: string) => {
    setUniversity(name)
    setErrors((p) => ({ ...p, university: '' }))
    const uni = universityByName(name)
    if (uni) {
      setCountry(uni.country)
      setCity(uni.city)
    }
  }

  const onCategory = (name: string) => {
    setCategory(name)
    setDiscipline('') // reset dependent discipline
    setErrors((p) => ({ ...p, category: '' }))
  }

  const submit = () => {
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = 'Please enter a course title.'
    if (!university) next.university = 'Please choose a university.'
    if (!studyLevel) next.studyLevel = 'Please choose a study level.'
    if (!category) next.category = 'Please choose a study area.'
    if (intakes.length === 0) next.intakes = 'Please select at least one intake.'
    setErrors(next)
    if (Object.keys(next).length) return

    const uni = universityByName(university)
    const payload = {
      title: title.trim(),
      university,
      city: city.trim() || uni?.city || '',
      country: country || uni?.country || '',
      studyLevel,
      studyArea: category,
      disciplineArea: discipline || '—',
      concentration: concentration.trim(),
      durationYears: durationMonths.trim() === '' ? null : Number(durationMonths) / 12,
      durationMonths: num(durationMonths),
      intakes,
      tuitionFee: composeFee(currency, tuition),
      applicationFee: composeFee(currency, appFee),
      commission: commission.trim(),
      ielts: num(ielts),
      ieltsNoBand: num(ieltsNoBand),
      toefl: num(toefl),
      pte: num(pte),
      gre: num(gre),
      gmat: num(gmat),
      logoClass: uni?.logoClass ?? 'from-slate-800 to-slate-600',
      description: description.trim(),
      entryRequirements: entryRequirements.trim(),
      websiteUrl: websiteUrl.trim(),
      status,
    }

    if (isEdit && editing) {
      updateCourse(editing.id, payload)
      navigate(`/courses/${editing.id}`)
    } else {
      const created = addCourse(payload)
      navigate(`/courses/${created.id}`)
    }
  }

  const scoreInputs = [
    { label: 'IELTS', value: ielts, set: setIelts, step: '0.5' },
    { label: 'IELTS No Band Less Than', value: ieltsNoBand, set: setIeltsNoBand, step: '0.5' },
    { label: 'TOEFL', value: toefl, set: setToefl, step: '1' },
    { label: 'PTE', value: pte, set: setPte, step: '1' },
    { label: 'GRE', value: gre, set: setGre, step: '1' },
    { label: 'GMAT', value: gmat, set: setGmat, step: '1' },
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Course' : 'Add New Course'}</h1>
        <a
          href="/courses"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </a>
      </div>

      <div className="mt-6 max-w-4xl space-y-8">
        {/* Basics */}
        <Section title="Course Details">
          <div className="space-y-5">
            <div>
              <label htmlFor="cf-title" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Title <span className="text-rose-600">*</span>
              </label>
              <input
                id="cf-title"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: '' })) }}
                className={cn('input', errors.title && 'border-rose-500')}
              />
              {errors.title && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="University *">
                <select
                  value={university}
                  onChange={(e) => onUniversity(e.target.value)}
                  className={cn('input', errors.university && 'border-rose-500')}
                >
                  <option value="">Select University</option>
                  {unis.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
                {errors.university && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.university}</p>}
              </Field>
              <Field label="Study Level *">
                <select
                  value={studyLevel}
                  onChange={(e) => { setStudyLevel(e.target.value); setErrors((p) => ({ ...p, studyLevel: '' })) }}
                  className={cn('input', errors.studyLevel && 'border-rose-500')}
                >
                  <option value="">Select Study Level</option>
                  {studyLevels.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
                {errors.studyLevel && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.studyLevel}</p>}
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Category (Study Area) *">
                <select
                  value={category}
                  onChange={(e) => onCategory(e.target.value)}
                  className={cn('input', errors.category && 'border-rose-500')}
                >
                  <option value="">Select Category</option>
                  {cats.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                {errors.category && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.category}</p>}
              </Field>
              <Field label="Sub Category (Discipline)">
                <select
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  disabled={!category}
                  className={cn('input', !category && 'cursor-not-allowed bg-slate-50')}
                >
                  <option value="">{category ? 'Select Sub Category' : 'Choose a category first'}</option>
                  {disciplineOptions.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Concentration">
                <input value={concentration} onChange={(e) => setConcentration(e.target.value)} className="input" />
              </Field>
              <Field label="Campus / City">
                <input value={city} onChange={(e) => setCity(e.target.value)} className="input" />
              </Field>
              <Field label="Duration (Months)">
                <input
                  type="number"
                  min="0"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="input"
                />
              </Field>
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Intake <span className="text-rose-600">*</span>
              </span>
              <MultiSelect options={INTAKES} selected={intakes} onChange={(v) => { setIntakes(v); setErrors((p) => ({ ...p, intakes: '' })) }} placeholder="Select intake months" />
              {errors.intakes && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.intakes}</p>}
            </div>

            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="input resize-y"
              />
            </Field>
            <Field label="Entry Requirements">
              <textarea
                value={entryRequirements}
                onChange={(e) => setEntryRequirements(e.target.value)}
                rows={3}
                className="input resize-y"
              />
            </Field>
          </div>
        </Section>

        {/* English / test scores */}
        <Section title="Admission Requirements">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {scoreInputs.map((s) => (
              <Field key={s.label} label={s.label}>
                <input
                  type="number"
                  step={s.step}
                  min="0"
                  value={s.value}
                  onChange={(e) => s.set(e.target.value)}
                  className="input"
                />
              </Field>
            ))}
          </div>
        </Section>

        {/* Fees */}
        <Section title="Fees & Commission">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Currency">
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input">
                {currencies.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Application Fee">
              <input type="number" min="0" value={appFee} onChange={(e) => setAppFee(e.target.value)} className="input" />
            </Field>
            <Field label="Tuition Fee (Yearly)">
              <input type="number" min="0" value={tuition} onChange={(e) => setTuition(e.target.value)} className="input" />
            </Field>
            <Field label="Commission">
              <input
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                placeholder="e.g. USD 4000 or 10% of first year fee"
                className="input"
              />
            </Field>
          </div>
        </Section>

        {/* Meta */}
        <Section title="Additional">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Website URL">
              <input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
                className="input"
              />
            </Field>
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Status</span>
              <div className="flex items-center gap-6 pt-1.5">
                {(['Enabled', 'Disabled'] as const).map((s) => (
                  <label key={s} className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="radio"
                      name="cf_status"
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
        </Section>

        <div className="flex justify-center gap-3 border-t border-slate-100 pt-5">
          <button
            onClick={submit}
            className="rounded-lg bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            {isEdit ? 'Save Changes' : 'Create Course'}
          </button>
          <a
            href="/courses"
            className="rounded-lg border border-slate-300 bg-white px-8 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      {children}
    </section>
  )
}
