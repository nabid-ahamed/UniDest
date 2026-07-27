import { useNavigate } from 'react-router-dom'
import { Compass, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../store/auth'
import logo from '../../assets/globaled-logo.png'

/** Where a signed-in user's home lives, based on their role. */
function homeFor(role?: string) {
  if (role === 'Student') return '/portal'
  return '/dashboard'
}

/**
 * 404 — shown for any URL that doesn't match a real route (broken / invalid links).
 * Standalone (no layout chrome) so it works regardless of which area the URL was in.
 */
export default function NotFoundPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const home = isAuthenticated ? homeFor(user?.role) : '/login'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <img
          src={logo}
          alt="GlobalEd — IELTS & Study Abroad Consultancy"
          width={1198}
          height={294}
          className="mx-auto h-9 w-auto"
        />

        <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
          <Compass className="h-8 w-8 text-brand-600" />
        </div>

        <p className="mt-6 text-5xl font-extrabold tracking-tight text-brand-600">404</p>
        <h1 className="mt-2 text-xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          The link may be broken, or the page may have been moved or removed.
        </p>

        <Button fullWidth className="mt-8" onClick={() => navigate(home)}>
          <ArrowLeft className="h-4 w-4" />
          {isAuthenticated ? 'Back to home' : 'Back to login'}
        </Button>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Copyright © {new Date().getFullYear()} GlobalEd. All Rights Reserved.
      </p>
    </div>
  )
}
