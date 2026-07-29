import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, Trash2, User, ZoomIn, ZoomOut, Move, X } from 'lucide-react'
import { cn } from '../lib/cn'

const OUTPUT_SIZE = 256 // final square avatar, px
const FRAME = 260 // on-screen editor frame, px

interface Loaded {
  src: string // original picked image (data URL)
  natW: number
  natH: number
}

/** Read a File to a data URL and its natural dimensions. */
function loadImage(file: File): Promise<Loaded> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not a valid image.'))
      img.onload = () => resolve({ src: reader.result as string, natW: img.naturalWidth, natH: img.naturalHeight })
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Drag-to-reposition + zoom cropper. The image is shown inside a circular frame;
 * the user moves it and zooms so the crop lands where they want. `baseScale` is
 * the minimum scale that still covers the frame — we never let the image shrink
 * past it, so there's never an empty gap. On Save we map the frame back to the
 * source image and render a square OUTPUT_SIZE canvas → JPEG data URL.
 */
function CropEditor({
  image,
  onCancel,
  onSave,
}: {
  image: Loaded
  onCancel: () => void
  onSave: (dataUrl: string) => void
}) {
  const { src, natW, natH } = image
  // Scale that makes the shorter side exactly fill the frame (cover).
  const baseScale = FRAME / Math.min(natW, natH)
  const [zoom, setZoom] = useState(1) // multiplier over baseScale
  const scale = baseScale * zoom
  const dispW = natW * scale
  const dispH = natH * scale

  // Offset of the image's top-left corner relative to the frame's top-left.
  const [pos, setPos] = useState({ x: (FRAME - dispW) / 2, y: (FRAME - dispH) / 2 })
  const drag = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null)

  // Keep the frame fully covered: clamp offsets so no edge shows through.
  const clamp = (x: number, y: number, w: number, h: number) => ({
    x: Math.min(0, Math.max(FRAME - w, x)),
    y: Math.min(0, Math.max(FRAME - h, y)),
  })

  // Re-clamp whenever zoom changes so the image keeps covering the frame
  // (a larger zoom can only add slack; a smaller one may expose an edge).
  useEffect(() => {
    setPos((p) => clamp(p.x, p.y, dispW, dispH))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom])

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture(e.pointerId)
    drag.current = { startX: e.clientX, startY: e.clientY, ox: pos.x, oy: pos.y }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.startX
    const dy = e.clientY - drag.current.startY
    setPos(clamp(drag.current.ox + dx, drag.current.oy + dy, dispW, dispH))
  }
  const onPointerUp = () => {
    drag.current = null
  }

  // Close the popup on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  const save = () => {
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Frame → source mapping: a frame pixel (fx,fy) maps to source
    // ((fx - pos.x)/scale, (fy - pos.y)/scale). Scale that region to OUTPUT_SIZE.
    const sx = -pos.x / scale
    const sy = -pos.y / scale
    const sSize = FRAME / scale
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
      onSave(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.src = src
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="animate-fade-in absolute inset-0 bg-slate-500/60" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reposition profile picture"
        className="animate-dialog-in relative w-full max-w-md rounded-2xl bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">Reposition Photo</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center gap-5 px-6 py-6">
          {/* Editor frame */}
          <div
            className="relative touch-none overflow-hidden rounded-full border-2 border-brand-400 bg-slate-200 shadow-inner"
            style={{ width: FRAME, height: FRAME, cursor: drag.current ? 'grabbing' : 'grab' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            role="application"
            aria-label="Drag to reposition the image"
          >
            {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
            <img
              src={src}
              alt="Reposition preview"
              draggable={false}
              className="pointer-events-none max-w-none select-none"
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: dispW,
                height: dispH,
              }}
            />
            {/* Hint pill */}
            <span className="pointer-events-none absolute bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-slate-900/60 px-2.5 py-1 text-xs font-medium text-white">
              <Move className="h-3 w-3" /> Drag to reposition
            </span>
          </div>

          {/* Zoom */}
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Zoom</label>
            <div className="flex items-center gap-2">
              <ZoomOut className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="Zoom"
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600"
              />
              <ZoomIn className="h-4 w-4 shrink-0 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Save Photo
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/**
 * Profile-picture picker with a reposition/crop step. After choosing a file the
 * user drags + zooms the image inside a circular frame, then applies the crop.
 * Value is the cropped square JPEG data URL; `onChange(null)` removes it.
 */
export function AvatarUpload({
  value,
  onChange,
  label = 'Profile Picture',
  fallback,
}: {
  value: string | null
  onChange: (dataUrl: string | null) => void
  label?: string
  /** Optional element shown when there's no image (e.g. initials). */
  fallback?: React.ReactNode
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<Loaded | null>(null)

  const pick = () => inputRef.current?.click()

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.')
    if (file.size > 8 * 1024 * 1024) return setError('Image must be under 8 MB.')
    setBusy(true)
    try {
      const loaded = await loadImage(file)
      setEditing(loaded) // open the reposition editor instead of auto-cropping
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not process the image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>

      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100',
            busy && 'opacity-60',
          )}
        >
          {value ? (
            <img src={value} alt="Profile preview" className="h-full w-full object-cover" />
          ) : (
            fallback ?? <User className="h-8 w-8 text-slate-400" aria-hidden="true" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={pick}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50 disabled:opacity-60"
            >
              <Camera className="h-4 w-4" />
              {value ? 'Change' : 'Upload'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange(null)
                  setError('')
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">JPG or PNG, square works best. Max 8 MB.</p>
        </div>
      </div>

      {/* Reposition popup — opens right after a file is chosen, before saving. */}
      {editing && (
        <CropEditor
          image={editing}
          onCancel={() => setEditing(null)}
          onSave={(dataUrl) => {
            onChange(dataUrl)
            setEditing(null)
          }}
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0])
          e.target.value = '' // allow re-picking the same file
        }}
      />
      {error && <p role="alert" className="mt-1.5 text-sm text-rose-600">{error}</p>}
    </div>
  )
}
