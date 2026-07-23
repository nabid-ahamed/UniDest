// Mock data for the University Invoices module (modeled on the EduCtrl demo's
// university-invoices pages). Docs: docs/superpowers/mock-data/adminpage.md.
//
// This module connects to the existing Applications data: an invoice is raised
// against an application, so invoices carry the application id and reuse its
// student / university / country / agent / channel fields.

import { applications, type Application } from './applications'

export interface InvoicePayment {
  label: string // "1st Payment", "2nd Payment"
  amount: number
  date: string // "14 Mar 2026"
  note: string
}

export interface UniversityInvoice {
  id: number // invoice number, e.g. 100005
  date: string // "03-06-2026 11:25 am"
  applicationId: number // links back to an Application
  university: string
  country: string
  student: string
  agent: string | null // Master Agent name when applied through an agent
  appliedThrough: string
  paymentLabel: string // which instalment this invoice covers
  currency: string // INR / USD / GBP / AUD / EUR
  amount: number
  status: 'Paid' | 'Due'
  nextPayment: string | null // upcoming instalment date, if any
  agentInvoiceRequested: boolean
  payments: InvoicePayment[]
}

export const invoiceStatuses = ['Due', 'Paid'] as const

/** Instalment labels used when raising / recording a payment. */
export const paymentLabels = ['1st Payment', '2nd Payment', '3rd Payment', 'Final Payment']

export const invoiceCurrencies = ['USD', 'GBP', 'EUR', 'AUD', 'CAD', 'INR']

/** Applications eligible to be invoiced (the "complete" end of the pipeline). */
export const invoiceableStatuses = ['Offer Letter Received', 'Payment Received']

export function isInvoiceable(app: Application): boolean {
  return invoiceableStatuses.includes(app.status)
}

/** Universities that appear across invoices + applications, for the filters. */
export const invoiceUniversities = [
  ...new Set(applications.map((a) => a.university)),
].sort()

const money = (currency: string, amount: number) => `${currency} ${amount.toFixed(2)}`
export const formatMoney = money

const INVOICES_KEY = 'unidest-uni-invoices'

const seedInvoices: UniversityInvoice[] = [
  { id: 100005, date: '03-06-2026 11:25 am', applicationId: 142347, university: 'University of Toronto', country: 'Canada', student: 'Aarav Sharma', agent: null, appliedThrough: 'DIRECT', paymentLabel: '1st Payment', currency: 'CAD', amount: 1500, status: 'Paid', nextPayment: null, agentInvoiceRequested: false, payments: [{ label: '1st Payment', amount: 1500, date: '05 Jun 2026', note: 'Paid in full' }] },
  { id: 100004, date: '06-05-2026 05:28 pm', applicationId: 302122, university: 'University of Helsinki', country: 'Finland', student: 'Rohan Das', agent: null, appliedThrough: 'DIRECT', paymentLabel: '1st Payment', currency: 'USD', amount: 1000, status: 'Due', nextPayment: null, agentInvoiceRequested: false, payments: [] },
  { id: 100003, date: '13-03-2026 05:21 pm', applicationId: 947181, university: 'University of Manchester', country: 'United Kingdom', student: 'Vikram Patel', agent: 'Shubham Gill', appliedThrough: 'DIRECT', paymentLabel: '1st Payment', currency: 'GBP', amount: 16332.91, status: 'Due', nextPayment: '14 Mar 2026', agentInvoiceRequested: true, payments: [] },
  { id: 100002, date: '27-02-2026 03:40 pm', applicationId: 771205, university: 'University of Melbourne', country: 'Australia', student: 'Meera Iyer', agent: 'Agent Test', appliedThrough: 'Adventus', paymentLabel: '1st Payment', currency: 'AUD', amount: 6967.79, status: 'Paid', nextPayment: null, agentInvoiceRequested: true, payments: [{ label: '1st Payment', amount: 6967.79, date: '02 Mar 2026', note: 'Bank transfer' }] },
  { id: 100001, date: '15-12-2024 10:46 pm', applicationId: 237041, university: 'Fudan University', country: 'China', student: 'Priya Nair', agent: null, appliedThrough: 'INTO Global', paymentLabel: '1st Payment', currency: 'USD', amount: 14250, status: 'Paid', nextPayment: null, agentInvoiceRequested: false, payments: [{ label: '1st Payment', amount: 14250, date: '20 Dec 2024', note: '' }] },
]

export function loadInvoices(): UniversityInvoice[] {
  try {
    const raw = localStorage.getItem(INVOICES_KEY)
    if (!raw) return seedInvoices
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : seedInvoices
  } catch {
    return seedInvoices
  }
}

export const universityInvoices: UniversityInvoice[] = loadInvoices()

export function saveInvoices(next: UniversityInvoice[]) {
  try {
    localStorage.setItem(INVOICES_KEY, JSON.stringify(next))
  } catch {
    // Storage blocked — changes just won't persist.
  }
}

export function addInvoice(data: Omit<UniversityInvoice, 'id'>): UniversityInvoice {
  const invoice: UniversityInvoice = {
    ...data,
    id: Math.max(100000, ...universityInvoices.map((i) => i.id)) + 1,
  }
  universityInvoices.unshift(invoice)
  saveInvoices([...universityInvoices])
  return invoice
}

export function updateInvoice(updated: UniversityInvoice) {
  const i = universityInvoices.findIndex((x) => x.id === updated.id)
  if (i >= 0) universityInvoices[i] = updated
  saveInvoices([...universityInvoices])
}

export function deleteInvoice(id: number) {
  const i = universityInvoices.findIndex((x) => x.id === id)
  if (i >= 0) universityInvoices.splice(i, 1)
  saveInvoices([...universityInvoices])
}

/** How many invoices have been raised against a given application. */
export function invoiceCountForApplication(appId: number): number {
  return universityInvoices.filter((i) => i.applicationId === appId).length
}
