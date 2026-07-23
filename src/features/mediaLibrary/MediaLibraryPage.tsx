import { useMemo, useRef, useState } from 'react'
import { Search, UploadCloud, Image as ImageIcon, Film, Play } from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  media,
  mediaCounts,
  addMedia,
  allowedMediaExtensions,
  maxMediaMb,
  maxPreviewBytes,
  mediaExtension,
  mediaTypeOf,
  formatFileSize,
  mockMediaUrl,
  type MediaItem,
  type MediaType,
} from '../../mock/mediaLibrary'
import { staff } from '../../mock/staff'

const GRADIENTS = [
  'from-blue-900 to-blue-700',
  'from-rose-900 to-rose-700',
  'from-emerald-900 to-emerald-700',
  'from-amber-700 to-amber-500',
  'from-violet-900 to-violet-700',
  'from-teal-900 to-teal-700',
]

const currentUser = staff.find((s) => s.role === 'Super Admin')?.name ?? staff[0]?.name ?? 'Admin'

type Filter = 'all' | MediaType

/** Read an image file's natural dimensions + a small preview data-URL. */
function readImageMeta(file: File): Promise<{ width: number; height: number; thumb: string | null }> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight }
      URL.revokeObjectURL(objectUrl)
      if (file.size <= maxPreviewBytes) {
        const reader = new FileReader()
        reader.onload = () => resolve({ ...dims, thumb: String(reader.result) })
        reader.onerror = () => resolve({ ...dims, thumb: null })
        reader.readAsDataURL(file)
      } else {
        resolve({ ...dims, thumb: null })
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({ width: 0, height: 0, thumb: null })
    }
    img.src = objectUrl
  })
}

function today(): string {
  const d = new Date()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export default function MediaLibraryPage() {
  const [rev, setRev] = useState(0)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [toast, setToast] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2800)
  }

  const counts = useMemo(() => mediaCounts(), [rev])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return media
      .filter((m) => filter === 'all' || m.type === filter)
      .filter((m) => !q || `${m.name} ${m.uploadedBy}`.toLowerCase().includes(q))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, rev])

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    let added = 0
    const rejected: string[] = []
    for (const file of Array.from(files)) {
      const ext = mediaExtension(file.name)
      if (!allowedMediaExtensions.includes(ext)) {
        rejected.push(`${file.name} (type)`)
        continue
      }
      if (file.size > maxMediaMb * 1024 * 1024) {
        rejected.push(`${file.name} (>${maxMediaMb}MB)`)
        continue
      }
      const type: MediaType = mediaTypeOf(file.name)
      const meta =
        type === 'image'
          ? await readImageMeta(file)
          : { width: null as number | null, height: null as number | null, thumb: null as string | null }
      addMedia({
        name: file.name,
        type,
        url: mockMediaUrl(file.name),
        thumb: meta.thumb,
        gradient: GRADIENTS[added % GRADIENTS.length],
        width: meta.width || null,
        height: meta.height || null,
        size: file.size,
        uploadedBy: currentUser,
        uploadedAt: today(),
      })
      added += 1
    }
    setRev((n) => n + 1)
    if (added && rejected.length) showToast(`${added} uploaded · ${rejected.length} skipped`)
    else if (added) showToast(`${added} file${added > 1 ? 's' : ''} uploaded`)
    else if (rejected.length) showToast(`Skipped: ${rejected[0]}${rejected.length > 1 ? ` +${rejected.length - 1}` : ''}`)
  }

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'image', label: 'Images', count: counts.image },
    { key: 'video', label: 'Videos', count: counts.video },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Media Library</h1>
        <p className="mt-1 text-sm text-slate-500">Shared images and videos for webinars, broadcasts and pages.</p>
      </div>

      {/* Upload dropzone */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors',
            dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50/60 hover:border-brand-400 hover:bg-slate-50',
          )}
        >
          <span className={cn('flex h-14 w-14 items-center justify-center rounded-full transition-colors', dragOver ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-600')}>
            <UploadCloud className="h-7 w-7" />
          </span>
          <span className="text-base font-bold text-slate-700">Drag and drop images / videos here</span>
          <span className="text-sm text-slate-500">or click to upload</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={allowedMediaExtensions.map((e) => `.${e}`).join(',')}
          onChange={(e) => { handleFiles(e.target.files); if (inputRef.current) inputRef.current.value = '' }}
          className="hidden"
        />
        <p className="mt-3 text-xs text-slate-400">
          Allowed types: {allowedMediaExtensions.map((e) => `.${e}`).join(', ')} · Maximum file size: {maxMediaMb} MB
        </p>
      </div>

      {/* Gallery */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
                  filter === f.key ? 'bg-brand-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
              >
                {f.label} <span className={cn(filter === f.key ? 'text-white/80' : 'text-slate-400')}>({f.count})</span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search media..."
              aria-label="Search media"
              className="input w-full pl-9"
            />
          </div>
        </div>

        <h2 className="mt-5 text-base font-bold text-slate-900">
          Available Media <span className="ml-1 text-sm font-semibold text-slate-400">({filtered.length})</span>
        </h2>

        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No media found.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((m) => (
              <MediaTile key={m.id} item={m} />
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[120] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

/** A clickable thumbnail — real preview for uploaded images, gradient tile otherwise. */
export function MediaTile({ item }: { item: MediaItem }) {
  return (
    <a
      href={`/media-library/${item.id}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {item.thumb ? (
          <img
            src={item.thumb}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br text-white/90 transition-transform duration-300 group-hover:scale-105', item.gradient)}>
            {item.type === 'video' ? <Film className="h-9 w-9" /> : <ImageIcon className="h-9 w-9" />}
          </div>
        )}
        {item.type === 'video' && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            <Play className="h-3 w-3" /> Video
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="truncate text-sm font-semibold text-slate-800" title={item.name}>{item.name}</p>
        <p className="mt-0.5 text-xs text-slate-400">{formatFileSize(item.size)}</p>
      </div>
    </a>
  )
}
