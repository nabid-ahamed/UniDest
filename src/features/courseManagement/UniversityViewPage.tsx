import { useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Building2, MapPin, Globe, CalendarDays, Award, BookOpen, Plus } from 'lucide-react'
import { cn } from '../../lib/cn'
import { getUniversity, coursesForUniversity } from '../../mock/courseManagement'

export default function UniversityViewPage() {
  const { id } = useParams()
  const uni = getUniversity(Number(id))

  if (!uni) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">University not found.</p>
        <a href="/universities" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Universities
        </a>
      </div>
    )
  }

  const courses = coursesForUniversity(uni.name)
  const enabled = courses.filter((c) => c.status === 'Enabled').length

  const facts = [
    { label: 'Location', value: `${uni.city}, ${uni.country}`, icon: MapPin },
    { label: 'Type', value: uni.type, icon: Building2 },
    { label: 'Established', value: uni.established != null ? String(uni.established) : '—', icon: CalendarDays },
    { label: 'World Ranking', value: uni.ranking != null ? `#${uni.ranking}` : '—', icon: Award },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className={cn('flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white', uni.logoClass)}
              aria-hidden="true"
            >
              <Building2 className="h-7 w-7" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{uni.name}</h1>
                <span
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-semibold',
                    uni.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                  )}
                >
                  {uni.status}
                </span>
                <span
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-semibold',
                    uni.showToAgent ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {uni.showToAgent ? 'Shown to agents' : 'Hidden from agents'}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" /> {uni.city}, {uni.country}
                </span>
                {uni.website && (
                  <a
                    href={`https://${uni.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-brand-600"
                  >
                    <Globe className="h-4 w-4 text-slate-400" /> {uni.website}
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/universities/${uni.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Pencil className="h-4 w-4" /> Edit
            </a>
            <a
              href="/universities"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </a>
          </div>
        </div>

        {/* Facts + course tallies */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <f.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">{f.label}</p>
                <p className="truncate text-sm font-semibold text-slate-800">{f.value}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold tabular-nums text-slate-900">{courses.length}</p>
              <p className="text-sm text-slate-500">Courses ({enabled} enabled)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses at this university */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">
            Courses <span className="ml-1 text-sm font-semibold text-slate-400">({courses.length})</span>
          </h2>
          <a
            href="/courses/new"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" /> Add Course
          </a>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Study Level</th>
                <th className="px-4 py-3">Study Area</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 text-sm text-slate-600">
                  <td className="px-4 py-3">
                    <a href={`/courses/${c.id}`} className="font-semibold text-slate-800 hover:text-brand-600 hover:underline">
                      {c.title}
                    </a>
                  </td>
                  <td className="px-4 py-3">{c.studyLevel}</td>
                  <td className="px-4 py-3">{c.studyArea}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-xs font-semibold',
                        c.status === 'Enabled' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                      )}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                    No courses linked to this university yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
