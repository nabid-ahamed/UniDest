// Notifications feed — built dynamically from the existing modules rather than
// stored on its own. Whenever a lead/student/application/announcement/webinar
// is created or updated in those modules, it surfaces here automatically.
// Read/unread state lives in the notifications store (localStorage).
// Docs: docs/superpowers/mock-data/adminpage.md.

import { leads } from './leads'
import { students } from './students'
import { applications } from './applications'
import { announcements } from './announcements'
import { webinars } from './webinars'

export type NotificationCategory =
  | 'lead'
  | 'student'
  | 'application'
  | 'announcement'
  | 'webinar'

export interface AppNotification {
  id: string // stable per source record, e.g. "lead-142"
  category: NotificationCategory
  title: string
  message: string
  time: number // epoch ms, for sorting
  link: string // route to the source record
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "19 Jul 2026" → epoch ms (leads/students `created`). */
function parseDMY(s: string): number {
  const m = s?.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/)
  if (!m) return NaN
  return new Date(Number(m[3]), MONTHS.indexOf(m[2]), Number(m[1])).getTime()
}

/** "27-04-2026" or "11-06-2026 02:31 PM" → epoch ms (applications/webinars). */
function parseDashDMY(s: string): number {
  const m = s?.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM))?/i)
  if (!m) return NaN
  let h = m[4] ? Number(m[4]) : 0
  const min = m[5] ? Number(m[5]) : 0
  if (m[6]) {
    const pm = /pm/i.test(m[6])
    if (pm && h < 12) h += 12
    if (!pm && h === 12) h = 0
  }
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), h, min).getTime()
}

/** Short absolute label like "20 Jul 2026" for older items. */
function formatShort(t: number): string {
  const d = new Date(t)
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Human "time ago" for a notification timestamp. */
export function relativeTime(t: number): string {
  if (Number.isNaN(t)) return ''
  const diff = Date.now() - t
  const min = 60_000
  const hr = 60 * min
  const day = 24 * hr
  if (diff < 0) return formatShort(t) // scheduled in the future → show the date
  if (diff < min) return 'Just now'
  if (diff < hr) return `${Math.floor(diff / min)}m ago`
  if (diff < day) return `${Math.floor(diff / hr)}h ago`
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`
  return formatShort(t)
}

/** Application statuses worth notifying about (milestones, not every row). */
const NOTABLE_APP_STATUSES = new Set([
  'Offer Letter Received',
  'Payment Received',
  'Admission Criteria Met',
  'Funds Under Assessment',
])

/**
 * Build the live feed from every connected module, newest first.
 * @param limit max notifications to return (default 30).
 */
export function buildNotifications(limit = 30): AppNotification[] {
  const items: AppNotification[] = []

  for (const l of leads) {
    items.push({
      id: `lead-${l.id}`,
      category: 'lead',
      title: 'New lead',
      message: `${l.name} · ${l.status}`,
      time: parseDMY(l.created),
      link: `/leads/${l.id}`,
    })
  }

  for (const s of students) {
    items.push({
      id: `student-${s.id}`,
      category: 'student',
      title: 'New student',
      message: `${s.name} · ${s.status}`,
      time: parseDMY(s.created),
      link: `/students/${s.id}`,
    })
  }

  for (const a of applications) {
    if (!NOTABLE_APP_STATUSES.has(a.status)) continue
    items.push({
      id: `app-${a.id}`,
      category: 'application',
      title: `Application: ${a.status}`,
      message: `${a.student} → ${a.university}`,
      time: parseDashDMY(a.dateCreated),
      link: '/applications',
    })
  }

  for (const n of announcements) {
    items.push({
      id: `ann-${n.id}`,
      category: 'announcement',
      title: 'Announcement',
      message: n.title,
      time: Date.parse(n.publishedAt),
      link: `/announcements/${n.id}`,
    })
  }

  for (const w of webinars) {
    items.push({
      id: `webinar-${w.id}`,
      category: 'webinar',
      title: 'Webinar scheduled',
      message: w.topic,
      time: parseDashDMY(w.date),
      link: `/webinars/${w.id}`,
    })
  }

  return items
    .filter((i) => !Number.isNaN(i.time))
    .sort((a, b) => b.time - a.time)
    .slice(0, limit)
}
