// Backups module, modeled on the EduCtrl demo (/admin/backups). The reference is
// a server-ops page (download a DB dump, shell/cron guidance). In a frontend
// build the app's real state lives in the mock modules (seeded, then persisted to
// `unidest-*` localStorage keys on change) — so here "backup" means a live
// snapshot of that data, downloadable as JSON and restorable later.
//
// Connected to existing modules: the source registry reads each module's LIVE
// exported array, so counts are always accurate (seed or edited) and the backup
// captures real data — including anything the Import tool has added. Any extra
// `unidest-*` key found in localStorage but not in the registry is still swept in,
// so the snapshot stays complete. Docs: docs/superpowers/mock-data/adminpage.md.

import { leads } from './leads'
import { students } from './students'
import { staff } from './staff'
import { users } from './userManagement'
import { courses, universities, courseCategories } from './courseManagement'
import { studentResources, resourceCategories } from './studentResources'
import { media } from './mediaLibrary'
import { announcements } from './announcements'
import { webinars } from './webinars'
import { serviceRequests } from './services'
import { universityInvoices } from './invoices'
import { studentInvoices } from './studentInvoices'
import {
  homeSettings,
  cmsCountries,
  blogPosts,
  cmsPages,
  menuItems,
  newsletterSubscribers,
} from './cms'
import { messageTemplates, cannedResponses } from './messageTemplates'

export const BACKUP_PREFIX = 'unidest-'
export const BACKUP_SIGNATURE = 'globaled-backup'
export const BACKUP_VERSION = 1
const LAST_BACKUP_KEY = 'unidest-last-backup'

export type SourceKind = 'data' | 'settings'

interface RegistryEntry {
  storageKey: string
  label: string
  route?: string
  kind: SourceKind
  get: () => unknown
}

// Curated sources — each reads a module's live data so counts never drift.
const REGISTRY: RegistryEntry[] = [
  { storageKey: 'unidest-leads', label: 'Leads', route: '/leads', kind: 'data', get: () => leads },
  { storageKey: 'unidest-students', label: 'Students', route: '/students', kind: 'data', get: () => students },
  { storageKey: 'unidest-staff', label: 'Staff', route: '/staff', kind: 'data', get: () => staff },
  { storageKey: 'unidest-users', label: 'User Management', route: '/user-management', kind: 'data', get: () => users },
  { storageKey: 'unidest-courses', label: 'Courses', route: '/courses', kind: 'data', get: () => courses },
  { storageKey: 'unidest-universities', label: 'Universities', route: '/universities', kind: 'data', get: () => universities },
  { storageKey: 'unidest-course-categories', label: 'Course Categories', route: '/course-categories', kind: 'data', get: () => courseCategories },
  { storageKey: 'unidest-student-resources', label: 'Student Resources', route: '/student-resources', kind: 'data', get: () => studentResources },
  { storageKey: 'unidest-resource-categories', label: 'Resource Categories', route: '/student-resources/categories', kind: 'data', get: () => resourceCategories },
  { storageKey: 'unidest-media-library', label: 'Media Library', route: '/media-library', kind: 'data', get: () => media },
  { storageKey: 'unidest-announcements', label: 'Announcements', route: '/announcements', kind: 'data', get: () => announcements },
  { storageKey: 'unidest-webinars', label: 'Webinars', route: '/webinars', kind: 'data', get: () => webinars },
  { storageKey: 'unidest-services', label: 'Additional Services', route: '/services', kind: 'data', get: () => serviceRequests },
  { storageKey: 'unidest-uni-invoices', label: 'University Invoices', route: '/invoices/university', kind: 'data', get: () => universityInvoices },
  { storageKey: 'unidest-student-invoices', label: 'Student Invoices', route: '/invoices/student', kind: 'data', get: () => studentInvoices },
  { storageKey: 'unidest-cms-countries', label: 'CMS · Countries', route: '/cms/countries', kind: 'data', get: () => cmsCountries },
  { storageKey: 'unidest-cms-blog', label: 'CMS · Blog Posts', route: '/cms/blog', kind: 'data', get: () => blogPosts },
  { storageKey: 'unidest-cms-pages', label: 'CMS · Pages', route: '/cms/pages', kind: 'data', get: () => cmsPages },
  { storageKey: 'unidest-cms-menu', label: 'CMS · Menu', route: '/cms/menu', kind: 'data', get: () => menuItems },
  { storageKey: 'unidest-cms-newsletter', label: 'CMS · Newsletter', route: '/cms/newsletter', kind: 'data', get: () => newsletterSubscribers },
  { storageKey: 'unidest-cms-home', label: 'CMS · Home Settings', route: '/cms/home-page', kind: 'settings', get: () => homeSettings },
  { storageKey: 'unidest-message-templates', label: 'Message Templates', route: '/message-templates/email', kind: 'data', get: () => messageTemplates },
  { storageKey: 'unidest-canned-responses', label: 'Canned Responses', route: '/message-templates/canned', kind: 'data', get: () => cannedResponses },
]

const REGISTERED = new Set(REGISTRY.map((r) => r.storageKey))

// Labels for extra localStorage-only keys (not curated above).
const EXTRA_LABELS: Record<string, string> = {
  'unidest-broadcasts': 'Broadcast History',
  'unidest-campaigns': 'Automation · Campaigns',
  'unidest-workflows': 'Automation · Workflows',
  'unidest-referral-signups': 'Referral Signups',
  'unidest-cf-suggestions': 'Course Finder Suggestions',
  'unidest-lead-notes': 'Lead Notes',
  'unidest-lead-programs': 'Lead Programs',
  'unidest-lead-suggestions': 'Lead Suggestions',
  'unidest-student-status': 'Student Status Overrides',
  'unidest-attendance': 'Check-in / Attendance',
  'unidest-ui': 'UI Preferences',
}
const SETTINGS_KEYS = new Set(['unidest-attendance', 'unidest-ui'])
const EXCLUDED = new Set([LAST_BACKUP_KEY, 'unidest-auth'])

export interface BackupSource {
  storageKey: string
  label: string
  route?: string
  kind: SourceKind
  count: number | null
  bytes: number
}

function safeParse(raw: string | null): unknown {
  if (raw == null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

const labelFromKey = (key: string) =>
  key
    .replace(BACKUP_PREFIX, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

function sizeOf(value: unknown): number {
  try {
    return new Blob([JSON.stringify(value ?? null)]).size
  } catch {
    return 0
  }
}

/** The value a key contributes to a backup: live module data, else stored JSON. */
export function sourceValue(storageKey: string): unknown {
  const reg = REGISTRY.find((r) => r.storageKey === storageKey)
  if (reg) return reg.get()
  return safeParse(localStorage.getItem(storageKey))
}

/** All backup-able sources: curated modules first, then any extra stored keys. */
export function listSources(): BackupSource[] {
  const out: BackupSource[] = REGISTRY.map((r) => {
    const val = r.get()
    return {
      storageKey: r.storageKey,
      label: r.label,
      route: r.route,
      kind: r.kind,
      count: Array.isArray(val) ? val.length : null,
      bytes: sizeOf(val),
    }
  })
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith(BACKUP_PREFIX) || EXCLUDED.has(key) || REGISTERED.has(key)) continue
    const val = safeParse(localStorage.getItem(key))
    out.push({
      storageKey: key,
      label: EXTRA_LABELS[key] ?? labelFromKey(key),
      kind: SETTINGS_KEYS.has(key) ? 'settings' : 'data',
      count: Array.isArray(val) ? val.length : null,
      bytes: sizeOf(val),
    })
  }
  return out.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'data' ? -1 : 1
    return a.label.localeCompare(b.label)
  })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export interface BackupManifest {
  signature: string
  version: number
  app: string
  generatedAt: string
  keys: Record<string, unknown>
}

/** Build a snapshot from all sources (or a chosen subset of storage keys). */
export function buildBackup(selectedKeys?: string[]): BackupManifest {
  const keys = selectedKeys ?? listSources().map((s) => s.storageKey)
  const data: Record<string, unknown> = {}
  keys.forEach((k) => {
    data[k] = sourceValue(k)
  })
  return {
    signature: BACKUP_SIGNATURE,
    version: BACKUP_VERSION,
    app: 'GlobalEd',
    generatedAt: new Date().toISOString(),
    keys: data,
  }
}

export function backupFileName(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `globaled-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`
}

/** Serialize + trigger a browser download; records the backup time. */
export function downloadBackup(manifest: BackupManifest) {
  const json = JSON.stringify(manifest, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = backupFileName(new Date(manifest.generatedAt))
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  setLastBackup(manifest.generatedAt)
}

/** Parse + validate an uploaded backup file. Throws on a bad file. */
export function parseBackup(text: string): BackupManifest {
  const obj = JSON.parse(text)
  if (!obj || obj.signature !== BACKUP_SIGNATURE || typeof obj.keys !== 'object') {
    throw new Error('Not a valid GlobalEd backup file.')
  }
  return obj as BackupManifest
}

export type RestoreMode = 'replace' | 'merge'

/**
 * Write a manifest's keys into localStorage; a reload rehydrates each module
 * from its key. (Modules that don't persist, e.g. Students, keep session data.)
 *  - replace: overwrite each key present in the file.
 *  - merge: array keys are concatenated onto existing data.
 * Returns the number of keys restored.
 */
export function restoreBackup(manifest: BackupManifest, mode: RestoreMode = 'replace'): number {
  const entries = Object.entries(manifest.keys)
  entries.forEach(([key, value]) => {
    if (mode === 'merge') {
      const existing = safeParse(localStorage.getItem(key))
      if (Array.isArray(existing) && Array.isArray(value)) {
        localStorage.setItem(key, JSON.stringify([...existing, ...value]))
        return
      }
    }
    localStorage.setItem(key, JSON.stringify(value))
  })
  return entries.length
}

/** Summarize a manifest for a restore preview (counts per key). */
export function summarizeManifest(manifest: BackupManifest): { key: string; label: string; count: number | null }[] {
  return Object.entries(manifest.keys)
    .map(([key, value]) => ({
      key,
      label: REGISTRY.find((r) => r.storageKey === key)?.label ?? EXTRA_LABELS[key] ?? labelFromKey(key),
      count: Array.isArray(value) ? value.length : null,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function getLastBackup(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY)
  } catch {
    return null
  }
}

function setLastBackup(iso: string) {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, iso)
  } catch {
    // ignore
  }
}

/** "12 Jul 2026, 03:41 PM" */
export function formatDateTime(iso: string | null): string {
  if (!iso) return 'Never'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Never'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const pad = (n: number) => String(n).padStart(2, '0')
  const h = d.getHours()
  const h12 = h % 12 || 12
  return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}, ${pad(h12)}:${pad(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`
}
