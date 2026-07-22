// Mock data for the Broadcast pages (modeled on the EduCtrl demo).
// Docs: docs/superpowers/mock-data/adminpage.md. Replace with real API in Phase 2.

import { leads, leadStatuses, leadStaff, allCountries } from './leads'
import { students, studentStatuses } from './students'

export const targetGroups = ['Leads', 'Students', 'Agents/Partners', 'Staff Members']

export { leadStatuses, studentStatuses, allCountries }

export interface BroadcastTemplate {
  name: string
  subject: string
  body: string
}

export const emailTemplates: BroadcastTemplate[] = [
  { name: 'Intro email to fresh leads', subject: 'Welcome to GlobalEd — your study abroad journey starts here', body: 'Dear #first_name#,\n\nThank you for reaching out to GlobalEd. Our counsellors will contact you shortly to discuss your study abroad plans.\n\nWarm regards,\nGlobalEd Team' },
  { name: 'WEBINAR_REMINDER', subject: 'Webinar Reminder - #webinar#', body: 'Dear #first_name#,\n\nThis is a friendly reminder that you have registered for an upcoming webinar.\n\nSee you there!' },
  { name: 'Admission', subject: 'Your admission update', body: 'Dear #first_name#,\n\nWe have an update on your admission. Please log in to your portal to view the details.' },
  { name: 'COURSE_SUGGESTION', subject: 'New course suggestions for you', body: 'Dear #first_name#,\n\nYour counsellor has shared new course suggestions with you. Log in to review and accept.' },
  { name: 'BIRTHDAY_WISHES', subject: 'Happy Birthday, #first_name#!', body: 'Dear #first_name#,\n\nWishing you a wonderful birthday from all of us at GlobalEd!' },
  { name: 'LEAD_WELCOME', subject: 'Welcome to GlobalEd', body: 'Dear #first_name#,\n\nWelcome! Your account has been created. A counsellor will be in touch soon.' },
]

export const smsTemplates: BroadcastTemplate[] = [
  { name: 'Last minute offer', subject: '', body: 'GlobalEd: Last minute scholarship offers for Sep intake! Reply YES to talk to a counsellor today.' },
  { name: 'LEAD_WELCOME', subject: '', body: 'Welcome to GlobalEd, #first_name#! Your counsellor will call you shortly. Questions? Call +880 1700 000000.' },
  { name: 'WEBINAR_REMINDER', subject: '', body: 'Reminder: your GlobalEd webinar starts in 1 hour. Join link was sent to your email.' },
  { name: 'BIRTHDAY_WISHES', subject: '', body: 'Happy Birthday #first_name#! Warm wishes from the GlobalEd family.' },
  { name: 'NOTIFICATION', subject: '', body: 'GlobalEd: there is an update on your file. Please log in or contact your counsellor.' },
]

/** Small mock partner/agent list (target group "Agents/Partners"). */
export const agentEmails = [
  'agent@globaled-partners.com',
  'anup.consultancy@gmail.com',
  'edulink.dhaka@gmail.com',
  'studypath.agent@gmail.com',
  'visamate.bd@gmail.com',
]

/** Staff emails derived from the shared staff lookup. */
export const staffEmails = leadStaff.map(
  (n) => `${n.toLowerCase().replace(/[^a-z]+/g, '.')}@globaled.com`,
)

/**
 * Resolve recipient emails for a broadcast target.
 * Filters mirror the demo: Leads → country + statuses; Students → statuses +
 * optional "exclude agent students".
 */
export function resolveRecipients(opts: {
  target: string
  country?: string
  leadStatusSel?: string[]
  studentStatusSel?: string[]
  excludeAgentStudents?: boolean
}): string[] {
  if (opts.target === 'Leads')
    return leads
      .filter((l) => !opts.country || opts.country === '-ANY-' || l.countryInterested === opts.country)
      .filter((l) => !opts.leadStatusSel?.length || opts.leadStatusSel.includes(l.status))
      .map((l) => l.email)
  if (opts.target === 'Students')
    return students
      .filter((s) => !opts.studentStatusSel?.length || opts.studentStatusSel.includes(s.status))
      .filter((s) => !opts.excludeAgentStudents || s.source !== 'Agent')
      .map((s) => s.email)
  if (opts.target === 'Agents/Partners') return agentEmails
  if (opts.target === 'Staff Members') return staffEmails
  return []
}

export interface BroadcastRecord {
  id: number
  dateTime: string // "04 Jun, 10:47am"
  type: 'email' | 'sms'
  subject: string
  message: string
  sentTo: string[]
  staff: string
}

const HISTORY_KEY = 'unidest-broadcasts'

const seedHistory: BroadcastRecord[] = [
  {
    id: 3,
    dateTime: '04 Jun, 10:47am',
    type: 'email',
    subject: 'Overseas Education: Tip of the day',
    message:
      'Ut nisi eros, mollis et placerat quis, bibendum mollis mauris. Integer in faucibus erat. Pellentesque et egestas diam. Integer quis scelerisque metus, sed ultricies mi.',
    sentTo: leads.slice(0, 8).map((l) => l.email),
    staff: 'Admin Admin',
  },
  {
    id: 2,
    dateTime: '27 Feb, 3:57pm',
    type: 'email',
    subject: 'Webinar Reminder - #webinar#',
    message:
      'Dear #first_name#,\n\nThis is a friendly reminder that you have registered for an upcoming webinar.',
    sentTo: students.slice(0, 6).map((s) => s.email),
    staff: 'Admin Admin',
  },
  {
    id: 1,
    dateTime: '12 Jan, 9:15am',
    type: 'sms',
    subject: '--',
    message: 'GlobalEd: Last minute scholarship offers for Sep intake! Reply YES to talk to a counsellor today.',
    sentTo: leads.slice(3, 12).map((l) => l.email),
    staff: 'Sarah Ali',
  },
]

export function loadBroadcasts(): BroadcastRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return seedHistory
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : seedHistory
  } catch {
    return seedHistory
  }
}

export function addBroadcast(record: Omit<BroadcastRecord, 'id'>): BroadcastRecord {
  const list = loadBroadcasts()
  const rec: BroadcastRecord = { ...record, id: Math.max(0, ...list.map((r) => r.id)) + 1 }
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([rec, ...list]))
  } catch {
    // Storage blocked — the broadcast just won't appear in history.
  }
  return rec
}
