import { useState } from 'react'
import { Save, X, RefreshCw } from 'lucide-react'
import { MultiSelect } from '../../components/MultiSelect'
import {
  studyLevels,
  coursesInterested,
  intakes,
  services,
  leadCountries,
  allCountries,
  qualifications,
  phoneCountryCodes,
  englishTests,
  leadStatuses,
  addLead,
} from '../../mock/leads'

export default function AddLeadPage() {
  const [gender, setGender] = useState('Male')
  const [sameAsMobile, setSameAsMobile] = useState(false)
  const [password, setPassword] = useState('')
  const [countriesInterested, setCountriesInterested] = useState<string[]>([])
  const [saved, setSaved] = useState(false)

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$'
    let out = ''
    for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)]
    setPassword(out)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const get = (key: string) => String(fd.get(key) ?? '').trim()

    const now = new Date()
    const created = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(now)
    const emailDate = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(
      now,
    )

    addLead({
      name: `${get('firstName')} ${get('lastName')}`.trim(),
      email: get('email'),
      emailDate,
      phone: `${get('mobileCode')} ${get('mobile')}`.trim(),
      phoneNote: 'New lead',
      whatsapp: sameAsMobile,
      leadAgeDays: 0,
      branch: 'Dhaka',
      status: 'New Lead',
      statusColor: leadStatuses.find((x) => x.label === 'New Lead')?.color ?? '#0e7490',
      assignedTo: null,
      created,
      nextFollowup: null,
      countryInterested: countriesInterested[0] ?? '-',
      gender,
      studyLevel: get('studyLevel') || undefined,
      qualification: get('qualification') || undefined,
      source: 'Walk-in',
      countryOfResidence: get('country') || undefined,
    })

    setSaved(true)
    window.setTimeout(() => {
      window.location.href = '/leads'
    }, 1200)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Add New Lead</h1>
        <div className="flex items-center gap-2">
          <a
            href="/leads"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <X className="h-4 w-4" /> Cancel
          </a>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Save className="h-4 w-4" /> Save Lead
          </button>
        </div>
      </div>

      {/* Personal details */}
      <Section title="Personal Details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="First Name" required>
            <input name="firstName" className="input" placeholder="First Name" required />
          </Field>
          <Field label="Last Name">
            <input name="lastName" className="input" placeholder="Last Name" />
          </Field>
          <Field label="Gender">
            <div className="flex items-center gap-6 py-2">
              {['Male', 'Female'].map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="radio"
                    name="gender"
                    checked={gender === g}
                    onChange={() => setGender(g)}
                    className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  {g}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Email" required>
            <input name="email" type="email" className="input" placeholder="Email" required />
          </Field>
          <Field label="Date of Birth">
            <input type="date" className="input" />
          </Field>
          <Field label="Alternate Contact">
            <input className="input" placeholder="Alternate Contact" />
          </Field>

          <Field label="Mobile No." required>
            <PhoneInput placeholder="Mobile No." name="mobile" codeName="mobileCode" required />
          </Field>
          <Field label="WhatsApp No.">
            <PhoneInput placeholder="WhatsApp No." disabled={sameAsMobile} />
            <label className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={sameAsMobile}
                onChange={(e) => setSameAsMobile(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Same as Mobile No.
            </label>
          </Field>
          <div className="hidden lg:block" />

          <Field label="Country" required>
            <select name="country" className="input" defaultValue="" required>
              <option value="" disabled>
                Select Country
              </option>
              {leadCountries.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="State">
            <input className="input" placeholder="Select State" />
          </Field>
          <Field label="City">
            <input className="input" placeholder="Select City" />
          </Field>
        </div>
      </Section>

      {/* Study interest */}
      <Section title="Study Interest">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Intended Study Level">
            <select name="studyLevel" className="input" defaultValue="">
              <option value="">Select Study Level</option>
              {studyLevels.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Country Interested to Study In">
            <MultiSelect
              options={allCountries}
              selected={countriesInterested}
              onChange={setCountriesInterested}
              placeholder="Select Country"
            />
          </Field>
          <Field label="Course Interested to Study">
            <select className="input" defaultValue="">
              <option value="">Select Course</option>
              {coursesInterested.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Intake">
            <select className="input" defaultValue="">
              <option value="">Intake</option>
              {intakes.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Service Interested In">
            <select className="input" defaultValue="">
              <option value="">Select Service</option>
              {services.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Field label="Other Services Interested">
              <textarea
                rows={3}
                className="input resize-y"
                placeholder="Other services the lead is interested in..."
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* Account & academic */}
      <Section title="Account & Academic">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Login Password">
            <div className="flex items-center gap-2">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input flex-1"
                placeholder="Login Password"
              />
              <button
                type="button"
                onClick={generatePassword}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-3 py-2 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Generate
              </button>
            </div>
          </Field>
          <Field label="Qualification">
            <select name="qualification" className="input" defaultValue="">
              <option value="">Select Qualification</option>
              {qualifications.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Passout Year">
            <input type="number" className="input" placeholder="Passout Year" min={1980} max={2035} />
          </Field>

          <Field label="Score / Grade">
            <input className="input" placeholder="Score / Grade" />
          </Field>
          <Field label="Currently Studying Course">
            <input className="input" placeholder="Currently Studying Course" />
          </Field>
          <Field label="Work Experience">
            <input className="input" placeholder="e.g. 2 years" />
          </Field>
        </div>

        {/* English test scores */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-3 text-sm font-semibold text-slate-600">English Test Scores</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {englishTests.map((t) => (
              <Field key={t} label={t}>
                <input className="input" placeholder={t} />
              </Field>
            ))}
          </div>
        </div>
      </Section>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-2">
        <a
          href="/leads"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-6 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancel
        </a>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Save className="h-4 w-4" /> Save Lead
        </button>
      </div>

      {/* Success toast */}
      {saved && (
        <div className="animate-toast-in fixed right-4 top-20 z-[60] rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          Lead saved — redirecting…
        </div>
      )}
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-3">
        <h2 className="text-sm font-bold text-slate-700">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
    </div>
  )
}

function PhoneInput({
  placeholder,
  disabled,
  name,
  codeName,
  required,
}: {
  placeholder: string
  disabled?: boolean
  name?: string
  codeName?: string
  required?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <select name={codeName} className="input w-28 shrink-0" defaultValue="+880" disabled={disabled}>
        {phoneCountryCodes.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
      <input
        name={name}
        required={required}
        className="input flex-1"
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  )
}
