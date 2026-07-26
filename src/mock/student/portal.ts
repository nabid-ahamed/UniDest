// Student-portal home data. Kept separate from the admin mocks so the two UIs
// never share state accidentally. The applications / invoices / services shown
// on the portal are DERIVED live from the existing admin modules (filtered to
// the signed-in student), so the numbers always agree with those pages.
// Documented in docs/superpowers/mock-data/student.md.

import { students } from '../students'
import { applications, type Application } from '../applications'
import {
  studentInvoices,
  invoiceGrandTotal,
  invoiceStatus,
  invoiceCurrency,
  formatMoney,
  type StudentInvoice,
} from '../studentInvoices'
import { serviceRequests, type ServiceRequest } from '../services'

/**
 * The signed-in student. The demo login (student@gmail.com) maps to one real
 * `students` record so every portal card connects to the admin modules. Chosen
 * because this student has an application, an invoice and a service request.
 */
const PORTAL_STUDENT_NO = 'STU-2026-1893'

export function currentStudent() {
  return students.find((s) => s.studentNo === PORTAL_STUDENT_NO) ?? students[0]
}

/* ---- Derived from existing modules (filtered to the current student) ---- */

export function myApplications(): Application[] {
  const no = currentStudent().studentNo
  return applications.filter((a) => a.studentNo === no)
}

export function myInvoices(): StudentInvoice[] {
  const no = currentStudent().studentNo
  return studentInvoices.filter((i) => i.studentNo === no)
}

export function myServices(): ServiceRequest[] {
  const me = currentStudent()
  return serviceRequests.filter((r) => r.studentEmail === me.email || r.studentName === me.name)
}

/** Grand total as a display string, e.g. "USD 1370.00". */
export function invoiceAmountLabel(inv: StudentInvoice): string {
  return formatMoney(invoiceCurrency(inv), invoiceGrandTotal(inv))
}

export { invoiceStatus }

/* ---- Portal-only mock data (no admin equivalent yet) ---- */

export type DocumentRequestStatus = 'Pending Upload' | 'Uploaded'

export interface DocumentRequest {
  id: number
  document: string
  applicationRef: string // e.g. "University Application #302122"
  requestedAt: string // "18 Jan 2026 12:39 PM"
  status: DocumentRequestStatus
}

const DOC_SEED: DocumentRequest[] = [
  { id: 1, document: 'Passport copy', applicationRef: 'University Application #302122', requestedAt: '18 Jan 2026 12:39 PM', status: 'Pending Upload' },
  { id: 2, document: 'IELTS certificate', applicationRef: 'University Application #302122', requestedAt: '16 Jan 2026 10:05 AM', status: 'Pending Upload' },
  { id: 3, document: 'Bachelor transcript', applicationRef: 'University Application #302122', requestedAt: '11 Jan 2026 04:20 PM', status: 'Uploaded' },
  { id: 4, document: 'Financial statement', applicationRef: 'University Application #302122', requestedAt: '05 Jan 2026 09:15 AM', status: 'Uploaded' },
]

const DOC_KEY = 'unidest-student-documents'

/**
 * Documents the office has requested against this student's applications.
 * Live, mutable list persisted to localStorage so an upload on the Documents
 * tab is reflected on the Home dashboard card (both read this array).
 */
export const documentRequests: DocumentRequest[] = (() => {
  try {
    const raw = localStorage.getItem(DOC_KEY)
    if (!raw) return DOC_SEED
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : DOC_SEED
  } catch {
    return DOC_SEED
  }
})()

function persistDocuments() {
  try {
    localStorage.setItem(DOC_KEY, JSON.stringify(documentRequests))
  } catch {
    // Storage blocked — the upload stays in-memory for this session.
  }
}

/** Mark a requested document as uploaded. Returns true when a change was made. */
export function markDocumentUploaded(id: number): boolean {
  const doc = documentRequests.find((d) => d.id === id)
  if (!doc || doc.status === 'Uploaded') return false
  doc.status = 'Uploaded'
  persistDocuments()
  return true
}

/* ---- Status → badge colour maps (hex, rendered as solid pills) ---- */

const DOC_COLORS: Record<DocumentRequestStatus, string> = {
  'Pending Upload': '#c2410c', // orange-700
  Uploaded: '#15803d', // green-700
}
export const documentStatusColor = (s: DocumentRequestStatus) => DOC_COLORS[s]

const SERVICE_COLORS: Record<string, string> = {
  'New File': '#1d4ed8',
  Processing: '#a16207',
  'Decision - Completed': '#15803d',
  'Decision - Rejected': '#b91c1c',
}
/** Service status → badge colour (blank status = no badge, like the admin list). */
export const serviceStatusColor = (s: string) => SERVICE_COLORS[s] ?? '#475569'

export const invoiceStatusColor = (s: 'Due' | 'Paid') => (s === 'Paid' ? '#15803d' : '#b91c1c')
