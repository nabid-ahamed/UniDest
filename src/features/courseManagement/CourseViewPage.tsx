import { useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Pencil,
  Building2,
  MapPin,
  GraduationCap,
  Clock,
  CalendarDays,
  Globe,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { getCourse, universityByName } from '../../mock/courseManagement'

export default function CourseViewPage() {
  const { id } = useParams()
  const course = getCourse(Number(id))

  if (!course) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Course not found.</p>
        <a href="/courses" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Courses
        </a>
      </div>
    )
  }

  const uni = universityByName(course.university)
  const duration =
    course.durationMonths != null
      ? `${course.durationMonths} months`
      : course.durationYears != null
        ? `${course.durationYears} years`
        : '—'

  const facts = [
    { label: 'Study Level', value: course.studyLevel, icon: GraduationCap },
    { label: 'Study Area', value: course.studyArea, icon: Building2 },
    { label: 'Discipline', value: course.disciplineArea, icon: Building2 },
    { label: 'Campus', value: `${course.city}, ${course.country}`, icon: MapPin },
    { label: 'Duration', value: duration, icon: Clock },
    { label: 'Intakes', value: course.intakes.join(', ') || '—', icon: CalendarDays },
  ]

  const scores = [
    { label: 'IELTS', value: course.ielts },
    { label: 'IELTS (no band <)', value: course.ieltsNoBand },
    { label: 'TOEFL', value: course.toefl },
    { label: 'PTE', value: course.pte },
    { label: 'GRE', value: course.gre },
    { label: 'GMAT', value: course.gmat },
  ].filter((s) => s.value != null)

  const fees = [
    { label: 'Tuition Fee (Yearly)', value: course.tuitionFee ?? '—' },
    { label: 'Application Fee', value: course.applicationFee ?? '—' },
    { label: 'Commission', value: course.commission || '—' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white',
                course.logoClass,
              )}
              aria-hidden="true"
            >
              <GraduationCap className="h-6 w-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{course.title}</h1>
                <span
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-semibold',
                    course.status === 'Enabled' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                  )}
                >
                  {course.status}
                </span>
              </div>
              <a
                href={uni ? `/universities/${uni.id}` : undefined}
                className={cn(
                  'mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600',
                  uni && 'hover:text-brand-600 hover:underline',
                )}
              >
                <Building2 className="h-4 w-4 text-slate-400" /> {course.university}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/courses/${course.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Pencil className="h-4 w-4" /> Edit
            </a>
            <a
              href="/courses"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </a>
          </div>
        </div>

        {/* Facts grid */}
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
        </div>
      </div>

      {/* Description + requirements */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {course.description && (
            <Panel title="Overview">
              <p className="text-sm leading-relaxed text-slate-600">{course.description}</p>
            </Panel>
          )}
          {course.entryRequirements && (
            <Panel title="Entry Requirements">
              <p className="text-sm leading-relaxed text-slate-600">{course.entryRequirements}</p>
            </Panel>
          )}
          {course.websiteUrl && (
            <Panel title="Course Page">
              <a
                href={course.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
              >
                <Globe className="h-4 w-4" /> {course.websiteUrl}
              </a>
            </Panel>
          )}
        </div>

        <div className="space-y-5">
          <Panel title="Fees & Commission">
            <dl className="space-y-3">
              {fees.map((f) => (
                <div key={f.label} className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-slate-500">{f.label}</dt>
                  <dd className="text-right font-semibold text-slate-800">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="Test Scores">
            {scores.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {scores.map((s) => (
                  <span
                    key={s.label}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {s.label}: <span className="text-brand-600">{s.value}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No English/test score requirements listed.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-3 text-base font-bold text-slate-900">{title}</h2>
      {children}
    </div>
  )
}
