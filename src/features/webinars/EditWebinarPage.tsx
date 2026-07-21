import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Undo,
  Redo,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { DateTimePicker, formatDateTime } from '../../components/DateTimePicker'
import { SuccessDialog } from '../../components/ui/SuccessDialog'
import { useParams } from 'react-router-dom'
import {
  webinars,
  webinarAudienceTypes,
  updateWebinar,
  parseWebinarDate,
  type Webinar,
} from '../../mock/webinars'
import { WebinarBanner } from './WebinarViewPage'

const RTE_ACTIONS = [
  { cmd: 'bold', icon: Bold, label: 'Bold' },
  { cmd: 'italic', icon: Italic, label: 'Italic' },
  { cmd: 'underline', icon: Underline, label: 'Underline' },
  { cmd: 'insertUnorderedList', icon: List, label: 'Bulleted list' },
  { cmd: 'insertOrderedList', icon: ListOrdered, label: 'Numbered list' },
  { cmd: 'undo', icon: Undo, label: 'Undo' },
  { cmd: 'redo', icon: Redo, label: 'Redo' },
]

/** "Edit Webinar / Event" page (route /webinars/:id/edit), per the reference. */
export default function EditWebinarPage() {
  const { id } = useParams()
  const webinar = webinars.find((w) => w.id === Number(id))

  if (!webinar) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-slate-500">Webinar not found.</p>
        <a
          href="/webinars"
          className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Back to Webinar &amp; Events
        </a>
      </div>
    )
  }

  return <EditForm webinar={webinar} />
}

function EditForm({ webinar }: { webinar: Webinar }) {
  const [topic, setTopic] = useState(webinar.topic)
  const [audience, setAudience] = useState<Webinar['audienceType']>(webinar.audienceType)
  const [shortDesc, setShortDesc] = useState(webinar.description ?? '')
  const [when, setWhen] = useState<Date | null>(() => parseWebinarDate(webinar.date))
  const [venue, setVenue] = useState(webinar.venue)
  const [link, setLink] = useState(webinar.webinarLink ?? '')
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ topic?: string; when?: string; venue?: string }>({})
  const [saved, setSaved] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const pickBanner = (file: File | undefined) => {
    if (!file) return
    setBannerPreview(URL.createObjectURL(file))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!topic.trim()) next.topic = 'Please enter a topic.'
    if (!when) next.when = 'Please pick a date & time.'
    if (!venue.trim()) next.venue = 'Please enter a venue.'
    setErrors(next)
    if (Object.keys(next).length || !when) return
    updateWebinar({
      ...webinar,
      topic: topic.trim(),
      audienceType: audience,
      date: formatDateTime(when),
      venue: venue.trim(),
      webinarLink: link.trim() || null,
      description: shortDesc.trim() || null,
    })
    setSaved(true)
  }

  const fieldClass = (invalid: boolean) =>
    cn(
      'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2',
      invalid
        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
        : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30',
    )

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Edit Webinar / Event</h1>
        <a
          href="/webinars"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </a>
      </div>

      {/* Basic information */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-6 py-4 text-sm font-bold uppercase tracking-wide text-slate-500">
          Basic Information
        </h2>
        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <label htmlFor="edit-topic" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Topic <span className="text-rose-600">*</span>
              </label>
              <input
                id="edit-topic"
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value)
                  setErrors((prev) => ({ ...prev, topic: undefined }))
                }}
                aria-invalid={!!errors.topic}
                className={fieldClass(!!errors.topic)}
              />
              {errors.topic && (
                <p role="alert" className="mt-1.5 text-sm text-rose-600">
                  {errors.topic}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="edit-audience" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Audience Type <span className="text-rose-600">*</span>
              </label>
              <select
                id="edit-audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value as Webinar['audienceType'])}
                className={fieldClass(false)}
              >
                {webinarAudienceTypes.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="edit-short-desc" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Short Description
            </label>
            <textarea
              id="edit-short-desc"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              rows={3}
              placeholder="Brief summary shown in listings and event cards"
              className={fieldClass(false)}
            />
          </div>
        </div>
      </section>

      {/* Schedule & venue */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-6 py-4 text-sm font-bold uppercase tracking-wide text-slate-500">
          Schedule &amp; Venue
        </h2>
        <div className="grid grid-cols-1 gap-4 px-6 py-5 lg:grid-cols-3">
          <div>
            <label htmlFor="edit-when" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Date &amp; Time <span className="text-rose-600">*</span>
            </label>
            <DateTimePicker
              id="edit-when"
              value={when}
              onChange={(next) => {
                setWhen(next)
                setErrors((prev) => ({ ...prev, when: undefined }))
              }}
              invalid={!!errors.when}
            />
            {errors.when && (
              <p role="alert" className="mt-1.5 text-sm text-rose-600">
                {errors.when}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="edit-venue" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Mode / Venue <span className="text-rose-600">*</span>
            </label>
            <input
              id="edit-venue"
              value={venue}
              onChange={(e) => {
                setVenue(e.target.value)
                setErrors((prev) => ({ ...prev, venue: undefined }))
              }}
              aria-invalid={!!errors.venue}
              className={fieldClass(!!errors.venue)}
            />
            {errors.venue && (
              <p role="alert" className="mt-1.5 text-sm text-rose-600">
                {errors.venue}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="edit-link" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Webinar Link
            </label>
            <input
              id="edit-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className={fieldClass(false)}
            />
          </div>
        </div>
      </section>

      {/* Banner image */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-6 py-4 text-sm font-bold uppercase tracking-wide text-slate-500">
          Banner Image
        </h2>
        <div className="space-y-3 px-6 py-5">
          <p className="text-sm font-semibold text-slate-700">Banner</p>
          {bannerPreview ? (
            <img
              src={bannerPreview}
              alt="New banner preview"
              className="h-36 w-full max-w-2xl rounded-lg object-cover"
            />
          ) : (
            <WebinarBanner topic={topic || 'Webinar banner'} />
          )}
          <p className="text-sm text-slate-500">Upload a new image to replace</p>
          <input
            type="file"
            accept="image/*"
            aria-label="Upload banner image"
            onChange={(e) => pickBanner(e.target.files?.[0])}
            className="block w-full max-w-md text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-600 hover:file:bg-brand-100"
          />
          <p className="text-xs text-slate-500">Recommended: 1200×630px. Max 3 MB.</p>
        </div>
      </section>

      {/* Full description */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-6 py-4 text-sm font-bold uppercase tracking-wide text-slate-500">
          Full Description
        </h2>
        <div className="px-6 py-5">
          <div className="rounded-lg border border-slate-300">
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
              {RTE_ACTIONS.map((a) => (
                <button
                  key={a.cmd}
                  type="button"
                  aria-label={a.label}
                  title={a.label}
                  // preventDefault keeps the text selection in the editor.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editorRef.current?.focus()
                    document.execCommand(a.cmd)
                  }}
                  className="rounded p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
                >
                  <a.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <div
              ref={editorRef}
              contentEditable
              role="textbox"
              aria-multiline="true"
              aria-label="Full description"
              suppressContentEditableWarning
              className="min-h-64 px-4 py-3 text-sm text-slate-800 focus:outline-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
            >
              {webinar.description ?? ''}
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Update Webinar
        </button>
        <a
          href="/webinars"
          className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancel
        </a>
      </div>

      {/* Success → back to the list */}
      {saved &&
        createPortal(
          <SuccessDialog
            open
            message="Webinar Updated Successfully"
            onOk={() => window.location.assign('/webinars')}
          />,
          document.body,
        )}
    </form>
  )
}
