import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Field } from '../../components/DataTableUI'
import { MultiSelect } from '../../components/MultiSelect'
import {
  getUser,
  addUser,
  updateUser,
  userRoles,
  userBranches,
  userStatuses,
  reportingOptions,
  type UserStatus,
} from '../../mock/userManagement'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function today(): string {
  const d = new Date()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export default function UserFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = id ? getUser(Number(id)) : undefined
  const isEdit = Boolean(id)

  const [name, setName] = useState(editing?.name ?? '')
  const [email, setEmail] = useState(editing?.email ?? '')
  const [mobile, setMobile] = useState(editing?.mobile ?? '')
  const [roles, setRoles] = useState<string[]>(editing?.roles ?? [])
  const [branches, setBranches] = useState<string[]>(editing?.branches ?? [])
  const [reportingToId, setReportingToId] = useState(editing?.reportingToId != null ? String(editing.reportingToId) : '')
  const [status, setStatus] = useState<UserStatus>(editing?.status ?? 'Active')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (isEdit && !editing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">User not found.</p>
        <a href="/user-management" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to User Management
        </a>
      </div>
    )
  }

  const managers = reportingOptions(editing?.id)

  const submit = () => {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Please enter a name.'
    if (!email.trim()) next.email = 'Please enter an email.'
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Please enter a valid email.'
    if (roles.length === 0) next.roles = 'Please select at least one role.'
    if (branches.length === 0) next.branches = 'Please select at least one branch.'
    if (!isEdit && password.length > 0 && password.length < 6) next.password = 'Password must be at least 6 characters.'
    setErrors(next)
    if (Object.keys(next).length) return

    const payload = {
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      roles,
      branches,
      reportingToId: reportingToId ? Number(reportingToId) : null,
      status,
    }
    if (isEdit && editing) {
      updateUser(editing.id, payload)
      navigate(`/user-management/${editing.id}`)
    } else {
      const created = addUser({ ...payload, createdOn: today(), isSuperAdmin: false, staffId: null })
      navigate(`/user-management/${created.id}`)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit User' : 'Create User'}</h1>
        <a
          href="/user-management"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </a>
      </div>

      <div className="mt-6 max-w-2xl space-y-5">
        <div>
          <label htmlFor="uf-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Full Name <span className="text-rose-600">*</span>
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
          <div>
            <label htmlFor="uf-email" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Email <span className="text-rose-600">*</span>
            </label>
            <input
              id="uf-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })) }}
              className={cn('input', errors.email && 'border-rose-500')}
            />
            {errors.email && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="uf-mobile" className="mb-1.5 block text-sm font-semibold text-slate-700">Mobile</label>
            <input
              id="uf-mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+880 1700 000000"
              className="input"
            />
          </div>
        </div>

        <Field label="Role(s) *">
          <MultiSelect options={[...userRoles]} selected={roles} onChange={(v) => { setRoles(v); setErrors((p) => ({ ...p, roles: '' })) }} placeholder="Select roles" />
          {errors.roles && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.roles}</p>}
        </Field>

        <Field label="Branch(es) *">
          <MultiSelect options={[...userBranches]} selected={branches} onChange={(v) => { setBranches(v); setErrors((p) => ({ ...p, branches: '' })) }} placeholder="Select branches" />
          {errors.branches && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.branches}</p>}
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Reporting To">
            <select value={reportingToId} onChange={(e) => setReportingToId(e.target.value)} className="input">
              <option value="">— None —</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </Field>
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Status</span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1.5">
              {userStatuses.map((s) => (
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

        {!isEdit && (
          <div className="max-w-sm">
            <label htmlFor="uf-pass" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
            <input
              id="uf-pass"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })) }}
              placeholder="Min 6 characters (optional)"
              className={cn('input', errors.password && 'border-rose-500')}
            />
            {errors.password && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.password}</p>}
          </div>
        )}

        <div className="flex justify-center gap-3 border-t border-slate-100 pt-5">
          <button
            onClick={submit}
            className="rounded-lg bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            {isEdit ? 'Save Changes' : 'Create User'}
          </button>
          <a
            href="/user-management"
            className="rounded-lg border border-slate-300 bg-white px-8 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
  )
}
