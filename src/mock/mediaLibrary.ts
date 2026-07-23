// Mock data for the Media Library module, modeled on the EduCtrl demo
// /admin/gallery (drag-drop upload + thumbnail grid + per-item detail page).
//
// Connected to existing modules: each item records who uploaded it (`staff`).
// Persists to localStorage like the other modules. Files aren't really stored in
// a frontend build — uploaded images keep an in-browser data-URL preview; seeded
// items render as gradient tiles. Docs: docs/superpowers/mock-data/adminpage.md.

import { staff } from './staff'

/* ------------------------------------------------------------------ */
/* File helpers                                                        */
/* ------------------------------------------------------------------ */

export const allowedMediaExtensions = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'mp4', 'mov', 'wmv', 'webm']
export const maxMediaMb = 16
/** Only persist a preview for images below this size (keeps localStorage sane). */
export const maxPreviewBytes = 1_200_000

export type MediaType = 'image' | 'video'

export function mediaExtension(name: string): string {
  return name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? ''
}

export function mediaTypeOf(name: string): MediaType {
  return ['mp4', 'mov', 'wmv', 'webm', 'avi'].includes(mediaExtension(name)) ? 'video' : 'image'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function mockMediaUrl(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  const base = (dot > 0 ? fileName.slice(0, dot) : fileName).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')
  const ext = dot > 0 ? fileName.slice(dot + 1) : 'png'
  const rand = Math.random().toString(36).slice(2, 12)
  return `https://globaled.app/storage/media/${base}-${rand}.${ext}`
}

/* ------------------------------------------------------------------ */
/* Type                                                                */
/* ------------------------------------------------------------------ */

export interface MediaItem {
  id: number
  name: string
  type: MediaType
  url: string // mock storage URL
  /** Data-URL preview for uploaded images; null → render a gradient tile. */
  thumb: string | null
  /** Tailwind gradient for the fallback tile (seeds + videos). */
  gradient: string
  width: number | null
  height: number | null
  size: number // bytes
  uploadedBy: string // staff name
  uploadedAt: string // e.g. "23 Jul 2026"
}

/* ------------------------------------------------------------------ */
/* Seeds                                                               */
/* ------------------------------------------------------------------ */

const KEY = 'unidest-media-library'

const GRADIENTS = [
  'from-blue-900 to-blue-700',
  'from-rose-900 to-rose-700',
  'from-emerald-900 to-emerald-700',
  'from-amber-700 to-amber-500',
  'from-violet-900 to-violet-700',
  'from-teal-900 to-teal-700',
  'from-slate-800 to-slate-600',
  'from-sky-900 to-sky-700',
]

const uploader = (i: number) => staff[i % staff.length]?.name ?? 'Admin Admin'

const seed = (
  id: number,
  name: string,
  type: MediaType,
  width: number,
  height: number,
  size: number,
  at: string,
): MediaItem => ({
  id,
  name,
  type,
  url: mockMediaUrl(name),
  thumb: null,
  gradient: GRADIENTS[(id - 1) % GRADIENTS.length],
  width,
  height,
  size,
  uploadedBy: uploader(id - 1),
  uploadedAt: at,
})

const seedMedia: MediaItem[] = [
  seed(1, 'GlobalEd Logo.png', 'image', 512, 512, 84_000, '02 Jul 2026'),
  seed(2, 'IELTS Masterclass Banner.jpg', 'image', 1920, 1080, 640_000, '04 Jul 2026'),
  seed(3, 'Campus Tour.mp4', 'video', 1280, 720, 14_200_000, '06 Jul 2026'),
  seed(4, 'Study Abroad Fair.jpg', 'image', 1600, 900, 720_000, '09 Jul 2026'),
  seed(5, 'Scholarship Webinar Cover.png', 'image', 1280, 720, 410_000, '12 Jul 2026'),
  seed(6, 'Student Testimonial.mp4', 'video', 1080, 1920, 9_800_000, '15 Jul 2026'),
  seed(7, 'Visa Guide Infographic.png', 'image', 1080, 1350, 560_000, '18 Jul 2026'),
  seed(8, 'Pre-Departure Session.jpg', 'image', 1600, 1067, 690_000, '21 Jul 2026'),
]

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

export const media: MediaItem[] = (() => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seedMedia
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : seedMedia
  } catch {
    return seedMedia
  }
})()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(media))
  } catch {
    // Quota exceeded (large data-URL previews) or blocked — stays in-memory.
  }
}

const nextId = () => Math.max(0, ...media.map((m) => m.id)) + 1

export const getMedia = (id: number) => media.find((m) => m.id === id)

export function addMedia(data: Omit<MediaItem, 'id'>): MediaItem {
  const item: MediaItem = { ...data, id: nextId() }
  media.unshift(item)
  persist()
  return item
}

export function deleteMedia(id: number) {
  const i = media.findIndex((m) => m.id === id)
  if (i >= 0) media.splice(i, 1)
  persist()
}

/* ------------------------------------------------------------------ */
/* Derived stats                                                       */
/* ------------------------------------------------------------------ */

export const mediaCounts = () => ({
  all: media.length,
  image: media.filter((m) => m.type === 'image').length,
  video: media.filter((m) => m.type === 'video').length,
})
