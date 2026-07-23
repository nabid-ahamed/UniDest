import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, Trash2, Image as ImageIcon, Film, Play, Calendar, User, HardDrive, Ruler } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { getMedia, deleteMedia, formatFileSize } from '../../mock/mediaLibrary'

export default function MediaDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const item = getMedia(Number(id))
  const [confirm, setConfirm] = useState(false)
  const [toast, setToast] = useState('')

  if (!item) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Media not found.</p>
        <a href="/media-library" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Media Library
        </a>
      </div>
    )
  }

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2400)
  }

  const meta = [
    { label: 'Type', value: item.type === 'video' ? 'Video' : 'Image', icon: item.type === 'video' ? Film : ImageIcon },
    { label: 'Dimensions', value: item.width && item.height ? `${item.width} × ${item.height} px` : '—', icon: Ruler },
    { label: 'Size', value: formatFileSize(item.size), icon: HardDrive },
    { label: 'Uploaded By', value: item.uploadedBy, icon: User },
    { label: 'Uploaded', value: item.uploadedAt, icon: Calendar },
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Media Details</h1>
        <a
          href="/media-library"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </a>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Preview */}
        <div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <div className="relative aspect-video">
              {item.thumb ? (
                <img src={item.thumb} alt={item.name} className="h-full w-full object-contain" />
              ) : (
                <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br text-white/90', item.gradient)}>
                  {item.type === 'video' ? <Film className="h-16 w-16" /> : <ImageIcon className="h-16 w-16" />}
                </div>
              )}
              {item.type === 'video' && (
                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white">
                  <Play className="h-3.5 w-3.5" /> Video
                </span>
              )}
            </div>
          </div>
          <p className="mt-3 break-words text-sm font-bold text-slate-800">{item.name}</p>
        </div>

        {/* Meta + URL + actions */}
        <div className="flex flex-col">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {meta.map((m) => (
              <div key={m.label} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <m.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs text-slate-500">{m.label}</dt>
                  <dd className="truncate text-sm font-semibold text-slate-800">{m.value}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="mt-5">
            <label htmlFor="media-url" className="mb-1.5 block text-sm font-semibold text-slate-700">URL</label>
            <div className="flex items-center gap-2">
              <input
                id="media-url"
                readOnly
                value={item.url}
                onFocus={(e) => e.target.select()}
                className="input flex-1 bg-slate-50 text-slate-500"
              />
              <button
                onClick={() => { navigator.clipboard?.writeText(item.url); showToast('Link copied') }}
                aria-label="Copy URL"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                <Copy className="h-4 w-4" /> Copy
              </button>
            </div>
          </div>

          <div className="mt-auto flex justify-end pt-6">
            <button
              onClick={() => setConfirm(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
            >
              <Trash2 className="h-4 w-4" /> Delete {item.type === 'video' ? 'Video' : 'Image'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        title="Delete media"
        message={`Delete "${item.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          deleteMedia(item.id)
          navigate('/media-library')
        }}
      />

      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[120] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
