import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Field } from '../../components/DataTableUI'
import {
  staffRoles,
  staffBranches,
  getStaff,
  addStaff,
  updateStaff,
  type StaffRole,
  type StaffStatus,
} from '../../mock/staff'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function StaffFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = id ? getStaff(Number(id)) : undefined
  const isEdit = Boolean(id)

  const [name, setName] = useState(editing?.name ?? '')
  const [email, setEmail] = useState(editing?.email ?? '')
  const [phone, setPhone] = useState(editing?.phone ?? '')
  const [role, setRole] = useState<StaffRole | ''>(editing?.role ?? '')
  const [branch, setBranch] = useState(editing?.branch ?? '')
  const [status, setStatus] = useState<StaffStatus>(editing?.status ?? 'Active')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (isEdit && !editing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Staff member not found.</p>
        <a href="/staff" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Staff
        </a>
      </div>
    )
  }

  const submit = () => {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Please enter a name.'
    if (!email.trim()) next.email = 'Please enter an email.'
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Please enter a valid email.'
    if (!role) next.role = 'Please choose a role.'
    if (!branch) next.branch = 'Please choose a branch.'
    if (!isEdit && password.length > 0 && password.length < 6) next.password = 'Password must be at least 6 characters.'
    setErrors(next)
    if (Object.keys(next).length) return

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: role as StaffRole,
      branch,
      status,
    }
    if (isEdit && editing) {
      updateStaff(editing.id, payload)
      navigate(`/staff/${editing.id}`)
    } else {
      const created = addStaff({ ...payload, joined: 'Just now' })
      navigate(`/staff/${created.id}`)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Staff Member' : 'Add Staff Member'}</h1>
        <a
          href="/staff"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </a>
      </div>

      <div className="mt-6 max-w-2xl space-y-5">
        <div>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div>
            <label htmlFor="sf-phone" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Phone
            </label>
            <input
              id="sf-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+880 1700 000000"
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Role *">
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value as StaffRole); setErrors((p) => ({ ...p, role: '' })) }}
              className={cn('input', errors.role && 'border-rose-500')}
            >
              <option value="">Select role</option>
              {staffRoles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            {errors.role && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.role}</p>}
          </Field>
          <Field label="Branch *">
            <select
              value={branch}
              onChange={(e) => { setBranch(e.target.value); setErrors((p) => ({ ...p, branch: '' })) }}
              className={cn('input', errors.branch && 'border-rose-500')}
            >
              <option value="">Select branch</option>
              {staffBranches.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
            {errors.branch && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.branch}</p>}
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Status</span>
            <div className="flex items-center gap-6 pt-1.5">
              {(['Active', 'Inactive'] as const).map((s) => (
                <label key={s} className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="radio"
                    name="sf_status"
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
          {!isEdit && (
            <div>
              <label htmlFor="sf-pass" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                id="sf-pass"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })) }}
                placeholder="Min 6 characters (optional)"
                className={cn('input', errors.password && 'border-rose-500')}
              />
              {errors.password && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.password}</p>}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3 border-t border-slate-100 pt-5">
          <button
            onClick={submit}
            className="rounded-lg bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            {isEdit ? 'Save Changes' : 'Create Staff'}
          </button>
          <a
            href="/staff"
            className="rounded-lg border border-slate-300 bg-white px-8 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
  )
}
