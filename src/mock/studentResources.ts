// Mock data for the Student Resources module (document library shared with
// students), modeled on the EduCtrl demo /admin/upload + /admin/show/category.
//
// Connected to existing modules: each resource records who uploaded it
// (`staff`) and can optionally link to a course (`courseManagement`), and every
// category reports its live resource count. Persists to localStorage like the
// other modules. Docs: docs/superpowers/mock-data/adminpage.md.
// Files aren't really stored in a frontend build — an upload captures the file's
// name/size/type and mints a mock storage URL (Phase 2 swaps in real storage).

import { staff } from './staff'
import { courses } from './courseManagement'

/* ------------------------------------------------------------------ */
/* File helpers                                                        */
/* ------------------------------------------------------------------ */

export const allowedExtensions = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'zip', 'mp4']
export const maxFileMb = 49

export type ResourceFileType = 'pdf' | 'doc' | 'image' | 'video' | 'zip' | 'other'

export function fileExtension(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/)
  return m ? m[1] : ''
}

export function fileTypeOf(name: string): ResourceFileType {
  const ext = fileExtension(name)
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx', 'txt'].includes(ext)) return 'doc'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image'
  if (['mp4', 'mov', 'avi'].includes(ext)) return 'video'
  if (['zip', 'rar', '7z'].includes(ext)) return 'zip'
  return 'other'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Slug + short random suffix, mirroring the demo's storage URL shape. */
export function mockFileUrl(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  const base = (dot > 0 ? fileName.slice(0, dot) : fileName).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')
  const ext = dot > 0 ? fileName.slice(dot + 1) : 'pdf'
  const rand = Math.random().toString(36).slice(2, 12)
  return `https://globaled.app/storage/uploads/${base}-${rand}.${ext}`
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface ResourceCategory {
  id: number
  name: string
  description: string
}

export interface StudentResource {
  id: number
  title: string
  categoryId: number
  fileName: string
  fileType: ResourceFileType
  fileSize: number // bytes
  fileUrl: string
  /** Optional link to a Course Management course. */
  relatedCourseId: number | null
  uploadedBy: string // staff name
  uploadedAt: string // e.g. "23 Jul 2026"
}

/* ------------------------------------------------------------------ */
/* Seeds                                                               */
/* ------------------------------------------------------------------ */

const CATEGORIES_KEY = 'unidest-resource-categories'
const RESOURCES_KEY = 'unidest-student-resources'

const seedCategories: ResourceCategory[] = [
  { id: 1, name: 'IELTS Resources', description: 'IELTS preparation and practice material.' },
  { id: 2, name: 'English course - Basic', description: 'Beginner English study material.' },
  { id: 3, name: 'English course - Intermediate', description: 'Intermediate English study material.' },
  { id: 4, name: 'Visa & Immigration', description: 'Visa checklists and immigration guides.' },
  { id: 5, name: 'Scholarship Guides', description: 'Scholarship application guides and forms.' },
  { id: 6, name: 'University Prospectus', description: 'University brochures and course prospectuses.' },
  { id: 7, name: 'Pre-Departure', description: 'Pre-departure briefings and checklists.' },
]

// Names of the first few staff so "Uploaded By" agrees with the Staff module.
const uploader = (i: number) => staff[i % staff.length]?.name ?? 'Admin Admin'

const seedResources: StudentResource[] = [
  { id: 1, title: 'IELTS Academic Practice Test Pack', categoryId: 1, fileName: 'IELTS-Academic-Practice.pdf', fileType: 'pdf', fileSize: 3_540_000, fileUrl: 'https://globaled.app/storage/uploads/IELTS-Academic-Practice-a91kd0.pdf', relatedCourseId: null, uploadedBy: uploader(0), uploadedAt: '02 Jul 2026' },
  { id: 2, title: 'IELTS Speaking Cue Cards', categoryId: 1, fileName: 'IELTS-Speaking-Cue-Cards.pdf', fileType: 'pdf', fileSize: 890_000, fileUrl: 'https://globaled.app/storage/uploads/IELTS-Speaking-Cue-Cards-77az1p.pdf', relatedCourseId: null, uploadedBy: uploader(1), uploadedAt: '05 Jul 2026' },
  { id: 3, title: 'Essential English Grammar', categoryId: 2, fileName: 'Essential-Grammar-in-Use.pdf', fileType: 'pdf', fileSize: 12_100_000, fileUrl: 'https://globaled.app/storage/uploads/Essential-Grammar-in-Use-2m4b8x.pdf', relatedCourseId: null, uploadedBy: uploader(0), uploadedAt: '10 Jul 2026' },
  { id: 4, title: 'Intermediate English Grammar', categoryId: 3, fileName: 'English-Grammar-Intermediate.pdf', fileType: 'pdf', fileSize: 9_800_000, fileUrl: 'https://globaled.app/storage/uploads/English-Grammar-Intermediate-p0zq3r.pdf', relatedCourseId: null, uploadedBy: uploader(2), uploadedAt: '11 Jul 2026' },
  { id: 5, title: 'UK Student Visa Checklist', categoryId: 4, fileName: 'UK-Student-Visa-Checklist.docx', fileType: 'doc', fileSize: 220_000, fileUrl: 'https://globaled.app/storage/uploads/UK-Student-Visa-Checklist-la92kd.docx', relatedCourseId: null, uploadedBy: uploader(1), uploadedAt: '14 Jul 2026' },
  { id: 6, title: 'Chevening Scholarship Guide', categoryId: 5, fileName: 'Chevening-Guide.pdf', fileType: 'pdf', fileSize: 1_650_000, fileUrl: 'https://globaled.app/storage/uploads/Chevening-Guide-99xk1a.pdf', relatedCourseId: null, uploadedBy: uploader(0), uploadedAt: '16 Jul 2026' },
  { id: 7, title: 'Computer Science Prospectus', categoryId: 6, fileName: 'BSc-CS-Prospectus.pdf', fileType: 'pdf', fileSize: 4_200_000, fileUrl: 'https://globaled.app/storage/uploads/BSc-CS-Prospectus-3kd0az.pdf', relatedCourseId: 34, uploadedBy: uploader(3), uploadedAt: '18 Jul 2026' },
  { id: 8, title: 'Pre-Departure Briefing Slides', categoryId: 7, fileName: 'Pre-Departure-Briefing.mp4', fileType: 'video', fileSize: 41_500_000, fileUrl: 'https://globaled.app/storage/uploads/Pre-Departure-Briefing-8xz0kd.mp4', relatedCourseId: null, uploadedBy: uploader(0), uploadedAt: '20 Jul 2026' },
  { id: 9, title: 'Accommodation Guide (Images)', categoryId: 7, fileName: 'Accommodation-Guide.zip', fileType: 'zip', fileSize: 18_300_000, fileUrl: 'https://globaled.app/storage/uploads/Accommodation-Guide-2ka9dz.zip', relatedCourseId: null, uploadedBy: uploader(1), uploadedAt: '21 Jul 2026' },
]

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

function load<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return seed
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : seed
  } catch {
    return seed
  }
}
function save<T>(key: string, value: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage blocked — changes stay in-memory for this session.
  }
}

export const resourceCategories: ResourceCategory[] = load(CATEGORIES_KEY, seedCategories)
export const studentResources: StudentResource[] = load(RESOURCES_KEY, seedResources)

const nextId = <T extends { id: number }>(list: T[]) => Math.max(0, ...list.map((x) => x.id)) + 1

/* ------------------------- Categories CRUD ------------------------ */

export const getResourceCategory = (id: number) => resourceCategories.find((c) => c.id === id)
export const categoryName = (id: number) => getResourceCategory(id)?.name ?? '—'

export function addResourceCategory(data: Omit<ResourceCategory, 'id'>): ResourceCategory {
  const cat: ResourceCategory = { ...data, id: nextId(resourceCategories) }
  resourceCategories.push(cat)
  save(CATEGORIES_KEY, resourceCategories)
  return cat
}

export function updateResourceCategory(id: number, patch: Partial<Omit<ResourceCategory, 'id'>>) {
  const cat = resourceCategories.find((c) => c.id === id)
  if (!cat) return
  Object.assign(cat, patch)
  save(CATEGORIES_KEY, resourceCategories)
}

/** Blocks deletion while resources still use the category (returns false). */
export function deleteResourceCategory(id: number): boolean {
  if (resourceCountForCategory(id) > 0) return false
  const i = resourceCategories.findIndex((c) => c.id === id)
  if (i >= 0) resourceCategories.splice(i, 1)
  save(CATEGORIES_KEY, resourceCategories)
  return true
}

/* ------------------------- Resources CRUD ------------------------- */

export const getResource = (id: number) => studentResources.find((r) => r.id === id)

export function addResource(data: Omit<StudentResource, 'id'>): StudentResource {
  const res: StudentResource = { ...data, id: nextId(studentResources) }
  studentResources.unshift(res)
  save(RESOURCES_KEY, studentResources)
  return res
}

export function deleteResource(id: number) {
  const i = studentResources.findIndex((r) => r.id === id)
  if (i >= 0) studentResources.splice(i, 1)
  save(RESOURCES_KEY, studentResources)
}

/* ------------------------------------------------------------------ */
/* Live connections                                                    */
/* ------------------------------------------------------------------ */

export const resourcesForCategory = (id: number) => studentResources.filter((r) => r.categoryId === id)
export const resourceCountForCategory = (id: number) => resourcesForCategory(id).length

/** Related course title (from Course Management), for display + linking. */
export function relatedCourse(id: number | null) {
  return id == null ? undefined : courses.find((c) => c.id === id)
}
