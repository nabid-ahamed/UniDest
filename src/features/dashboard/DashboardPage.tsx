import { useNavigate } from 'react-router-dom'
import { GraduationCap, LogOut } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../store/auth'

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-slate-900">UniDest</span>
        </div>
        <Button variant="secondary" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {user?.name || 'Admin'} 👋
        </h1>
        <p className="mt-3 text-slate-500">
          Login works. The admin dashboard will be built here next — send your
          reference screenshots and we&apos;ll match that design.
        </p>
      </main>
    </div>
  )
}
