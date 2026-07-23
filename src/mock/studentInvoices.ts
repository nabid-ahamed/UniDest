// Mock data for the Student Invoices module (modeled on the EduCtrl demo's
// student-invoices pages). Docs: docs/superpowers/mock-data/adminpage.md.
//
// Connects to the Students module: an invoice is billed to a student, so it
// carries the studentNo and reuses that student's name / email / phone.

import { students } from './students'

/** A billing entity (branch / company) that issues the invoice. */
export interface Business {
  id: number
  name: string
  address: string
  phone: string
  email: string
  gstn: string
  currency: string
}

export const businesses: Business[] = [
  { id: 1, name: 'GlobalEd HQ', address: 'House 29, Road 1, Banani, Dhaka', phone: '+880 1700 000000', email: 'billing@globaled.com', gstn: 'GE-100234', currency: 'USD' },
  { id: 2, name: 'GlobalEd Chattogram', address: 'GEC Circle, Chattogram', phone: '+880 1811 223344', email: 'ctg@globaled.com', gstn: 'GE-100567', currency: 'USD' },
]

export interface InvoiceItem {
  description: string
  amount: number
}

export interface StudentInvoicePayment {
  amount: number
  date: string // "12 Jun 2026"
  note: string
}

export interface StudentInvoice {
  id: number // invoice number, e.g. 387499
  date: string // "06-05-2026 07:07 am"
  businessId: number
  studentNo: string
  student: string
  email: string
  phone: string
  dueDate: string // "23-07-2026"
  items: InvoiceItem[]
  discount: number
  terms: string
  payments: StudentInvoicePayment[]
}

export const studentInvoiceStatuses = ['Due', 'Paid'] as const

const money = (currency: string, amount: number) => `${currency} ${amount.toFixed(2)}`
export const formatMoney = money

export const businessById = (id: number) => businesses.find((b) => b.id === id) ?? businesses[0]

/** Derived totals so the list, view and form all agree on the numbers. */
export function invoiceSubTotal(inv: StudentInvoice): number {
  return inv.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0)
}
export function invoiceGrandTotal(inv: StudentInvoice): number {
  return Math.max(0, invoiceSubTotal(inv) - (Number(inv.discount) || 0))
}
export function invoicePaid(inv: StudentInvoice): number {
  return inv.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
}
export function invoiceDue(inv: StudentInvoice): number {
  return Math.max(0, invoiceGrandTotal(inv) - invoicePaid(inv))
}
export function invoiceStatus(inv: StudentInvoice): 'Due' | 'Paid' {
  return invoiceDue(inv) <= 0 && invoiceGrandTotal(inv) > 0 ? 'Paid' : 'Due'
}
export function invoiceCurrency(inv: StudentInvoice): string {
  return businessById(inv.businessId).currency
}

const s = (i: number) => students[i]
const INVOICES_KEY = 'unidest-student-invoices'

const seedInvoices: StudentInvoice[] = [
  { id: 387499, date: '06-05-2026 07:07 am', businessId: 1, studentNo: s(0).studentNo, student: s(0).name, email: s(0).email, phone: s(0).phone, dueDate: '23-07-2026', items: [{ description: 'Application processing fee', amount: 1500 }, { description: 'IELTS coaching', amount: 555 }], discount: 0, terms: 'Payable within 30 days of issue.', payments: [{ amount: 1000, date: '10 May 2026', note: 'Part payment' }] },
  { id: 735296, date: '22-04-2026 01:14 pm', businessId: 1, studentNo: s(2).studentNo, student: s(2).name, email: s(2).email, phone: s(2).phone, dueDate: '30-06-2026', items: [{ description: 'Visa filing service', amount: 1370 }], discount: 0, terms: 'Payable within 30 days of issue.', payments: [] },
  { id: 573674, date: '08-04-2026 04:31 pm', businessId: 2, studentNo: s(3).studentNo, student: s(3).name, email: s(3).email, phone: s(3).phone, dueDate: '20-06-2026', items: [{ description: 'Counselling package', amount: 2000 }, { description: 'Document attestation', amount: 740 }], discount: 0, terms: 'Payable within 30 days of issue.', payments: [] },
  { id: 418372, date: '20-03-2026 11:53 am', businessId: 1, studentNo: s(4).studentNo, student: s(4).name, email: s(4).email, phone: s(4).phone, dueDate: '15-05-2026', items: [{ description: 'Application processing fee', amount: 1500 }], discount: 130, terms: 'Payable within 30 days of issue.', payments: [{ amount: 1000, date: '25 Mar 2026', note: 'Advance' }] },
  { id: 260118, date: '02-03-2026 09:20 am', businessId: 1, studentNo: s(5).studentNo, student: s(5).name, email: s(5).email, phone: s(5).phone, dueDate: '02-04-2026', items: [{ description: 'Full service package', amount: 3200 }], discount: 200, terms: 'Payable within 30 days of issue.', payments: [{ amount: 3000, date: '05 Mar 2026', note: 'Bank transfer' }] },
  { id: 194655, date: '18-02-2026 05:40 pm', businessId: 2, studentNo: s(9).studentNo, student: s(9).name, email: s(9).email, phone: s(9).phone, dueDate: '18-03-2026', items: [{ description: 'IELTS coaching', amount: 800 }, { description: 'Mock test bundle', amount: 200 }], discount: 0, terms: 'Payable within 30 days of issue.', payments: [] },
]

export function loadStudentInvoices(): StudentInvoice[] {
  try {
    const raw = localStorage.getItem(INVOICES_KEY)
    if (!raw) return seedInvoices
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : seedInvoices
  } catch {
    return seedInvoices
  }
}

export const studentInvoices: StudentInvoice[] = loadStudentInvoices()

export function saveStudentInvoices(next: StudentInvoice[]) {
  try {
    localStorage.setItem(INVOICES_KEY, JSON.stringify(next))
  } catch {
    // Storage blocked — changes just won't persist.
  }
}

export function addStudentInvoice(data: Omit<StudentInvoice, 'id'>): StudentInvoice {
  // A 6-digit invoice number derived from the clock, like the demo's numbers.
  let id = 100000 + (Date.now() % 900000)
  while (studentInvoices.some((i) => i.id === id)) id += 1
  const invoice: StudentInvoice = { ...data, id }
  studentInvoices.unshift(invoice)
  saveStudentInvoices([...studentInvoices])
  return invoice
}

export function updateStudentInvoice(updated: StudentInvoice) {
  const i = studentInvoices.findIndex((x) => x.id === updated.id)
  if (i >= 0) studentInvoices[i] = updated
  saveStudentInvoices([...studentInvoices])
}

export function deleteStudentInvoice(id: number) {
  const i = studentInvoices.findIndex((x) => x.id === id)
  if (i >= 0) studentInvoices.splice(i, 1)
  saveStudentInvoices([...studentInvoices])
}

export function studentInvoiceById(id: number): StudentInvoice | undefined {
  return studentInvoices.find((x) => x.id === id)
}

/** Now-stamp in the list's "dd-mm-yyyy hh:mm am" format. */
export function invoiceNowStamp(): string {
  const now = new Date()
  const d = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(now)
    .replace(/\//g, '-')
  const t = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    .format(now)
    .toLowerCase()
  return `${d} ${t}`
}
