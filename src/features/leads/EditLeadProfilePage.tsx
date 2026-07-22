import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { cn } from '../../lib/cn'
import { SuccessDialog } from '../../components/ui/SuccessDialog'
import { LeadIdentityHeader } from './components/LeadIdentityHeader'
import {
  allCountries,
  leadCountries,
  leadSources,
  leads,
  qualifications,
  studyLevels,
  updateLead,
  type Lead,
} from '../../mock/leads'

/** Keeps the current value selectable even when it's not in the option list. */
function withCurrent(options: string[], current?: string) {
  return current && !options.includes(current) ? [current, ...options] : options
}

/** Full-page "Edit Profile" (route /leads/:id/edit), headed like the detail page. */
export default function EditLeadProfilePage() {
  const { id } = useParams()
  const lead = leads.find((l) => l.id === Number(id))

  if (!lead) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-slate-500">Lead not found.</p>
        <a
          href="/leads"
          className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Back to Lead Management
        </a>
      </div>
    )
  }

  return <EditForm lead={lead} />
}

function EditForm({ lead }: { lead: Lead }) {
  const parts = lead.name.trim().split(/\s+/)
  const [firstName, setFirstName] = useState(parts[0] ?? '')
  const [lastName, setLastName] = useState(parts.slice(1).join(' '))
  const [gender, setGender] = useState(lead.gender ?? 'Male')
  const [email, setEmail] = useState(lead.email)
  const [phone, setPhone] = useState(lead.phone)
  const [studyLevel, setStudyLevel] = useState(lead.studyLevel ?? '')
  const [countryInterested, setCountryInterested] = useState(lead.countryInterested)
  const [qualification, setQualification] = useState(lead.qualification ?? '')
  const [residence, setResidence] = useState(lead.countryOfResidence ?? '')
  const [source, setSource] = useState(lead.source ?? '')
  const [errors, setErrors] = useState<{ firstName?: string; email?: string; phone?: string }>({})
  const [saved, setSaved] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!firstName.trim()) next.firstName = 'Please enter a first name.'
    if (!email.trim()) next.email = 'Please enter an email.'
    if (!phone.trim()) next.phone = 'Please enter a mobile number.'
    setErrors(next)
    if (Object.keys(next).length) return
    updateLead({
      ...lead,
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      email: email.trim(),
      phone: phone.trim(),
      gender,
      studyLevel: studyLevel || undefined,
      countryInterested: countryInterested || '-',
      qualification: qualification || undefined,
      countryOfResidence: residence || undefined,
      source: source || undefined,
    })
    setSaved(true)
  }

  const fieldClass = (invalid = false) =>
    cn(
      'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2',
      invalid
        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
        : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30',
    )

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white pb-6 shadow-sm">
      {/* Same identity header as the detail page */}
      <LeadIdentityHeader lead={lead} />

      <div className="mt-5 border-t border-slate-200 px-4 pt-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-800">Edit Profile</h2>
          <a
            href={`/leads/${lead.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </a>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="ep-first" className="mb-1.5 block text-sm font-semibold text-slate-700">
              First Name <span className="text-rose-600">*</span>
            </label>
            <input
              id="ep-first"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
                setErrors((p) => ({ ...p, firstName: undefined }))
              }}
              className={fieldClass(!!errors.firstName)}
            />
            {errors.firstName && (
              <p role="alert" className="mt-1.5 text-sm text-rose-600">
                {errors.firstName}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="ep-last" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Last Name
            </label>
            <input
              id="ep-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={fieldClass()}
            />
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Gender</span>
            <div className="flex items-center gap-6 py-2">
              {['Male', 'Female'].map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="radio"
                    name="ep-gender"
                    checked={gender === g}
                    onChange={() => setGender(g)}
                    className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  {g}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="ep-email" className="mb-1.5 block text-sm font-semibold text-slate-700">
              E-mail <span className="text-rose-600">*</span>
            </label>
            <input
              id="ep-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrors((p) => ({ ...p, email: undefined }))
              }}
              className={fieldClass(!!errors.email)}
            />
            {errors.email && (
              <p role="alert" className="mt-1.5 text-sm text-rose-600">
                {errors.email}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="ep-phone" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Mobile <span className="text-rose-600">*</span>
            </label>
            <input
              id="ep-phone"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                setErrors((p) => ({ ...p, phone: undefined }))
              }}
              className={fieldClass(!!errors.phone)}
            />
            {errors.phone && (
              <p role="alert" className="mt-1.5 text-sm text-rose-600">
                {errors.phone}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="ep-level" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Interested Study Level
            </label>
            <select
              id="ep-level"
              value={studyLevel}
              onChange={(e) => setStudyLevel(e.target.value)}
              className={fieldClass()}
            >
              <option value="">- Select -</option>
              {withCurrent(studyLevels, lead.studyLevel).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="ep-country"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Country Interested in
            </label>
            <select
              id="ep-country"
              value={countryInterested}
              onChange={(e) => setCountryInterested(e.target.value)}
              className={fieldClass()}
            >
              <option value="-">- Select -</option>
              {allCountries.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ep-qual" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Highest Level of Education
            </label>
            <select
              id="ep-qual"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className={fieldClass()}
            >
              <option value="">- Select -</option>
              {withCurrent(qualifications, lead.qualification).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ep-res" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Country of Residence
            </label>
            <select
              id="ep-res"
              value={residence}
              onChange={(e) => setResidence(e.target.value)}
              className={fieldClass()}
            >
              <option value="">- Select -</option>
              {withCurrent(leadCountries, lead.countryOfResidence).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="ep-source"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Lead Source
            </label>
            <select
              id="ep-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className={fieldClass()}
            >
              <option value="">- Select -</option>
              {withCurrent(leadSources, lead.source).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-2">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Save className="h-4 w-4" /> Save Changes
          </button>
          <a
            href={`/leads/${lead.id}`}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </a>
        </div>
      </div>

      {/* Success → back to the detail page */}
      {saved &&
        createPortal(
          <SuccessDialog
            open
            message="Profile Updated Successfully"
            onOk={() => window.location.assign(`/leads/${lead.id}`)}
          />,
          document.body,
        )}
    </form>
  )
}
