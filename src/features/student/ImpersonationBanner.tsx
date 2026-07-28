import { useNavigate } from 'react-router-dom'
import { UserRoundCog, LogOut } from 'lucide-react'
import { useAuth } from '../../store/auth'

/**
 * Amber strip shown across the student portal while an admin is "logged in as"
 * a student (impersonation). One click returns to the original admin account —
 * the safe way out, so the admin never has to re-login. Renders nothing when
 * not impersonating.
 */
export function ImpersonationBanner() {
  const navigate = useNavigate()
  const impersonator = useAuth((s) => s.impersonator)
  const user = useAuth((s) => s.user)
  const stopImpersonating = useAuth((s) => s.stopImpersonating)

  if (!impersonator) return null

  const back = () => {
    stopImpersonating()
    // Return the admin to the Students list they came from.
    navigate('/students', { replace: true })
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 bg-amber-400 px-4 py-2 text-center text-sm font-medium text-amber-950">
      <span className="inline-flex items-center gap-2">
        <UserRoundCog className="h-4 w-4" />
        You are viewing the portal as <span className="font-bold">{user?.name}</span>.
      </span>
      <button
        type="button"
        onClick={back}
        className="inline-flex items-center gap-1.5 rounded-md bg-amber-950 px-3 py-1 text-xs font-semibold text-amber-50 transition-colors hover:bg-amber-900"
      >
        <LogOut className="h-3.5 w-3.5" /> Return to admin ({impersonator.name})
      </button>
    </div>
  )
}
