import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Upload } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useAuth } from '../../store/auth'
import { showSuccessDialog } from '../../store/successDialog'
import { AvatarUpload } from '../../components/AvatarUpload'
import {
  Field,
  TextInput,
  DateInput,
  Select,
  SectionTitle,
  RepeaterSection,
} from '../student/components/profileFields'
import {
  loadAdminProfile,
  saveAdminProfile,
  dialCodes,
  bloodGroups,
  profileCountries,
  departments,
  designations,
  employmentTypes,
  onboardingStatuses,
  employmentStatuses,
  seatingLocations,
  type AdminProfile,
} from '../../mock/adminProfile'

/** A titled section with a top divider. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-200 pt-6">
      <SectionTitle>{title}</SectionTitle>
      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  )
}

/**
 * Update Your Profile — the signed-in Admin/Staff user's full profile.
 * Modeled on demo.eductrl.com/cn4/admin/auth/basic-info (reference only).
 */
export default function BasicInfoPage() {
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const updateUser = useAuth((s) => s.updateUser)
  const email = user?.email ?? ''

  const [p, setP] = useState<AdminProfile>(() => {
    const loaded = loadAdminProfile(user?.name ?? '', email)
    // Seed the photo from the saved profile, else the signed-in user's avatar.
    return { ...loaded, photo: loaded.photo ?? user?.avatar }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const photo = p.photo ?? null

  const set = (k: keyof AdminProfile, v: string) =>
    setP((prev) => ({ ...prev, [k]: v }) as AdminProfile)
  const val = (k: keyof AdminProfile) => (p[k] as string) ?? ''

  // --- render helpers (functions, not components, so inputs keep focus) ---
  const txt = (label: string, k: keyof AdminProfile, o: { required?: boolean; placeholder?: string; type?: string } = {}) => (
    <Field label={label} required={o.required} error={errors[k as string]}>
      <TextInput value={val(k)} onChange={(v) => { set(k, v); setErrors((e) => ({ ...e, [k as string]: '' })) }} placeholder={o.placeholder} type={o.type} invalid={!!errors[k as string]} />
    </Field>
  )
  const dt = (label: string, k: keyof AdminProfile, o: { required?: boolean } = {}) => (
    <Field label={label} required={o.required} error={errors[k as string]}>
      <DateInput value={val(k)} onChange={(v) => set(k, v)} invalid={!!errors[k as string]} />
    </Field>
  )
  const sel = (label: string, k: keyof AdminProfile, options: string[], o: { required?: boolean; placeholder?: string } = {}) => (
    <Field label={label} required={o.required} error={errors[k as string]}>
      <Select options={options} value={val(k)} onChange={(v) => set(k, v)} placeholder={o.placeholder} invalid={!!errors[k as string]} />
    </Field>
  )
  const dialNum = (label: string, dk: keyof AdminProfile, nk: keyof AdminProfile, o: { required?: boolean } = {}) => (
    <Field label={label} required={o.required}>
      <div className="flex gap-2">
        <div className="w-24 shrink-0">
          <Select options={dialCodes} value={val(dk)} onChange={(v) => set(dk, v)} placeholder="Code" />
        </div>
        <TextInput value={val(nk)} onChange={(v) => set(nk, v)} placeholder="9999999999" />
      </div>
    </Field>
  )

  const fileSlot = (label: string, k: keyof AdminProfile) => (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <Upload className="h-4 w-4" /> Choose File
          <input type="file" className="hidden" onChange={(e) => set(k, e.target.files?.[0]?.name ?? '')} />
        </label>
        <span className="truncate text-xs text-slate-500">{val(k) || 'No file chosen'}</span>
      </div>
    </div>
  )

  const radioRow = (label: string, k: 'gender' | 'maritalStatus', opts: string[], required?: boolean) => (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-rose-600">*</span>}
      </p>
      <div className="flex items-center gap-6">
        {opts.map((opt) => (
          <label key={opt} className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input type="radio" name={k} checked={p[k] === opt} onChange={() => setP((prev) => ({ ...prev, [k]: opt }) as AdminProfile)} className="h-4 w-4 accent-brand-600" />
            {opt}
          </label>
        ))}
      </div>
    </div>
  )

  const save = () => {
    const e: Record<string, string> = {}
    if (!p.firstName.trim()) e.firstName = 'Required'
    if (!p.lastName.trim()) e.lastName = 'Required'
    if (!p.employeeId.trim()) e.employeeId = 'Required'
    if (!p.panTaxId.trim()) e.panTaxId = 'Required'
    setErrors(e)
    if (Object.keys(e).length) {
      showSuccessDialog('Please fill in the required fields marked with *.', 'Missing Information')
      return
    }
    saveAdminProfile(email, p)
    updateUser({
      name: `${p.firstName} ${p.lastName}`.trim(),
      email: p.email,
      phone: p.mobile,
      avatar: p.photo, // reflect the uploaded picture in the header avatar
    })
    showSuccessDialog('Your profile has been updated successfully.', 'Profile Updated')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Update Your Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Fields marked with <span className="font-semibold text-rose-600">*</span> are mandatory.
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      {/* Main form card */}
      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {/* Identity — name + role only; the avatar lives in the Employee Photo
            uploader below, so no duplicate image competes for attention here. */}
        <div className="min-w-0">
          <p className="truncate text-lg font-bold capitalize text-slate-900">
            {`${p.firstName} ${p.lastName}`.trim() || user?.name || 'My Profile'}
          </p>
          {user?.role && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">
              <ShieldCheck className="h-3 w-3" /> {user.role}
            </span>
          )}
        </div>

        {/* Basic Information */}
        <section>
          <SectionTitle>Basic Information</SectionTitle>
          <div className="mt-4">
            <AvatarUpload
              label="Employee Photo"
              value={photo}
              onChange={(dataUrl) => setP((prev) => ({ ...prev, photo: dataUrl ?? undefined }) as AdminProfile)}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {txt('First Name', 'firstName', { required: true })}
            {txt('Last Name', 'lastName', { required: true })}
            {txt('Email Address', 'email', { type: 'email' })}
            {dialNum('Mobile', 'mobileDial', 'mobile')}
            {dialNum('Whatsapp No.', 'whatsappDial', 'whatsapp')}
            {txt('Father/Spouse Name', 'fatherName')}
            {txt("Mother's Name", 'motherName')}
          </div>
        </section>

        {/* Personal Details */}
        <Section title="Personal Details">
          {radioRow('Gender', 'gender', ['Male', 'Female'], true)}
          {radioRow('Marital Status', 'maritalStatus', ['Single', 'Married'])}
          {sel('Citizenship', 'citizenship', profileCountries, { placeholder: 'Select Citizenship' })}
          {dt('Date Of Birth', 'dob', { required: true })}
          {sel('Blood Group', 'bloodGroup', bloodGroups, { placeholder: 'Select Blood group' })}
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="About/Expertise">
              <textarea
                value={p.about}
                onChange={(e) => set('about', e.target.value)}
                rows={3}
                placeholder="About/Expertise"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </Field>
          </div>
        </Section>

        {/* Identity Information */}
        <Section title="Identity Information">
          {txt('Passport Number', 'passportNumber')}
          {dt('Issue Date', 'passportIssueDate')}
          {dt('Expiry Date', 'passportExpiryDate')}
          {sel('Issuing Country', 'issuingCountry', profileCountries, { placeholder: 'Select Country' })}
        </Section>

        {/* Employment Details */}
        <Section title="Employment Details">
          {txt('Employee ID', 'employeeId', { required: true })}
          {dt('Date Of Joining', 'dateOfJoining')}
          {sel('Designation', 'designation', designations, { required: true, placeholder: 'Select Designation' })}
          {sel('Department', 'department', departments, { placeholder: 'Select department' })}
          {sel('Employment Type', 'employmentType', employmentTypes, { placeholder: 'Select employment Type' })}
          {sel('Onboarding Status', 'onboardingStatus', onboardingStatuses, { placeholder: 'Select Onboarding Status' })}
          {sel('Employment Status', 'employmentStatus', employmentStatuses, { placeholder: 'Select Employment Status' })}
          {txt('Source Of Hire', 'sourceOfHire')}
          {txt('Current CTC', 'currentCtc')}
          <Field label="Past Experience">
            <div className="flex items-center gap-2">
              <TextInput value={p.pastExpYears} onChange={(v) => set('pastExpYears', v)} placeholder="Years" />
              <span className="text-sm text-slate-500">yrs</span>
              <TextInput value={p.pastExpMonths} onChange={(v) => set('pastExpMonths', v)} placeholder="Months" />
              <span className="text-sm text-slate-500">mo</span>
            </div>
          </Field>
          {txt('Aadhar/National Identity Number', 'aadhar')}
          {txt('PAN/TAX ID Number', 'panTaxId', { required: true })}
          {dt('Date Of Exit', 'dateOfExit')}
        </Section>

        {/* Contact Details */}
        <Section title="Contact Details">
          {dialNum('Work Phone No.', 'workPhoneDial', 'workPhone')}
          {txt('Extension', 'extension')}
          {sel('Seating Location', 'seatingLocation', seatingLocations, { placeholder: 'Select Seating Location' })}
          {txt('Personal Mobile Number', 'personalMobile')}
          {txt('Personal Email Address', 'personalEmail', { type: 'email' })}
        </Section>

        {/* Current Address */}
        <Section title="Current Address">
          {txt('Address', 'curAddress')}
          {sel('Country', 'curCountry', profileCountries, { placeholder: 'Select Country' })}
          {txt('State', 'curState')}
          {txt('City', 'curCity')}
          {txt('Postal Code', 'curPostal')}
        </Section>

        {/* Permanent Address */}
        <Section title="Permanent Address">
          {txt('Address', 'permAddress')}
          {sel('Country', 'permCountry', profileCountries, { placeholder: 'Select Country' })}
          {txt('State', 'permState')}
          {txt('City', 'permCity')}
          {txt('Postal Code', 'permPostal')}
        </Section>

        {/* Emergency Contact */}
        <Section title="Emergency Contact Information">
          {txt('Name', 'emgName')}
          {txt('Email Address', 'emgEmail', { type: 'email' })}
          {txt('Phone Number', 'emgPhone')}
          {txt('Address', 'emgAddress')}
        </Section>

        {/* Bank Details */}
        <Section title="Bank Details">
          {txt('Account Number', 'bankAccount')}
          {txt('Account Holders Name', 'bankHolder')}
          {txt('Bank Name', 'bankName')}
          {txt('Bank Sort Code/Swift Code/IFSC Code', 'bankSortCode')}
          {txt('Branch Name', 'branchName')}
        </Section>

        {/* VISA Information */}
        <Section title="VISA Information">
          {txt('VISA Number', 'visaNumber')}
          {dt('VISA Expiry Date', 'visaExpiry')}
          {txt('Entry Clearance', 'entryClearance')}
          {txt('BRP', 'brp')}
        </Section>

        {/* Right To Work */}
        <Section title="Right To Work Information">
          {txt('Share Code', 'shareCode')}
          {dt('Share Code Entry Date', 'shareCodeEntry')}
          {dt('Share Code Expiry Date', 'shareCodeExpiry')}
          {dt('RWC Check Date', 'rwcCheckDate')}
          {fileSlot('Rwc File', 'rwcFileName')}
        </Section>

        <div className="flex justify-end border-t border-slate-200 pt-6">
          <button
            onClick={save}
            className="rounded-lg bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Update Profile
          </button>
        </div>
      </div>

      {/* Work Experience */}
      <RepeaterSection
        title="Work Experience Details"
        addLabel="Add Work Experience"
        rows={p.workExperience}
        onChange={(rows) => setP((prev) => ({ ...prev, workExperience: rows }))}
        fields={[
          { key: 'company', label: 'Company Name' },
          { key: 'jobTitle', label: 'Job Title' },
          { key: 'fromDate', label: 'From Date', type: 'date' },
          { key: 'toDate', label: 'To Date', type: 'date' },
          { key: 'description', label: 'Job Description' },
          { key: 'relevant', label: 'Relevant?', type: 'select', options: ['Yes', 'No'] },
        ]}
      />

      {/* Education */}
      <RepeaterSection
        title="Educational Details"
        addLabel="Add Education"
        rows={p.education}
        onChange={(rows) => setP((prev) => ({ ...prev, education: rows }))}
        fields={[
          { key: 'institute', label: 'Institute Name' },
          { key: 'degree', label: 'Degree/Diploma' },
          { key: 'specification', label: 'Specification' },
          { key: 'completion', label: 'Date Of Completion', type: 'date' },
        ]}
      />

      {/* Dependents */}
      <RepeaterSection
        title="Dependent Details"
        addLabel="Add Dependent"
        rows={p.dependents}
        onChange={(rows) => setP((prev) => ({ ...prev, dependents: rows }))}
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'relationship', label: 'Relationship' },
          { key: 'dob', label: 'Date Of Birth', type: 'date' },
        ]}
      />

      {/* Documents */}
      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionTitle>Documents</SectionTitle>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {fileSlot('Passport', 'docPassport')}
          {fileSlot('Aadhar/National ID Document', 'docAadhar')}
          {fileSlot('Resume', 'docResume')}
          {fileSlot('PAN/TAX ID Document', 'docPanTax')}
        </div>

        <div className="border-t border-slate-200 pt-5">
          <SectionTitle>Additional Document</SectionTitle>
          <div className="mt-4">
            <RepeaterSection
              title="Additional Documents"
              addLabel="Add New Document"
              rows={p.additionalDocs}
              onChange={(rows) => setP((prev) => ({ ...prev, additionalDocs: rows }))}
              fields={[
                { key: 'title', label: 'Title' },
                { key: 'fileName', label: 'File Name' },
              ]}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-5">
          <button
            onClick={save}
            className={cn(
              'rounded-lg bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700',
            )}
          >
            Update Profile
          </button>
        </div>
      </div>
    </div>
  )
}
