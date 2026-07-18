import { useAuth } from '../../store/auth'

export default function DashboardPage() {
  const user = useAuth((s) => s.user)

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">
        Welcome back, <span className="capitalize">{user?.name || 'Admin'}</span> 👋
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Here&apos;s what&apos;s happening across your consultancy today.
      </p>

      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-slate-500">This page is still not built yet.</p>
      </div>
    </div>
  )
}
