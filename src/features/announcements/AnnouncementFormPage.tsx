import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Field } from '../../components/DataTableUI'
import {
  announcementAreas,
  audienceCount,
  toInputValue,
  type AnnouncementArea,
} from '../../mock/announcements'
import {
  useAnnouncement,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  type ApiAnnouncement,
} from '../../lib/api'

/** Local "now" as a datetime-local default value. */
function nowInput(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Route entry: resolves the announcement being edited before the form mounts.
 *
 * The form seeds its fields from `editing` once, so it must not mount until
 * that value has arrived — and the `key` remounts it per id, so switching
 * records resets the fields instead of keeping the previous one's text.
 */
export default function AnnouncementFormPage() {
  const { id } = useParams()
  const { data: editing, isPending } = useAnnouncement(id ? Number(id) : undefined)

  if (id && isPending) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Loading announcement…</p>
      </div>
    )
  }

  return <AnnouncementForm key={id ?? 'new'} editing={editing ?? undefined} isEdit={Boolean(id)} />
}

function AnnouncementForm({ editing, isEdit }: { editing?: ApiAnnouncement; isEdit: boolean }) {
  const navigate = useNavigate()
  const createAnnouncement = useCreateAnnouncement()
  const updateAnnouncementM = useUpdateAnnouncement()

  const [area, setArea] = useState<AnnouncementArea | ''>(
    (editing?.area as AnnouncementArea) ?? '',
  )
  const [title, setTitle] = useState(editing?.title ?? '')
  const [message, setMessage] = useState(editing?.message ?? '')
  const [publishedAt, setPublishedAt] = useState(editing ? toInputValue(editing.publishedAt) : nowInput())
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (isEdit && !editing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Announcement not found.</p>
        <a href="/announcements" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Announcements
        </a>
      </div>
    )
  }

  const submit = () => {
    const next: Record<string, string> = {}
    if (!area) next.area = 'Please choose an area.'
    if (!title.trim()) next.title = 'Please enter a title.'
    if (!message.trim()) next.message = 'Please enter a message.'
    if (!publishedAt) next.publishedAt = 'Please choose a publish date.'
    setErrors(next)
    if (Object.keys(next).length) return

    const payload = {
      area: area as AnnouncementArea,
      title: title.trim(),
      message: message.trim(),
      publishedAt,
    }
    if (isEdit && editing) {
      updateAnnouncementM.mutate(
        { id: editing.id, ...payload },
        { onSuccess: () => navigate(`/announcements/${editing.id}`) },
      )
    } else {
      // The server records the author from the token, so no createdBy is sent —
      // a client-supplied name would only be a less trustworthy second copy.
      createAnnouncement.mutate(payload, {
        onSuccess: (created) => navigate(`/announcements/${created.id}`),
      })
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Announcement' : 'Create Announcement'}</h1>
        <a
          href="/announcements"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </a>
      </div>

      <div className="mt-6 max-w-3xl space-y-5">
        <Field label="Area *">
          <select
            value={area}
            onChange={(e) => { setArea(e.target.value as AnnouncementArea); setErrors((p) => ({ ...p, area: '' })) }}
            className={cn('input', errors.area && 'border-rose-500')}
          >
            <option value="">Select an option</option>
            {announcementAreas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          {area && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-500">
              <Users className="h-3.5 w-3.5" /> Reaches {audienceCount(area as AnnouncementArea)} recipient(s).
            </p>
          )}
          {errors.area && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.area}</p>}
        </Field>

        <div>
          <label htmlFor="an-title" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Title <span className="text-rose-600">*</span>
          </label>
          <input
            id="an-title"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: '' })) }}
            className={cn('input', errors.title && 'border-rose-500')}
          />
          {errors.title && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="an-message" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Message <span className="text-rose-600">*</span>
          </label>
          <textarea
            id="an-message"
            value={message}
            onChange={(e) => { setMessage(e.target.value); setErrors((p) => ({ ...p, message: '' })) }}
            rows={8}
            className={cn('input resize-y', errors.message && 'border-rose-500')}
          />
          {errors.message && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.message}</p>}
        </div>

        <div className="max-w-xs">
          <label htmlFor="an-date" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Published At <span className="text-rose-600">*</span>
          </label>
          <input
            id="an-date"
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => { setPublishedAt(e.target.value); setErrors((p) => ({ ...p, publishedAt: '' })) }}
            className={cn('input', errors.publishedAt && 'border-rose-500')}
          />
          {errors.publishedAt && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.publishedAt}</p>}
        </div>

        <div className="flex justify-center gap-3 border-t border-slate-100 pt-5">
          <button
            onClick={submit}
            className="rounded-lg bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            {isEdit ? 'Save Changes' : 'Create'}
          </button>
          <a
            href="/announcements"
            className="rounded-lg border border-slate-300 bg-white px-8 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
  )
}
