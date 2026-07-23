import { useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Users, User, CalendarClock } from 'lucide-react'
import { cn } from '../../lib/cn'
import { getAnnouncement, audienceCount, formatDateTime } from '../../mock/announcements'
import { AREA_BADGE } from './AnnouncementsPage'

export default function AnnouncementViewPage() {
  const { id } = useParams()
  const item = getAnnouncement(Number(id))

  if (!item) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Announcement not found.</p>
        <a href="/announcements" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Announcements
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span className={cn('inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold', AREA_BADGE[item.area])}>
            {item.area}
            <span className="inline-flex items-center gap-0.5 opacity-70">
              <Users className="h-3 w-3" /> {audienceCount(item.area)}
            </span>
          </span>
          <h1 className="mt-2 text-xl font-bold text-slate-900 [overflow-wrap:anywhere]">{item.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-4 w-4 text-slate-400" /> {item.createdBy}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4 text-slate-400" /> {formatDateTime(item.publishedAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/announcements/${item.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Pencil className="h-4 w-4" /> Edit
          </a>
          <a
            href="/announcements"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </a>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-6">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{item.message}</p>
      </div>
    </div>
  )
}
