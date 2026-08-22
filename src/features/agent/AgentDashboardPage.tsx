import { BriefcaseBusiness, FileText, Users } from 'lucide-react'
import { useAgentCommissions, useAgentReferrals, useApplications, useAnnouncements, useStudents } from '../../lib/api'

export default function AgentDashboardPage() {
  const { data: students = [] } = useStudents()
  const { data: applications } = useApplications()
  const { data: commissions = [] } = useAgentCommissions()
  const { data: referrals = [] } = useAgentReferrals()
  const { data: announcements = [] } = useAnnouncements()
  const earnings = commissions.reduce((total, row) => total + row.amount, 0)
  const cards = [
    ['Students', String(students.length), Users],
    ['Applications', String(applications?.length ?? 0), FileText],
    ['Commission', commissions.length ? `${commissions[0].currency} ${earnings.toFixed(2)}` : '0.00', BriefcaseBusiness],
  ] as const
  const pending = referrals.filter((row) => row.type === 'Lead').length
  const converted = referrals.filter((row) => row.type === 'Student').length
  return <section className="mx-auto max-w-6xl"><div className="rounded-xl bg-brand-700 p-6 text-white shadow-sm sm:p-8"><p className="text-sm font-semibold uppercase tracking-wide text-brand-100">Agent portal</p><h1 className="mt-2 text-2xl font-bold">Your partner workspace</h1><p className="mt-2 max-w-xl text-sm text-brand-100">Manage referred students and applications from one focused workspace.</p></div><div className="mt-5 grid gap-4 sm:grid-cols-3">{cards.map(([label, value, Icon]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-brand-600" /><p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p></div>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-800">Referral pipeline</p><div className="mt-4 flex gap-8"><div><p className="text-xs text-slate-500">Pending leads</p><p className="mt-1 text-2xl font-bold text-amber-600">{pending}</p></div><div><p className="text-xs text-slate-500">Converted students</p><p className="mt-1 text-2xl font-bold text-emerald-600">{converted}</p></div></div></div><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-800">Announcements</p>{announcements.slice(0, 2).map((item) => <p key={item.id} className="mt-3 truncate text-sm text-slate-600">{item.title}</p>)}{announcements.length === 0 && <p className="mt-3 text-sm text-slate-500">No announcements yet.</p>}</div></div></section>
}