// Mock data for the Support Tickets module — help-desk requests raised by
// students and leads. Same persistence + CRUD pattern as Applications/Students.
// Replace with a real API in Phase 2.

import { leadStaff, leadBranches } from './leads'

export type TicketStatus = 'Open' | 'Pending' | 'Resolved' | 'Closed'
export type TicketPriority = 'High' | 'Medium' | 'Low'
export type RequesterKind = 'Student' | 'Lead'

/** One message in a ticket's conversation thread. */
export interface TicketMessage {
  id: number
  author: string // display name
  fromStaff: boolean // true = office reply, false = requester
  at: string // "28 Jul 2026 · 2:14 PM"
  body: string
}

export interface Ticket {
  id: number // ticket number, e.g. 4021
  subject: string
  category: string // e.g. "Application", "Payment"
  requester: string // student/lead name
  requesterKind: RequesterKind
  requesterNo: string // STU-… or LEAD-… reference
  branch: string
  status: TicketStatus
  priority: TicketPriority
  assignedTo: string | null // null = Unassigned
  created: string // "24 Jul 2026"
  updated: string // "28 Jul 2026"
  messages: TicketMessage[]
}

export const ticketStatuses: TicketStatus[] = ['Open', 'Pending', 'Resolved', 'Closed']
export const ticketPriorities: TicketPriority[] = ['High', 'Medium', 'Low']




// Shared lookups (same tables as the other modules).
export { leadStaff as ticketStaff, leadBranches as ticketBranches }

/** Status → semantic tone (maps to the same status.* tokens used elsewhere). */
export const ticketStatusTone: Record<TicketStatus, string> = {
  Open: 'info',
  Pending: 'pending',
  Resolved: 'success',
  Closed: 'neutral',
}

/** Priority → semantic tone. */
export const ticketPriorityTone: Record<TicketPriority, string> = {
  High: 'danger',
  Medium: 'pending',
  Low: 'success',
}

const m = (id: number, author: string, fromStaff: boolean, at: string, body: string): TicketMessage => ({
  id,
  author,
  fromStaff,
  at,
  body,
})

const seedTickets: Ticket[] = [
  {
    id: 4021,
    subject: 'Offer letter not showing in my portal',
    category: 'Application',
    requester: 'Aarav Sharma',
    requesterKind: 'Student',
    requesterNo: 'STU-2026-1902',
    branch: 'Sylhet',
    status: 'Open',
    priority: 'High',
    assignedTo: 'Sarah Ali',
    created: '24 Jul 2026',
    updated: '28 Jul 2026',
    messages: [
      m(1, 'Aarav Sharma', false, '24 Jul 2026 · 10:12 AM', 'I received an email that my offer letter is ready, but it is not appearing under my applications. Could you please check?'),
      m(2, 'Sarah Ali', true, '24 Jul 2026 · 11:40 AM', 'Hi Aarav, thanks for reaching out — I can see the offer on our end and I am re-syncing it to your portal now. Please allow a few minutes.'),
    ],
  },
  {
    id: 4020,
    subject: 'Paid application fee but status still pending',
    category: 'Payment',
    requester: 'Fatima Rahman',
    requesterKind: 'Student',
    requesterNo: 'STU-2026-1898',
    branch: 'Khulna',
    status: 'Pending',
    priority: 'High',
    assignedTo: 'Mohammed Saleh',
    created: '23 Jul 2026',
    updated: '27 Jul 2026',
    messages: [
      m(1, 'Fatima Rahman', false, '23 Jul 2026 · 4:05 PM', 'I paid the application fee two days ago through the bank transfer, but the application still shows as pending payment.'),
      m(2, 'Mohammed Saleh', true, '24 Jul 2026 · 9:30 AM', 'Thank you Fatima — could you share the transaction reference so we can reconcile it with the university?'),
    ],
  },
  {
    id: 4019,
    subject: 'Which documents are required for the UK visa?',
    category: 'Visa',
    requester: 'Karim Uddin',
    requesterKind: 'Lead',
    requesterNo: 'LEAD-2026-0442',
    branch: 'Dhaka',
    status: 'Open',
    priority: 'Medium',
    assignedTo: null,
    created: '22 Jul 2026',
    updated: '22 Jul 2026',
    messages: [
      m(1, 'Karim Uddin', false, '22 Jul 2026 · 1:20 PM', 'I am planning to apply for a UK student visa. Can you send me the full checklist of documents I need to prepare?'),
    ],
  },
  {
    id: 4018,
    subject: 'Unable to upload my IELTS scorecard',
    category: 'Documents',
    requester: 'Rohan Das',
    requesterKind: 'Student',
    requesterNo: 'STU-2026-1893',
    branch: 'Dhaka',
    status: 'Resolved',
    priority: 'Low',
    assignedTo: 'Moses Otieno',
    created: '19 Jul 2026',
    updated: '21 Jul 2026',
    messages: [
      m(1, 'Rohan Das', false, '19 Jul 2026 · 6:15 PM', 'The upload keeps failing when I try to add my IELTS scorecard PDF. The file is 3 MB.'),
      m(2, 'Moses Otieno', true, '20 Jul 2026 · 10:02 AM', 'Hi Rohan — the limit is 2 MB per file. Please compress the PDF and try again.'),
      m(3, 'Rohan Das', false, '20 Jul 2026 · 8:47 PM', 'That worked, thank you! It uploaded fine after compressing.'),
      m(4, 'Moses Otieno', true, '21 Jul 2026 · 9:15 AM', 'Great — marking this as resolved. Reach out any time.'),
    ],
  },
  {
    id: 4017,
    subject: 'Request to change my intended intake to Jan 2027',
    category: 'Course Selection',
    requester: 'Ayesha Khan',
    requesterKind: 'Student',
    requesterNo: 'STU-2026-1888',
    branch: 'Dhaka',
    status: 'Pending',
    priority: 'Medium',
    assignedTo: 'Admin Two Test',
    created: '18 Jul 2026',
    updated: '20 Jul 2026',
    messages: [
      m(1, 'Ayesha Khan', false, '18 Jul 2026 · 11:05 AM', 'Due to personal reasons I would like to defer my intake from September 2026 to January 2027. Is that possible?'),
      m(2, 'Admin Two Test', true, '19 Jul 2026 · 3:22 PM', 'Hi Ayesha — we can request a deferral from the university. I will confirm the process and get back to you.'),
    ],
  },
  {
    id: 4016,
    subject: 'Not able to log in to the student portal',
    category: 'Account',
    requester: 'Nabila Haque',
    requesterKind: 'Student',
    requesterNo: 'STU-2026-1879',
    branch: 'Chattogram',
    status: 'Closed',
    priority: 'Low',
    assignedTo: 'Sarah Ali',
    created: '15 Jul 2026',
    updated: '16 Jul 2026',
    messages: [
      m(1, 'Nabila Haque', false, '15 Jul 2026 · 9:40 AM', 'My password is not being accepted even though I am sure it is correct.'),
      m(2, 'Sarah Ali', true, '15 Jul 2026 · 12:10 PM', 'I have sent you a password reset link — please set a new password from there.'),
      m(3, 'Nabila Haque', false, '15 Jul 2026 · 5:33 PM', 'All good now, thank you!'),
    ],
  },
  {
    id: 4015,
    subject: 'Interested in scholarship options for Canada',
    category: 'Other',
    requester: 'Vikram Patel',
    requesterKind: 'Lead',
    requesterNo: 'LEAD-2026-0431',
    branch: 'Sylhet',
    status: 'Open',
    priority: 'Medium',
    assignedTo: 'Moses Otieno',
    created: '14 Jul 2026',
    updated: '17 Jul 2026',
    messages: [
      m(1, 'Vikram Patel', false, '14 Jul 2026 · 2:50 PM', 'Could you let me know which Canadian universities offer scholarships for international masters students?'),
      m(2, 'Moses Otieno', true, '15 Jul 2026 · 10:00 AM', 'Certainly — I will prepare a shortlist based on your profile and share it shortly.'),
    ],
  },
  {
    id: 4014,
    subject: 'Tuition deposit deadline extension',
    category: 'Payment',
    requester: 'Sadia Islam',
    requesterKind: 'Student',
    requesterNo: 'STU-2026-1870',
    branch: 'Dhaka',
    status: 'Resolved',
    priority: 'High',
    assignedTo: 'Mohammed Saleh',
    created: '11 Jul 2026',
    updated: '13 Jul 2026',
    messages: [
      m(1, 'Sadia Islam', false, '11 Jul 2026 · 7:20 PM', 'I need a few more days to arrange the tuition deposit. Can the deadline be extended?'),
      m(2, 'Mohammed Saleh', true, '12 Jul 2026 · 9:45 AM', 'We have requested a one-week extension from the university and it has been approved. New deadline is 20 Jul 2026.'),
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Persistence (localStorage) + CRUD — same pattern as Applications    */
/* ------------------------------------------------------------------ */

const KEY = 'unidest-support-tickets'

/** Live, mutable list. Other modules read this so edits stay in sync. */
export const tickets: Ticket[] = (() => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seedTickets
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : seedTickets
  } catch {
    return seedTickets
  }
})()

/** Persist the current list. Call after any mutation. */
export function persistTickets() {
  try {
    localStorage.setItem(KEY, JSON.stringify(tickets))
  } catch {
    // Storage blocked — changes stay in-memory for this session.
  }
}

export const getTicket = (id: number) => tickets.find((t) => t.id === id)

export function updateTicket(id: number, patch: Partial<Omit<Ticket, 'id'>>) {
  const t = tickets.find((x) => x.id === id)
  if (!t) return
  Object.assign(t, patch)
  persistTickets()
}

export function setTicketStatus(id: number, status: TicketStatus) {
  updateTicket(id, { status })
}

export function setTicketPriority(id: number, priority: TicketPriority) {
  updateTicket(id, { priority })
}

export function setTicketAssignee(id: number, assignedTo: string | null) {
  updateTicket(id, { assignedTo })
}

/** Append an office reply to a ticket's thread and bump its updated date. */
export function addTicketReply(id: number, author: string, body: string, at: string) {
  const t = tickets.find((x) => x.id === id)
  if (!t) return
  const nextId = t.messages.length ? Math.max(...t.messages.map((x) => x.id)) + 1 : 1
  t.messages.push({ id: nextId, author, fromStaff: true, at, body })
  t.updated = at.split(' · ')[0]
  persistTickets()
}

export function deleteTicket(id: number) {
  const i = tickets.findIndex((x) => x.id === id)
  if (i >= 0) tickets.splice(i, 1)
  persistTickets()
}

export function deleteTickets(ids: number[]) {
  const set = new Set(ids)
  for (let i = tickets.length - 1; i >= 0; i--) {
    if (set.has(tickets[i].id)) tickets.splice(i, 1)
  }
  persistTickets()
}

/** Tickets raised by a given student/lead (matched by name or reference no). */
export function ticketsFor(name: string, refNo?: string): Ticket[] {
  return tickets.filter((t) => t.requester === name || (!!refNo && t.requesterNo === refNo))
}

/** Live status counts for the dashboard "Tickets" section. */
export function ticketStatusCounts(): Record<TicketStatus, number> {
  const counts: Record<TicketStatus, number> = { Open: 0, Pending: 0, Resolved: 0, Closed: 0 }
  tickets.forEach((t) => (counts[t.status] += 1))
  return counts
}

// Dropdown options live in src/lib/constants.ts — re-exported so existing
// imports keep working. New code should import from there directly.
export { ticketCategories, ticketBulkActions } from '../lib/constants'
