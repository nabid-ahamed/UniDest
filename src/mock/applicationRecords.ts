// Per-application document + invoice records, keyed by application id. These
// are records the office attaches to an application from its detail page.
// Persisted to localStorage (prototype); replaced by an API in Phase 2.

export interface AppDocument {
  id: number
  name: string
  type: string
  uploaded: string // display date, e.g. "28 Jul 2026"
  status: string // e.g. "Uploaded" / "Pending Review"
}

export interface AppInvoice {
  id: number
  date: string // "28 Jul 2026"
  number: string // "INV-142347-1"
  amount: string // "USD 500.00"
}

export const appDocStatuses = ['Uploaded', 'Pending Review', 'Verified', 'Rejected'] as const
export const appDocTypes = ['Offer Letter', 'Passport', 'Transcript', 'Financial', 'Other'] as const

const DOC_KEY = 'unidest-application-documents'
const INV_KEY = 'unidest-application-invoices'

function loadMap<T>(key: string): Record<number, T[]> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}')
  } catch {
    return {}
  }
}

function persistMap<T>(key: string, map: Record<number, T[]>) {
  try {
    localStorage.setItem(key, JSON.stringify(map))
  } catch {
    // Storage blocked — changes stay in-memory for this session.
  }
}

const nextId = <T extends { id: number }>(rows: T[]) =>
  rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1

/* ---- Documents ---- */

export function loadAppDocuments(appId: number): AppDocument[] {
  const all = loadMap<AppDocument>(DOC_KEY)
  return Array.isArray(all[appId]) ? all[appId] : []
}

export function addAppDocument(appId: number, doc: Omit<AppDocument, 'id'>): AppDocument[] {
  const all = loadMap<AppDocument>(DOC_KEY)
  const rows = Array.isArray(all[appId]) ? all[appId] : []
  const next = [{ id: nextId(rows), ...doc }, ...rows]
  all[appId] = next
  persistMap(DOC_KEY, all)
  return next
}

export function deleteAppDocument(appId: number, id: number): AppDocument[] {
  const all = loadMap<AppDocument>(DOC_KEY)
  const next = (all[appId] ?? []).filter((d) => d.id !== id)
  all[appId] = next
  persistMap(DOC_KEY, all)
  return next
}

/* ---- Invoices ---- */

export function loadAppInvoices(appId: number): AppInvoice[] {
  const all = loadMap<AppInvoice>(INV_KEY)
  return Array.isArray(all[appId]) ? all[appId] : []
}

export function addAppInvoice(appId: number, inv: Omit<AppInvoice, 'id'>): AppInvoice[] {
  const all = loadMap<AppInvoice>(INV_KEY)
  const rows = Array.isArray(all[appId]) ? all[appId] : []
  const next = [{ id: nextId(rows), ...inv }, ...rows]
  all[appId] = next
  persistMap(INV_KEY, all)
  return next
}

export function deleteAppInvoice(appId: number, id: number): AppInvoice[] {
  const all = loadMap<AppInvoice>(INV_KEY)
  const next = (all[appId] ?? []).filter((i) => i.id !== id)
  all[appId] = next
  persistMap(INV_KEY, all)
  return next
}
