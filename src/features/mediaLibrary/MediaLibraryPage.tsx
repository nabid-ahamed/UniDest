import { useMemo, useRef, useState } from 'react'
import { Search, UploadCloud, Image as ImageIcon, Film, Play } from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  allowedMediaExtensions,
  maxMediaMb,
  mediaExtension,
  type MediaType,
} from '../../mock/mediaLibrary'
import {
  useMedia,
  useUploadMedia,
  formatFileSize,
  API_BASE_URL,
  type ApiMediaItem,
} from '../../lib/api'

/** Fallback tile colours for non-image files, picked by id so they stay stable. */
const TILE_GRADIENTS = [
  'from-brand-500 to-brand-700',
  'from-emerald-500 to-emerald-700',
  'from-violet-500 to-violet-700',
  'from-amber-500 to-amber-700',
  'from-rose-500 to-rose-700',
]


type Filter = 'all' | MediaType

export default function MediaLibraryPage() {
  // React Query owns the list and re-runs it after every upload, so the `rev`
  // counter that forced a re-read of the mutable mock module is gone.
  const { data: media = [] } = useMedia()
  const uploadMedia = useUploadMedia()
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


  // Counted from the list itself rather than a second query — one source, so
  // the tabs and the grid can never disagree.
  const counts = useMemo(() => {
    const c = { all: media.length, image: 0, video: 0, document: 0 }
    for (const m of media) {
      if (m.type === 'image') c.image += 1
      else if (m.type === 'video') c.video += 1
      else c.document += 1
    }
    return c
  }, [media])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return media
      .filter((m) => filter === 'all' || m.type === filter)
      .filter((m) => !q || `${m.name} ${m.uploadedBy}`.toLowerCase().includes(q))
  }, [media, filter, search])

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
      // The server derives the type from the MIME type and stores the bytes
      // through the same StorageService the application documents use.
      await uploadMedia.mutateAsync(file)
      added += 1
    }
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
export function MediaTile({ item }: { item: ApiMediaItem }) {
  return (
    <a
      href={`/media-library/${item.id}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {item.type === 'image' ? (
          // The real file, not a stored data-URL preview: the bytes already
          // live in the media store, so a second copy would only drift.
          <img
            src={`${API_BASE_URL}${item.url}`}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br text-white/90 transition-transform duration-300 group-hover:scale-105', TILE_GRADIENTS[item.id % TILE_GRADIENTS.length])}>
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
