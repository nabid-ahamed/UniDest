// Mock data for the Applications page.
// Docs: docs/superpowers/mock-data/adminpage.md. Replace with real API in Phase 2.

import { allCountries, leadBranches, leadStaff, intakes } from './leads'

export interface Application {
  id: number
  dateCreated: string // e.g. "27-04-2026"
  student: string
  studentNo: string // reference back to the student record
  country: string // study destination
  university: string
  course: string
  intake: string // same format as the shared `intakes` list, e.g. "May 2026"
  /** Counsellor/agent person shown with the 👤 icon in Details (null = none). */
  agent: string | null
  appliedThrough: string // channel, e.g. "DIRECT" / "Applyboard"
  status: string
  statusColor: string
  assignedTo: string | null // null = Unassigned
  branch: string
}

// Badge colours are the darker 700/800 shades so white text clears WCAG AA
// (>= 4.5:1). ApplicationRow still runs pickTextColor() as a safety net.
export const applicationStatuses = [
  { label: 'Pending', color: '#b91c1c' },
  { label: 'Funds Under Assessment', color: '#0e7490' },
  { label: 'Admission Criteria Met', color: '#6d28d9' },
  { label: 'Payment Received', color: '#1d4ed8' },
  { label: 'Offer Letter Received', color: '#15803d' },
  { label: 'Withdrawn', color: '#475569' },
]

/** Channels an application can be submitted through. */
export const applicationChannels = ['DIRECT', 'Applyboard', 'Adventus', 'INTO Global']

export const applicationBulkActions = [
  'Assign to staff',
  'Change status',
  'Send email',
  'Delete selected',
]

// Shared lookups (same tables as Leads/Students in the real schema).
export { allCountries, leadBranches as applicationBranches, leadStaff as applicationStaff, intakes }

/** Total applications in the system (the list below is one filtered page). */
export const totalApplicationCount = 193

const s = (label: string) =>
  applicationStatuses.find((x) => x.label === label)?.color ?? '#0e7490'

export const applications: Application[] = [
  { id: 142347, dateCreated: '27-04-2026', student: 'Aarav Sharma', studentNo: 'STU-2026-1902', country: 'Canada', university: 'University of Toronto', course: 'Business Studies', intake: 'May 2026', agent: null, appliedThrough: 'DIRECT', status: 'Offer Letter Received', statusColor: s('Offer Letter Received'), assignedTo: 'Sarah Ali', branch: 'Sylhet' },
  { id: 846140, dateCreated: '24-04-2026', student: 'Fatima Rahman', studentNo: 'STU-2026-1898', country: 'United Arab Emirates', university: 'University of Dubai', course: 'International Business', intake: 'July 2026', agent: null, appliedThrough: 'Applyboard', status: 'Pending', statusColor: s('Pending'), assignedTo: 'Mohammed Saleh', branch: 'Khulna' },
  { id: 302122, dateCreated: '15-04-2026', student: 'Rohan Das', studentNo: 'STU-2026-1893', country: 'Finland', university: 'University of Helsinki', course: 'Data Science', intake: 'July 2026', agent: null, appliedThrough: 'DIRECT', status: 'Payment Received', statusColor: s('Payment Received'), assignedTo: 'Moses Otieno', branch: 'Dhaka' },
  { id: 138249, dateCreated: '15-04-2026', student: 'Ayesha Khan', studentNo: 'STU-2026-1888', country: 'Kuwait', university: 'Kuwait International University', course: 'Health Sciences', intake: 'August 2026', agent: 'Shubham Gill', appliedThrough: 'DIRECT', status: 'Pending', statusColor: s('Pending'), assignedTo: 'Admin Two Test', branch: 'Dhaka' },
  { id: 947181, dateCreated: '08-04-2026', student: 'Vikram Patel', studentNo: 'STU-2026-1884', country: 'United Kingdom', university: 'University of Manchester', course: 'LLM International Law', intake: 'December 2026', agent: 'Shubham Gill', appliedThrough: 'DIRECT', status: 'Funds Under Assessment', statusColor: s('Funds Under Assessment'), assignedTo: 'Sarah Ali', branch: 'Sylhet' },
  { id: 279430, dateCreated: '08-04-2026', student: 'Nabila Haque', studentNo: 'STU-2026-1879', country: 'Vietnam', university: 'RMIT Vietnam', course: 'Software Engineering', intake: 'November 2027', agent: null, appliedThrough: 'Applyboard', status: 'Pending', statusColor: s('Pending'), assignedTo: 'Mohammed Saleh', branch: 'Chattogram' },
  { id: 399448, dateCreated: '20-03-2026', student: 'Arjun Mehta', studentNo: 'STU-2026-1875', country: 'Cyprus', university: 'University of Nicosia', course: 'Mechanical Engineering', intake: 'February 2027', agent: 'Agent Test', appliedThrough: 'Adventus', status: 'Pending', statusColor: s('Pending'), assignedTo: 'Moses Otieno', branch: 'Khulna' },
  { id: 185330, dateCreated: '20-03-2026', student: 'Sadia Islam', studentNo: 'STU-2026-1870', country: 'United Arab Emirates', university: 'Middlesex University Dubai', course: 'Arts & Humanities', intake: 'October 2026', agent: 'Shubham Gill', appliedThrough: 'DIRECT', status: 'Pending', statusColor: s('Pending'), assignedTo: null, branch: 'Dhaka' },
  { id: 237041, dateCreated: '20-03-2026', student: 'Priya Nair', studentNo: 'STU-2026-1861', country: 'China', university: 'Fudan University', course: 'Public Health', intake: 'April 2027', agent: 'Agent Test', appliedThrough: 'INTO Global', status: 'Offer Letter Received', statusColor: s('Offer Letter Received'), assignedTo: 'Admin Two Test', branch: 'Khulna' },
  { id: 904784, dateCreated: '28-02-2026', student: 'Tanvir Ahmed', studentNo: 'STU-2026-1855', country: 'India', university: 'Kolkata University', course: 'Computer Science', intake: 'February 2026', agent: null, appliedThrough: 'Adventus', status: 'Admission Criteria Met', statusColor: s('Admission Criteria Met'), assignedTo: 'Sarah Ali', branch: 'Chattogram' },
  { id: 771205, dateCreated: '18-02-2026', student: 'Meera Iyer', studentNo: 'STU-2026-1849', country: 'Australia', university: 'University of Melbourne', course: 'Computer Science', intake: 'February 2027', agent: 'Agent Test', appliedThrough: 'Adventus', status: 'Payment Received', statusColor: s('Payment Received'), assignedTo: 'Moses Otieno', branch: 'Sylhet' },
  { id: 663918, dateCreated: '05-02-2026', student: 'Sneha Reddy', studentNo: 'STU-2026-1836', country: 'New Zealand', university: 'University of Auckland', course: 'Nursing', intake: 'January 2027', agent: null, appliedThrough: 'DIRECT', status: 'Funds Under Assessment', statusColor: s('Funds Under Assessment'), assignedTo: null, branch: 'Khulna' },
  { id: 550274, dateCreated: '22-01-2026', student: 'Imran Ali', studentNo: 'STU-2026-1842', country: 'United States', university: 'Arizona State University', course: 'MBA', intake: 'September 2026', agent: 'Shubham Gill', appliedThrough: 'DIRECT', status: 'Withdrawn', statusColor: s('Withdrawn'), assignedTo: 'Mohammed Saleh', branch: 'Dhaka' },
  { id: 418096, dateCreated: '10-01-2026', student: 'Rahul Verma', studentNo: 'STU-2026-1829', country: 'Germany', university: 'Technical University of Munich', course: 'Automotive Engineering', intake: 'April 2027', agent: null, appliedThrough: 'Applyboard', status: 'Pending', statusColor: s('Pending'), assignedTo: null, branch: 'Chattogram' },
]
