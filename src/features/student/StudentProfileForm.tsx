import { useMemo, useState } from 'react'
import { showSuccessDialog } from '../../store/successDialog'
import { allCountries, studyLevels, updateStudent, type Student } from '../../mock/students'
import {
  loadStudentProfile,
  saveStudentProfile,
  genders,
  maritalStatuses,
  educationLevels,
  servicesOptions,
  type StudentProfile,
} from '../../mock/student/studentProfile'
import {
  SectionBar,
  SectionTitle,
  Field,
  TextInput,
  DateInput,
  Select,
  YesNoField,
  MultiTagSelect,
  RepeaterSection,
  type RepeaterField,
} from './components/profileFields'

/** Splits "Rohan Kumar Das" into first / middle / last. */
function splitName(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts.shift() ?? ''
  const last = parts.length ? (parts.pop() as string) : ''
  return { first, middle: parts.join(' '), last }
}

const grid = 'grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3'

/* Field schemas driving the seven collapsible repeater accordions. */
const ACADEMIC_FIELDS: RepeaterField[] = [
  { key: 'institution', label: 'Institution' },
  { key: 'qualification', label: 'Qualification' },
  { key: 'field', label: 'Field of Study' },
  { key: 'country', label: 'Country', type: 'select', options: allCountries },
  { key: 'startYear', label: 'Start Year', placeholder: 'e.g. 2018' },
  { key: 'endYear', label: 'End Year', placeholder: 'e.g. 2022' },
  { key: 'grade', label: 'Grade / Score' },
]
const TEST_FIELDS: RepeaterField[] = [
  { key: 'test', label: 'Test', type: 'select', options: ['IELTS', 'TOEFL', 'PTE', 'Duolingo', 'GRE', 'GMAT'] },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'overall', label: 'Overall Score' },
  { key: 'listening', label: 'Listening' },
  { key: 'reading', label: 'Reading' },
  { key: 'writing', label: 'Writing' },
  { key: 'speaking', label: 'Speaking' },
]
const INTERNSHIP_FIELDS: RepeaterField[] = [
  { key: 'title', label: 'Title' },
  { key: 'organization', label: 'Organization' },
  { key: 'duration', label: 'Duration' },
  { key: 'description', label: 'Description' },
]
const EMPLOYMENT_FIELDS: RepeaterField[] = [
  { key: 'employer', label: 'Employer' },
  { key: 'designation', label: 'Designation' },
  { key: 'start', label: 'Start Date', type: 'date' },
  { key: 'end', label: 'End Date', type: 'date' },
  { key: 'responsibilities', label: 'Responsibilities' },
]
const VISA_FIELDS: RepeaterField[] = [
  { key: 'country', label: 'Country', type: 'select', options: allCountries },
  { key: 'visaType', label: 'Visa Type' },
  { key: 'appliedDate', label: 'Applied Date', type: 'date' },
  { key: 'status', label: 'Status', type: 'select', options: ['Approved', 'Rejected', 'Pending'] },
]
const TRAVEL_FIELDS: RepeaterField[] = [
  { key: 'country', label: 'Country', type: 'select', options: allCountries },
  { key: 'purpose', label: 'Purpose' },
  { key: 'from', label: 'From', type: 'date' },
  { key: 'to', label: 'To', type: 'date' },
]
const FAMILY_FIELDS: RepeaterField[] = [
  { key: 'name', label: 'Name' },
  { key: 'relationship', label: 'Relationship' },
  { key: 'occupation', label: 'Occupation' },
  { key: 'country', label: 'Country', type: 'select', options: allCountries },
]

/**
 * "Apply for Study Abroad → Profile" — the full inline editable form, faithful
 * to demo.eductrl.com/cn4/overseas/profile. Core identity fields sync back to
 * the Student record (so the admin pages agree); everything else persists to
 * the student-profile store. `onSaved` lets the parent re-read the student.
 */
export function StudentProfileForm({
  student,
  onSaved,
}: {
  student: Student
  onSaved?: () => void
}) {
  const nameParts = useMemo(() => splitName(student.name), [student.name])

  // Core fields (kept in sync with the Student record on save).
  const [firstName, setFirstName] = useState(nameParts.first)
  const [lastName, setLastName] = useState(nameParts.last)
  const [email, setEmail] = useState(student.email)
  const [mobile, setMobile] = useState(student.phone)
  const [studyLevel, setStudyLevel] = useState(student.studyLevel)

  // Extended profile (persisted separately). Seed a couple of core-derived
  // defaults so the form doesn't start entirely blank.
  const [p, setP] = useState<StudentProfile>(() => {
    const loaded = loadStudentProfile(student.id)
    return {
      ...loaded,
      middleName: loaded.middleName || nameParts.middle,
      nationality: loaded.nationality || student.countryOfResidence,
      citizenship: loaded.citizenship || student.countryOfResidence,
      currentCountry: loaded.currentCountry || student.countryOfResidence,
    }
  })
  const set = <K extends keyof StudentProfile>(key: K, value: StudentProfile[K]) =>
    setP((prev) => ({ ...prev, [key]: value }))

  const [errors, setErrors] = useState<Record<string, string>>({})

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!firstName.trim()) next.firstName = 'First name is required.'
    if (!lastName.trim()) next.lastName = 'Last name is required.'
    if (!email.trim()) next.email = 'E-mail is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid e-mail.'
    if (!mobile.trim()) next.mobile = 'Mobile is required.'
    if (!studyLevel) next.studyLevel = 'Select a study level.'
    setErrors(next)
    if (Object.keys(next).length) return

    // Sync core identity back to the Student record.
    const fullName = [firstName.trim(), p.middleName.trim(), lastName.trim()].filter(Boolean).join(' ')
    updateStudent(student.id, {
      name: fullName,
      email: email.trim(),
      phone: mobile.trim(),
      studyLevel,
      ...(p.studyCountryPreference[0] ? { countryInterested: p.studyCountryPreference[0] } : {}),
      ...(p.currentCountry ? { countryOfResidence: p.currentCountry } : {}),
    })
    saveStudentProfile(student.id, p)
    onSaved?.()
    showSuccessDialog('Profile Updated Successfully', 'Saved!')
  }

  return (
    <form onSubmit={save} className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Your Profile &amp; Educational Details</h2>
        <p className="mt-1 text-sm text-slate-600">
          Fill the below form &amp; complete your personal &amp; educational qualification details.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Fields marked with an asterisk (<span className="text-rose-600">*</span>) are mandatory.
        </p>
      </div>

      {/* Personal Info */}
      <SectionBar>Personal Info</SectionBar>
      <div className={grid}>
        <Field label="First Name" required error={errors.firstName}>
          <TextInput value={firstName} onChange={setFirstName} invalid={!!errors.firstName} placeholder="First name" />
        </Field>
        <Field label="Middle Name">
          <TextInput value={p.middleName} onChange={(v) => set('middleName', v)} placeholder="Middle name" />
        </Field>
        <Field label="Last Name" required error={errors.lastName}>
          <TextInput value={lastName} onChange={setLastName} invalid={!!errors.lastName} placeholder="Last name" />
        </Field>

        <Field label="Gender" required>
          <Select options={genders} value={p.gender} onChange={(v) => set('gender', v)} />
        </Field>
        <Field label="Marital Status" required>
          <Select options={maritalStatuses} value={p.maritalStatus} onChange={(v) => set('maritalStatus', v)} />
        </Field>
        <Field label="Date of Birth" required>
          <DateInput value={p.dob} onChange={(v) => set('dob', v)} />
        </Field>

        <Field label="E-mail" required error={errors.email}>
          <TextInput type="email" value={email} onChange={setEmail} invalid={!!errors.email} placeholder="name@example.com" />
        </Field>
        <Field label="Mobile" required error={errors.mobile}>
          <TextInput value={mobile} onChange={setMobile} invalid={!!errors.mobile} placeholder="+91 90000 00000" />
        </Field>

        <Field label="Nationality" required>
          <Select options={allCountries} value={p.nationality} onChange={(v) => set('nationality', v)} />
        </Field>
        <Field label="Citizenship" required>
          <Select options={allCountries} value={p.citizenship} onChange={(v) => set('citizenship', v)} />
        </Field>
        <Field label="Country of Education" required>
          <Select options={allCountries} value={p.countryOfEducation} onChange={(v) => set('countryOfEducation', v)} />
        </Field>
        <Field label="Highest Level of Education" required>
          <Select options={educationLevels} value={p.highestEducation} onChange={(v) => set('highestEducation', v)} />
        </Field>
      </div>

      {/* Study Preference */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
        <Field label="Interested Study Level" required error={errors.studyLevel}>
          <Select options={studyLevels} value={studyLevel} onChange={setStudyLevel} invalid={!!errors.studyLevel} />
        </Field>
        <Field label="Study Country Preference" required>
          <MultiTagSelect
            options={allCountries}
            values={p.studyCountryPreference}
            onChange={(v) => set('studyCountryPreference', v)}
            placeholder="Select countries…"
          />
        </Field>
        <Field label="Services Interested In">
          <MultiTagSelect
            options={servicesOptions}
            values={p.servicesInterested}
            onChange={(v) => set('servicesInterested', v)}
            placeholder="Select services…"
          />
        </Field>
      </div>

      {/* Current Address */}
      <SectionTitle>Current Address</SectionTitle>
      <div className="space-y-5">
        <Field label="Address" required>
          <TextInput value={p.currentAddress} onChange={(v) => set('currentAddress', v)} placeholder="Street address" />
        </Field>
        <div className={grid}>
          <Field label="Country" required>
            <Select options={allCountries} value={p.currentCountry} onChange={(v) => set('currentCountry', v)} />
          </Field>
          <Field label="State" required>
            <TextInput value={p.currentState} onChange={(v) => set('currentState', v)} placeholder="State / Province" />
          </Field>
          <Field label="City" required>
            <TextInput value={p.currentCity} onChange={(v) => set('currentCity', v)} placeholder="City" />
          </Field>
        </div>
        <div className="max-w-xs">
          <Field label="Postal Code">
            <TextInput value={p.currentPostal} onChange={(v) => set('currentPostal', v)} placeholder="Postal code" />
          </Field>
        </div>
      </div>

      {/* Permanent Address */}
      <SectionTitle>Permanent Address</SectionTitle>
      <div className="space-y-5">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={p.sameAsCurrent}
            onChange={(e) => set('sameAsCurrent', e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
          Same as Current Address
        </label>
        {!p.sameAsCurrent && (
          <>
            <Field label="Address">
              <TextInput value={p.permAddress} onChange={(v) => set('permAddress', v)} placeholder="Street address" />
            </Field>
            <div className={grid}>
              <Field label="Country">
                <Select options={allCountries} value={p.permCountry} onChange={(v) => set('permCountry', v)} />
              </Field>
              <Field label="State">
                <TextInput value={p.permState} onChange={(v) => set('permState', v)} placeholder="State / Province" />
              </Field>
              <Field label="City">
                <TextInput value={p.permCity} onChange={(v) => set('permCity', v)} placeholder="City" />
              </Field>
            </div>
            <div className="max-w-xs">
              <Field label="Postal Code">
                <TextInput value={p.permPostal} onChange={(v) => set('permPostal', v)} placeholder="Postal code" />
              </Field>
            </div>
          </>
        )}
      </div>

      {/* Passport Information */}
      <SectionTitle>Passport Information</SectionTitle>
      <div className={grid}>
        <Field label="Name as per Passport">
          <TextInput value={p.passportName} onChange={(v) => set('passportName', v)} />
        </Field>
        <Field label="Passport No.">
          <TextInput value={p.passportNo} onChange={(v) => set('passportNo', v)} />
        </Field>
        <Field label="Issue Date">
          <DateInput value={p.passportIssueDate} onChange={(v) => set('passportIssueDate', v)} />
        </Field>
        <Field label="Expiry Date">
          <DateInput value={p.passportExpiryDate} onChange={(v) => set('passportExpiryDate', v)} />
        </Field>
        <Field label="Country Issued In">
          <Select options={allCountries} value={p.passportCountryIssued} onChange={(v) => set('passportCountryIssued', v)} />
        </Field>
        <Field label="City of Birth">
          <TextInput value={p.cityOfBirth} onChange={(v) => set('cityOfBirth', v)} />
        </Field>
        <Field label="Country of Birth">
          <Select options={allCountries} value={p.countryOfBirth} onChange={(v) => set('countryOfBirth', v)} />
        </Field>
      </div>

      {/* Nationality */}
      <SectionTitle>Nationality</SectionTitle>
      <div className="space-y-5">
        <YesNoField
          name="multiCitizen"
          label="Is the applicant a citizen of more than one country?"
          value={p.multiCitizen}
          onChange={(v) => set('multiCitizen', v)}
        />
        <YesNoField
          name="livingStudyingAbroad"
          label="Is the applicant living and studying in any other country?"
          value={p.livingStudyingAbroad}
          onChange={(v) => set('livingStudyingAbroad', v)}
        />
      </div>

      {/* Background Info */}
      <SectionTitle>Background Info</SectionTitle>
      <div className="space-y-5">
        <YesNoField
          name="appliedImmigration"
          label="Has applicant applied for any type of immigration into any country?"
          value={p.appliedImmigration}
          onChange={(v) => set('appliedImmigration', v)}
        />
        <YesNoField
          name="medicalCondition"
          label="Does applicant suffer from a serious medical condition?"
          value={p.medicalCondition}
          onChange={(v) => set('medicalCondition', v)}
        />
        <YesNoField
          name="visaRefusal"
          label="Has applicant Visa refusal for any country?"
          value={p.visaRefusal}
          onChange={(v) => set('visaRefusal', v)}
        />
        <YesNoField
          name="criminalOffence"
          label="Has applicant ever been convicted of a criminal offence?"
          value={p.criminalOffence}
          onChange={(v) => set('criminalOffence', v)}
        />
      </div>

      {/* Emergency Contacts */}
      <SectionTitle>Emergency Contacts</SectionTitle>
      <div className={grid}>
        <Field label="Name">
          <TextInput value={p.emergencyName} onChange={(v) => set('emergencyName', v)} />
        </Field>
        <Field label="Relationship with Applicant">
          <TextInput value={p.emergencyRelationship} onChange={(v) => set('emergencyRelationship', v)} />
        </Field>
        <Field label="Phone">
          <TextInput value={p.emergencyPhone} onChange={(v) => set('emergencyPhone', v)} />
        </Field>
        <Field label="E-mail">
          <TextInput type="email" value={p.emergencyEmail} onChange={(v) => set('emergencyEmail', v)} />
        </Field>
        <Field label="Address">
          <TextInput value={p.emergencyAddress} onChange={(v) => set('emergencyAddress', v)} />
        </Field>
        <Field label="Country">
          <Select options={allCountries} value={p.emergencyCountry} onChange={(v) => set('emergencyCountry', v)} />
        </Field>
        <Field label="State">
          <TextInput value={p.emergencyState} onChange={(v) => set('emergencyState', v)} />
        </Field>
        <Field label="City">
          <TextInput value={p.emergencyCity} onChange={(v) => set('emergencyCity', v)} />
        </Field>
        <Field label="Postal Code">
          <TextInput value={p.emergencyPostal} onChange={(v) => set('emergencyPostal', v)} />
        </Field>
      </div>

      {/* Save (main form) */}
      <div className="flex justify-center border-t border-slate-200 pt-6">
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-10 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Save
        </button>
      </div>

      {/* Collapsible repeater accordions */}
      <div className="space-y-4">
        <RepeaterSection title="Academic Details" fields={ACADEMIC_FIELDS} rows={p.academicDetails} onChange={(r) => set('academicDetails', r)} addLabel="Add Academic Record" />
        <RepeaterSection title="Tests, Foreign Languages" fields={TEST_FIELDS} rows={p.tests} onChange={(r) => set('tests', r)} addLabel="Add Test" />
        <RepeaterSection title="Internships & Courses" fields={INTERNSHIP_FIELDS} rows={p.internships} onChange={(r) => set('internships', r)} addLabel="Add Entry" />
        <RepeaterSection title="Employment History" fields={EMPLOYMENT_FIELDS} rows={p.employment} onChange={(r) => set('employment', r)} addLabel="Add Employment" />
        <RepeaterSection title="Visa Application History" fields={VISA_FIELDS} rows={p.visaHistory} onChange={(r) => set('visaHistory', r)} addLabel="Add Visa Record" />
        <RepeaterSection title="International Travel History" fields={TRAVEL_FIELDS} rows={p.travelHistory} onChange={(r) => set('travelHistory', r)} addLabel="Add Travel Record" />
        <RepeaterSection title="Family Details" fields={FAMILY_FIELDS} rows={p.familyDetails} onChange={(r) => set('familyDetails', r)} addLabel="Add Family Member" />
      </div>
    </form>
  )
}
