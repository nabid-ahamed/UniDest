// Mock data for the Announcements module, modeled on the EduCtrl demo
// /admin/announcements (list + create/edit form).
//
// Connected to existing modules: the "Area" is the audience segment, and its
// live recipient count comes straight from the Students / Leads / Staff mocks;
// each announcement records who created it (`staff`). Persists to localStorage
// like the other modules. Docs: docs/superpowers/mock-data/adminpage.md.

import { staff } from './staff'
import { students } from './students'
import { leads } from './leads'

export const announcementAreas = ['All', 'Students', 'Leads', 'Staff'] as const
export type AnnouncementArea = (typeof announcementAreas)[number]

/** Live audience size for an area — pulled from the existing modules. */
export function audienceCount(area: AnnouncementArea): number {
  switch (area) {
    case 'Students':
      return students.length
    case 'Leads':
      return leads.length
    case 'Staff':
      return staff.length
    case 'All':
      return students.length + leads.length + staff.length
  }
}

export interface Announcement {
  id: number
  title: string
  area: AnnouncementArea
  message: string
  createdBy: string // staff name
  publishedAt: string // ISO datetime, e.g. "2025-10-30T10:00"
}

/** Format an ISO datetime like the demo: "30 Oct 2025 10:00 AM". */
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso || '—'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const pad = (n: number) => String(n).padStart(2, '0')
  const h = d.getHours()
  const h12 = h % 12 || 12
  return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()} ${h12}:${pad(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`
}

/** ISO string for a `datetime-local` input value (drops seconds/timezone). */
export function toInputValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const KEY = 'unidest-announcements'
const author = (i: number) => staff[i % staff.length]?.name ?? 'Admin Admin'

const seedAnnouncements: Announcement[] = [
  {
    id: 1,
    title: 'Application deadline extended for Fall 2026 intake',
    area: 'Students',
    message:
      'Good news! The application deadline for the Fall 2026 intake has been extended by two weeks. Please make sure all documents are submitted before the new date to avoid delays.',
    createdBy: author(4),
    publishedAt: '2026-07-20T10:00',
  },
  {
    id: 2,
    title: 'Singapore Education Lounge — meet our partner universities',
    area: 'All',
    message:
      'Join us at the Singapore Education Lounge this month to meet representatives from our partner universities and learn about scholarship opportunities.',
    createdBy: author(0),
    publishedAt: '2026-07-15T12:36',
  },
  {
    id: 3,
    title: 'New commission structure for partner agents',
    area: 'Leads',
    message:
      'We have updated the commission structure effective next month. Please review the new rates in the partner portal and reach out to your account manager with any questions.',
    createdBy: author(1),
    publishedAt: '2026-07-08T17:37',
  },
  {
    id: 4,
    title: 'Office closed for public holiday',
    area: 'Staff',
    message: 'All branches will remain closed on the upcoming public holiday. Normal operations resume the next working day.',
    createdBy: author(0),
    publishedAt: '2026-07-02T09:00',
  },
]

export const announcements: Announcement[] = (() => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seedAnnouncements
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : seedAnnouncements
  } catch {
    return seedAnnouncements
  }
})()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(announcements))
  } catch {
    // Storage blocked — changes stay in-memory for this session.
  }
}

const nextId = () => Math.max(0, ...announcements.map((a) => a.id)) + 1

export const getAnnouncement = (id: number) => announcements.find((a) => a.id === id)

/** Newest first, by published date. */
export const sortedAnnouncements = () =>
  [...announcements].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

export function addAnnouncement(data: Omit<Announcement, 'id'>): Announcement {
  const item: Announcement = { ...data, id: nextId() }
  announcements.unshift(item)
  persist()
  return item
}

export function updateAnnouncement(id: number, patch: Partial<Omit<Announcement, 'id'>>) {
  const item = announcements.find((a) => a.id === id)
  if (!item) return
  Object.assign(item, patch)
  persist()
}

export function deleteAnnouncement(id: number) {
  const i = announcements.findIndex((a) => a.id === id)
  if (i >= 0) announcements.splice(i, 1)
  persist()
}
