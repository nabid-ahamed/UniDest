import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, Globe2, Users, FileCheck2 } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../store/auth'
import logo from '../../assets/globaled-logo.png'
import logoWhite from '../../assets/globaled-logo-white.png'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

/** One-click demo logins — each row on the login screen maps to one of these. */
interface DemoAccount {
  role: string
  email: string
  password: string
  /** Where this role lands after signing in. */
  redirect: string
  /** Badge colour classes for the Role chip. */
  badge: string
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'Admin',
    email: 'admin@gmail.com',
    password: '123456',
    redirect: '/dashboard',
    badge: 'bg-brand-50 text-brand-600',
  },
  {
    role: 'Student',
    email: 'student@gmail.com',
    password: '123456',
    redirect: '/portal',
    badge: 'bg-emerald-50 text-emerald-600',
  },
]

const highlights = [
  { icon: Users, text: 'Manage leads & students in one place' },
  { icon: FileCheck2, text: 'Track applications end to end' },
  { icon: Globe2, text: 'Universities & courses worldwide' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuth((s) => s.login)
  const [showPassword, setShowPassword] = useState(false)

  // Holds the email of the row whose "Copy" was just clicked (for the "Filled ✓" flash).
  const [copiedEmail, setCopiedEmail] = useState('')
  const [authError, setAuthError] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: true },
  })

  const onSubmit = async (values: FormValues) => {
    // Mock sign-in — only the demo credentials are accepted.
    await new Promise((r) => setTimeout(r, 600))
    const email = values.email.trim().toLowerCase()
    const account = DEMO_ACCOUNTS.find((a) => a.email === email && a.password === values.password)
    if (!account) {
      setAuthError('Invalid credentials. Use the demo login below.')
      return
    }
    setAuthError('')
    login(account.email, account.role)
    navigate(account.redirect)
  }

  /** Auto-fill the email + password fields with a demo account's credentials. */
  const fillDemo = (account: DemoAccount) => {
    setAuthError('')
    setValue('email', account.email, { shouldValidate: true })
    setValue('password', account.password, { shouldValidate: true })
    navigator.clipboard?.writeText(`${account.email} / ${account.password}`).catch(() => {})
    setCopiedEmail(account.email)
    window.setTimeout(() => setCopiedEmail(''), 1600)
  }

  const clearDemo = () => {
    setValue('email', '', { shouldValidate: false })
    setValue('password', '', { shouldValidate: false })
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-700 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />

        <div className="relative">
          {/* White wordmark sits directly on the blue panel — no plate needed. */}
          <img
            src={logoWhite}
            alt="GlobalEd — IELTS & Study Abroad Consultancy"
            width={1200}
            height={294}
            className="h-11 w-auto"
          />
        </div>

        <div className="relative">
          <h1 className="max-w-md text-4xl font-extrabold leading-tight">
            Your study-abroad journey, beautifully managed.
          </h1>
          <p className="mt-4 max-w-md text-brand-100">
            The all-in-one CRM for education consultancies — from first enquiry
            to enrolment.
          </p>

          <ul className="mt-10 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-brand-50">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-brand-200">
          Copyright © {new Date().getFullYear()} GlobalEd All Rights Reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <img
              src={logo}
              alt="GlobalEd — IELTS & Study Abroad Consultancy"
              width={1198}
              height={294}
              className="h-10 w-auto"
            />
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Sign in to your consultancy dashboard.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} onChange={() => authError && setAuthError('')} className="mt-8 space-y-5">
            {authError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {authError}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <Input
                type="email"
                placeholder="you@agency.com"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                autoComplete="off"
                {...register('email')}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                icon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                autoComplete="new-password"
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="pointer-events-auto text-slate-500 hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
                {...register('password')}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                {...register('remember')}
              />
              Remember me for 30 days
            </label>

            <Button type="submit" fullWidth loading={isSubmitting}>
              Sign in
            </Button>
          </form>

          {/* Demo credentials — Copy auto-fills the form above. */}
          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700">
              Demo Login Info
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Email / Password</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DEMO_ACCOUNTS.map((account) => (
                  <tr key={account.email}>
                    <td className="px-3 py-3 align-top">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ${account.badge}`}>
                        {account.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="text-sm font-semibold text-slate-800">{account.email}</p>
                      <p className="text-sm font-semibold text-slate-800">{account.password}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => fillDemo(account)}
                          className="min-w-[62px] shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                        >
                          {copiedEmail === account.email ? 'Filled ✓' : 'Copy'}
                        </button>
                        <button
                          type="button"
                          onClick={clearDemo}
                          className="rounded-lg px-2 py-1.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
                        >
                          Clear
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
