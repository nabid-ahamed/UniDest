import { useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  CalendarDays,
  Briefcase,
  Building2,
  GitBranch,
  ShieldCheck,
  Users,
  ExternalLink,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { pickTextColor } from '../../lib/contrast'
import {
  getUser,
  avatarColor,
  initials,
  reportingToName,
  directReports,
  type UserStatus,
} from '../../mock/userManagement'

const STATUS_BADGE: Record<UserStatus, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Inactive: 'bg-slate-100 text-slate-500',
  Blocked: 'bg-rose-100 text-rose-700',
}

export default function UserViewPage() {
  const { id } = useParams()
  const user = getUser(Number(id))

  if (!user) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">User not found.</p>
        <a href="/user-management" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to User Management
        </a>
      </div>
    )
  }

  const bg = avatarColor(user.name)
  const manager = reportingToName(user.reportingToId)
  const reports = directReports(user.id)

  return (
    <div className="space-y-5">
      {/* Identity header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold"
              style={{ backgroundColor: bg, color: pickTextColor(bg) }}
              aria-hidden="true"
            >
              {initials(user.name)}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
                <span className={cn('rounded-md px-2.5 py-1 text-xs font-semibold', STATUS_BADGE[user.status])}>
                  {user.status}
                </span>
                {user.isSuperAdmin && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                    <ShieldCheck className="h-3.5 w-3.5" /> Super Admin
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
                <a href={`mailto:${user.email}`} className="inline-flex items-center gap-1.5 hover:text-brand-600">
                  <Mail className="h-4 w-4 text-slate-400" /> {user.email}
                </a>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-slate-400" /> {user.mobile || '—'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-slate-400" /> Created {user.createdOn}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/user-management/${user.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Pencil className="h-4 w-4" /> Edit
            </a>
            <a
              href="/user-management"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </a>
          </div>
        </div>
      </div>

      {/* Access details */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Roles & Access" icon={Briefcase}>
          <div className="flex flex-wrap gap-2">
            {user.roles.map((r) => (
              <span key={r} className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600">
                <Briefcase className="h-3 w-3" /> {r}
              </span>
            ))}
          </div>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Branches</p>
          <div className="flex flex-wrap gap-2">
            {user.branches.map((b) => (
              <span key={b} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                <Building2 className="h-3 w-3" /> {b}
              </span>
            ))}
          </div>
        </Panel>

        <Panel title="Reporting Line" icon={GitBranch}>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-500">Reports to</span>
              <span className="font-semibold text-slate-800">{manager ?? '—'}</span>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-sm text-slate-500">
                <Users className="h-4 w-4 text-slate-400" /> Direct reports
                <span className="ml-1 rounded bg-slate-100 px-1.5 text-xs font-bold text-slate-600">{reports.length}</span>
              </p>
              {reports.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {reports.map((r) => (
                    <a
                      key={r.id}
                      href={`/user-management/${r.id}`}
                      className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-600"
                    >
                      {r.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
            {user.staffId != null && (
              <a
                href={`/staff/${user.staffId}`}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
              >
                <ExternalLink className="h-4 w-4" /> View workload in Staff
              </a>
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Briefcase; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
        <Icon className="h-4 w-4 text-slate-400" /> {title}
      </h2>
      {children}
    </div>
  )
}
