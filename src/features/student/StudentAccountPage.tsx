import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { KeyRound, Copy, Check, Share2, Wallet, TrendingUp, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { showSuccessDialog } from '../../store/successDialog'
import { currentStudent } from '../../mock/student/portal'
import { allCountries, updateStudent } from '../../mock/students'
import {
  loadStudentProfile,
  saveStudentProfile,
  genders,
  payoutMethods,
  type StudentProfile,
} from '../../mock/student/studentProfile'
import { Field, TextInput, Select } from './components/profileFields'

const TABS = ['Basic Info', 'Affiliate', 'Payment Preference', 'My Earnings'] as const
type Tab = (typeof TABS)[number]

function splitName(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts.shift() ?? ''
  const last = parts.length ? (parts.pop() as string) : ''
  return { first, middle: parts.join(' '), last }
}

export default function StudentAccountPage() {
  const [tab, setTab] = useState<Tab>('Basic Info')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">My Account</h1>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold text-slate-800">Your Profile</h2>

        {/* Tabs */}
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                '-mb-px border-b-2 px-1 py-2.5 text-sm font-semibold transition-colors',
                tab === t
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="pt-6">
          {tab === 'Basic Info' ? (
            <BasicInfoTab />
          ) : tab === 'Affiliate' ? (
            <AffiliateTab />
          ) : tab === 'Payment Preference' ? (
            <PaymentPreferenceTab />
          ) : (
            <MyEarningsTab />
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Basic Info — the account form                                       */
/* ------------------------------------------------------------------ */

function BasicInfoTab() {
  const student = currentStudent()
  const nameParts = useMemo(() => splitName(student.name), [student.name])

  const [firstName, setFirstName] = useState(nameParts.first)
  const [lastName, setLastName] = useState(nameParts.last)
  const [email, setEmail] = useState(student.email)
  const [mobile, setMobile] = useState(student.phone)
  const [p, setP] = useState<StudentProfile>(() => {
    const loaded = loadStudentProfile(student.id)
    return {
      ...loaded,
      middleName: loaded.middleName || nameParts.middle,
      currentCountry: loaded.currentCountry || student.countryOfResidence,
    }
  })
  const set = <K extends keyof StudentProfile>(key: K, value: StudentProfile[K]) =>
    setP((prev) => ({ ...prev, [key]: value }))

  const [changing, setChanging] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const update = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!firstName.trim()) next.firstName = 'First name is required.'
    if (!lastName.trim()) next.lastName = 'Last name is required.'
    if (!email.trim()) next.email = 'E-mail is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid e-mail.'
    if (!mobile.trim()) next.mobile = 'Mobile is required.'
    setErrors(next)
    if (Object.keys(next).length) return

    const name = [firstName.trim(), p.middleName.trim(), lastName.trim()].filter(Boolean).join(' ')
    updateStudent(student.id, {
      name,
      email: email.trim(),
      phone: mobile.trim(),
      ...(p.currentCountry ? { countryOfResidence: p.currentCountry } : {}),
    })
    saveStudentProfile(student.id, p)
    showSuccessDialog('Your account details have been updated.', 'Updated!')
  }

  return (
    <form onSubmit={update} className="space-y-6">
      {/* Photo + change password */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
            {student.name.charAt(0)}
          </span>
          <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            Choose Photo
            <input type="file" accept=".jpg,.jpeg,.png" className="hidden" />
          </label>
        </div>
        <button
          type="button"
          onClick={() => setChanging(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <KeyRound className="h-4 w-4" /> Change Password
        </button>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
        <Field label="First Name" required error={errors.firstName}>
          <TextInput value={firstName} onChange={setFirstName} invalid={!!errors.firstName} placeholder="First name" />
        </Field>
        <Field label="Middle Name">
          <TextInput value={p.middleName} onChange={(v) => set('middleName', v)} placeholder="Middle name" />
        </Field>
        <Field label="Last Name" required error={errors.lastName}>
          <TextInput value={lastName} onChange={setLastName} invalid={!!errors.lastName} placeholder="Last name" />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">Gender</p>
        <div className="flex flex-wrap items-center gap-6">
          {genders.map((g) => (
            <label key={g} className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="account-gender"
                checked={p.gender === g}
                onChange={() => set('gender', g)}
                className="h-4 w-4 accent-brand-600"
              />
              {g}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
        <Field label="E-mail Address" required error={errors.email}>
          <TextInput type="email" value={email} onChange={setEmail} invalid={!!errors.email} placeholder="name@example.com" />
        </Field>
        <Field label="Mobile No." required error={errors.mobile}>
          <TextInput value={mobile} onChange={setMobile} invalid={!!errors.mobile} placeholder="+880 1700-000000" />
        </Field>
        <Field label="Whatsapp No.">
          <TextInput value={p.whatsapp} onChange={(v) => set('whatsapp', v)} placeholder="+880 1700-000000" />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
        <Field label="Country" required>
          <Select options={allCountries} value={p.currentCountry} onChange={(v) => set('currentCountry', v)} />
        </Field>
        <Field label="State">
          <TextInput value={p.currentState} onChange={(v) => set('currentState', v)} placeholder="State / Province" />
        </Field>
        <Field label="City">
          <TextInput value={p.currentCity} onChange={(v) => set('currentCity', v)} placeholder="City" />
        </Field>
      </div>

      <div className="flex justify-center border-t border-slate-200 pt-6">
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-10 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Update
        </button>
      </div>

      {changing && <ChangePasswordDialog onClose={() => setChanging(false)} />}
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* Affiliate — refer a friend                                          */
/* ------------------------------------------------------------------ */

function AffiliateTab() {
  const student = currentStudent()
  const link = `https://globaled.com/join?ref=${student.studentNo}`
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // Clipboard blocked — the link is still selectable on screen.
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Share2 className="h-6 w-6" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Refer a Friend</h3>
          <p className="mt-1 text-sm text-slate-600">
            Share your personal link. When a friend signs up and enrols, you earn a referral reward.
          </p>
        </div>
      </div>

      <Field label="Your Referral Link">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none"
          />
          <button
            type="button"
            onClick={copy}
            className={cn(
              'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors',
              copied ? 'bg-emerald-500 text-white' : 'bg-brand-600 text-white hover:bg-brand-700',
            )}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </Field>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Payment Preference — how referral rewards are paid out              */
/* ------------------------------------------------------------------ */

function PaymentPreferenceTab() {
  const student = currentStudent()
  const [p, setP] = useState<StudentProfile>(() => loadStudentProfile(student.id))
  const set = <K extends keyof StudentProfile>(key: K, value: StudentProfile[K]) =>
    setP((prev) => ({ ...prev, [key]: value }))

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    saveStudentProfile(student.id, p)
    showSuccessDialog('Your payment preference has been saved.', 'Saved!')
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Wallet className="h-6 w-6" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Payment Preference</h3>
          <p className="mt-1 text-sm text-slate-600">Where should we send your referral rewards?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <Field label="Payout Method">
          <Select options={payoutMethods} value={p.payoutMethod} onChange={(v) => set('payoutMethod', v)} />
        </Field>
        <Field label="Account / Number">
          <TextInput
            value={p.payoutAccount}
            onChange={(v) => set('payoutAccount', v)}
            placeholder="Account number, wallet or email"
          />
        </Field>
      </div>

      <div className="flex justify-start pt-2">
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Save
        </button>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* My Earnings                                                         */
/* ------------------------------------------------------------------ */

function MyEarningsTab() {
  const stats = [
    { label: 'Referred Friends', value: '0', icon: Share2 },
    { label: 'Pending Rewards', value: 'USD 0.00', icon: Wallet },
    { label: 'Total Earned', value: 'USD 0.00', icon: TrendingUp },
  ]
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <s.icon className="h-6 w-6" />
            </span>
            <p className="mt-4 text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
        You haven't earned any referral rewards yet. Share your link from the{' '}
        <span className="font-semibold text-brand-600">Affiliate</span> tab to get started.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Change Password modal                                               */
/* ------------------------------------------------------------------ */

function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!current) errs.current = 'Enter your current password.'
    if (next.length < 6) errs.next = 'New password must be at least 6 characters.'
    if (confirm !== next) errs.confirm = 'Passwords do not match.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    onClose()
    showSuccessDialog('Your password has been changed successfully.', 'Updated!')
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-6">
      <form onSubmit={submit} className="mt-12 w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">Change Password</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5 px-6 py-6">
          <Field label="Current Password" error={errors.current}>
            <TextInput type="password" value={current} onChange={setCurrent} invalid={!!errors.current} placeholder="••••••••" />
          </Field>
          <Field label="New Password" error={errors.next}>
            <TextInput type="password" value={next} onChange={setNext} invalid={!!errors.next} placeholder="At least 6 characters" />
          </Field>
          <Field label="Confirm New Password" error={errors.confirm}>
            <TextInput type="password" value={confirm} onChange={setConfirm} invalid={!!errors.confirm} placeholder="Re-enter new password" />
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
            Change Password
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
