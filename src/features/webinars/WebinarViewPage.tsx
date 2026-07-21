import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Undo2 } from 'lucide-react'
import { webinars, webinarShareLink } from '../../mock/webinars'

/** "View Webinar" detail page (route /webinars/:id), matching the reference. */
export default function WebinarViewPage() {
  const { id } = useParams()
  const webinar = webinars.find((w) => w.id === Number(id))
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2500)
  }

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

  const link = webinarShareLink(webinar)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // Clipboard API can reject (unfocused document, older browsers) —
      // fall back to the hidden-textarea trick.
      const el = document.createElement('textarea')
      el.value = link
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      el.remove()
    }
    showToast('Webinar link copied')
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-5 sm:px-6">
        <h1 className="text-xl font-bold text-slate-900">Webinar Details</h1>
        <a
          href="/webinars"
          aria-label="Back to Webinar & Events"
          title="Back"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700"
        >
          <Undo2 className="h-4 w-4" />
        </a>
      </div>

      <dl className="space-y-5 px-4 pb-8 sm:px-6">
        <Row label="Topic">
          <span className="font-medium text-slate-800">{webinar.topic}</span>
        </Row>

        <Row label="Image">
          <WebinarBanner topic={webinar.topic} />
        </Row>

        <Row label="Date">
          <span className="tabular-nums text-slate-700">{webinar.date}</span>
        </Row>

        <Row label="Venue">
          <span className="text-slate-700">{webinar.venue}</span>
        </Row>

        <Row label="Copy Webinar Link">
          <div className="flex w-full max-w-2xl items-center gap-2">
            <input
              value={link}
              readOnly
              aria-label="Webinar link"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none"
            />
            <button
              onClick={copyLink}
              className="shrink-0 rounded-lg border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
            >
              Copy
            </button>
          </div>
        </Row>

        <Row label="Audience Type">
          <span className="text-slate-700">{webinar.audienceType}</span>
        </Row>

        <Row label="Webinar Link">
          {webinar.webinarLink ? (
            <a
              href={webinar.webinarLink}
              target="_blank"
              rel="noreferrer"
              className="break-all text-brand-600 hover:underline"
            >
              {webinar.webinarLink}
            </a>
          ) : (
            <span className="text-slate-400">--</span>
          )}
        </Row>

        <Row label="Description">
          {webinar.description ? (
            <p className="max-w-2xl text-slate-700">{webinar.description}</p>
          ) : (
            <span className="text-slate-400">--</span>
          )}
        </Row>

        <Row label="Notified Email">
          {webinar.notifiedEmail ? (
            <span className="text-slate-700">{webinar.notifiedEmail}</span>
          ) : (
            <span className="text-slate-400">--</span>
          )}
        </Row>

        <Row label="Enrolled Users">
          <span className="tabular-nums text-slate-700">{webinar.enrolledUsers ?? '--'}</span>
        </Row>
      </dl>

      {/* Toast */}
      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[60] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[12rem_1fr] sm:gap-6">
      <dt className="text-sm font-semibold text-slate-700">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

/**
 * Mock banner: no uploaded images yet, so render a branded placeholder with
 * the topic on it (stands in for the reference's uploaded university banner).
 * Shared with the edit page.
 */
export function WebinarBanner({ topic }: { topic: string }) {
  return (
    <div className="flex h-36 w-full max-w-2xl items-center justify-center rounded-lg bg-gradient-to-r from-brand-700 to-brand-500 px-8 text-center">
      <p className="text-lg font-bold leading-snug text-white [text-wrap:balance]">{topic}</p>
    </div>
  )
}
