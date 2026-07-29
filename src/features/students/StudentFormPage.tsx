import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Field } from '../../components/DataTableUI'
import { AvatarUpload } from '../../components/AvatarUpload'
import { Avatar } from '../../components/Avatar'
import {
  getStudent,
  addStudent,
  updateStudent,
  studentStatuses,
  studentStaff,
  studentBranches,
  studentSources,
  studentCourses,
  residenceCountries,
  universities,
  allCountries,
  studyLevels,
  intakes,
} from '../../mock/students'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Real branches (the shared list leads with the "All Branch" filter option). */
const branchOptions = studentBranches.filter((b) => b !== 'All Branch')

export default function StudentFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = id ? getStudent(Number(id)) : undefined
  const isEdit = Boolean(id)

  const [name, setName] = useState(editing?.name ?? '')
  const [email, setEmail] = useState(editing?.email ?? '')
  const [phone, setPhone] = useState(editing?.phone ?? '')
  const [phoneNote, setPhoneNote] = useState(editing?.phoneNote ?? 'Primary')
  const [branch, setBranch] = useState(editing?.branch ?? branchOptions[0])
  const [status, setStatus] = useState(editing?.status ?? studentStatuses[0].label)
  const [assignedTo, setAssignedTo] = useState(editing?.assignedTo ?? '')
  const [residence, setResidence] = useState(editing?.countryOfResidence ?? residenceCountries[0])
  const [countryInterested, setCountryInterested] = useState(editing?.countryInterested ?? 'United Kingdom')
  const [studyLevel, setStudyLevel] = useState(editing?.studyLevel ?? studyLevels[0])
  const [course, setCourse] = useState(editing?.course ?? studentCourses[0])
  const [intake, setIntake] = useState(editing?.intake ?? intakes[0])
  const [university, setUniversity] = useState(editing?.university ?? '')
  const [source, setSource] = useState(editing?.source ?? studentSources[0])
  const [avatar, setAvatar] = useState<string | null>(editing?.avatar ?? null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (isEdit && !editing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Student not found.</p>
        <a href="/students" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Student Management
        </a>
      </div>
    )
  }

  const submit = () => {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Please enter a name.'
    if (!email.trim()) next.email = 'Please enter an email.'
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Please enter a valid email.'
    if (!phone.trim()) next.phone = 'Please enter a phone number.'
    setErrors(next)
    if (Object.keys(next).length) return

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      phoneNote: phoneNote.trim() || 'Primary',
      branch,
      status,
      assignedTo: assignedTo || null,
      countryOfResidence: residence,
      countryInterested,
      studyLevel,
      course,
      intake,
      university: university || null,
      source,
      avatar: avatar ?? undefined,
    }

    if (isEdit && editing) {
      updateStudent(editing.id, payload)
      navigate(`/students/${editing.id}`)
    } else {
      const created = addStudent(payload)
      navigate(`/students/${created.id}`)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Student' : 'New Student'}</h1>
        <a
          href="/students"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </a>
      </div>

      <div className="mt-6 max-w-3xl space-y-6">
        {/* Contact */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Contact</h2>
          <div className="mt-3">
            <AvatarUpload
              value={avatar}
              onChange={setAvatar}
              fallback={name.trim() ? <Avatar name={name} className="h-full w-full" /> : undefined}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="sf-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                id="sf-name"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })) }}
                className={cn('input', errors.name && 'border-rose-500')}
              />
              {errors.name && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="sf-email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Email <span className="text-rose-600">*</span>
              </label>
              <input
                id="sf-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })) }}
                className={cn('input', errors.email && 'border-rose-500')}
              />
              {errors.email && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.email}</p>}
            </div>
            <div className="grid grid-cols-[1fr_8rem] gap-3">
              <div>
                <label htmlFor="sf-phone" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Phone <span className="text-rose-600">*</span>
                </label>
                <input
                  id="sf-phone"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: '' })) }}
                  placeholder="+880 1700 000000"
                  className={cn('input', errors.phone && 'border-rose-500')}
                />
                {errors.phone && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="sf-phone-note" className="mb-1.5 block text-sm font-semibold text-slate-700">Label</label>
                <input
                  id="sf-phone-note"
                  value={phoneNote}
                  onChange={(e) => setPhoneNote(e.target.value)}
                  placeholder="Primary"
                  className="input"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Study interest */}
        <section className="border-t border-slate-100 pt-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Study Interest</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Country Interested In">
              <select value={countryInterested} onChange={(e) => setCountryInterested(e.target.value)} className="input">
                {allCountries.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Study Level">
              <select value={studyLevel} onChange={(e) => setStudyLevel(e.target.value)} className="input">
                {studyLevels.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="Course">
              <select value={course} onChange={(e) => setCourse(e.target.value)} className="input">
                {studentCourses.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="Intake">
              <select value={intake} onChange={(e) => setIntake(e.target.value)} className="input">
                {intakes.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="University">
              <select value={university} onChange={(e) => setUniversity(e.target.value)} className="input">
                <option value="">— Not decided —</option>
                {universities.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="Country Of Residence">
              <select value={residence} onChange={(e) => setResidence(e.target.value)} className="input">
                {residenceCountries.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        {/* Assignment */}
        <section className="border-t border-slate-100 pt-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Assignment</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Branch">
              <select value={branch} onChange={(e) => setBranch(e.target.value)} className="input">
                {branchOptions.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
                {studentStatuses.map((x) => (
                  <option key={x.label}>{x.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Assigned To Staff">
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="input">
                <option value="">Unassigned</option>
                {studentStaff.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="Source">
              <select value={source} onChange={(e) => setSource(e.target.value)} className="input">
                {studentSources.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <div className="flex justify-center gap-3 border-t border-slate-100 pt-6">
          <button
            onClick={submit}
            className="rounded-lg bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            {isEdit ? 'Save Changes' : 'Create Student'}
          </button>
          <a
            href="/students"
            className="rounded-lg border border-slate-300 bg-white px-8 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
  )
}
