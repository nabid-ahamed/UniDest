// Mock data for the Students page.
// Docs: docs/superpowers/mock-data/adminpage.md. Replace with real API in Phase 2.

import { allCountries, leadBranches, leadStaff, intakes, studyLevels } from './leads'

export interface Student {
  id: number
  studentNo: string // display reference, e.g. "STU-2026-0143"
  name: string
  email: string
  emailDate: string // e.g. "18 Jul"
  phone: string
  phoneNote: string
  branch: string
  status: string
  statusColor: string
  assignedTo: string | null // null = Unassigned
  created: string
  countryOfResidence: string
  countryInterested: string
  studyLevel: string
  course: string
  intake: string
  university: string | null
  applications: number
  source: string
}

// Badge colours are the 700/800 shades so white text clears WCAG AA (>= 4.5:1).
// StudentRow still runs pickTextColor() as a safety net.
export const studentStatuses = [
  { label: 'Active', color: '#0e7490' },
  { label: 'Docs Pending', color: '#a16207' },
  { label: 'Applied', color: '#1d4ed8' },
  { label: 'Offer Received', color: '#6d28d9' },
  { label: 'Visa Applied', color: '#c2410c' },
  { label: 'Enrolled', color: '#15803d' },
  { label: 'Inactive', color: '#475569' },
  { label: 'Withdrawn', color: '#b91c1c' },
]

/** Where the student currently lives (drives the "Country Of Residence" filter). */
export const residenceCountries = ['Bangladesh', 'India', 'Nepal', 'Pakistan', 'Sri Lanka']

export const universities = [
  'University of Toronto',
  'University of Melbourne',
  'University of Manchester',
  'Technical University of Munich',
  'Arizona State University',
  'University of Auckland',
]

export const studentSources = ['Walk-in', 'Website', 'Facebook', 'Referral', 'Agent', 'Lead Convert']

export const studentBulkActions = [
  'Assign to staff',
  'Change status',
  'Send email',
  'Send SMS',
  'Delete selected',
]

// Filter option lists shared with the Leads page — same lookup tables in the
// real schema, so they stay in one place.
export { allCountries, leadBranches as studentBranches, leadStaff as studentStaff, intakes, studyLevels }

/** Total students in the system (the list below is one filtered page). */
export const totalStudentCount = 1876

const s = (label: string) => studentStatuses.find((x) => x.label === label)?.color ?? '#0e7490'

export const students: Student[] = [
  { id: 1902, studentNo: 'STU-2026-1902', name: 'Aarav Sharma', email: 'aarav.sharma@gmail.com', emailDate: '18 Jul', phone: '+91 98450 12345', phoneNote: 'Primary', branch: 'Sylhet', status: 'Active', statusColor: s('Active'), assignedTo: 'Sarah Ali', created: '19 Jul 2026', countryOfResidence: 'India', countryInterested: 'United Kingdom', studyLevel: 'Masters', course: 'Computer Science', intake: 'September 2026', university: 'University of Manchester', applications: 2, source: 'Lead Convert' },
  { id: 1898, studentNo: 'STU-2026-1898', name: 'Fatima Rahman', email: 'fatima.r@gmail.com', emailDate: '15 Jul', phone: '+880 1712 445566', phoneNote: 'WhatsApp', branch: 'Khulna', status: 'Docs Pending', statusColor: s('Docs Pending'), assignedTo: null, created: '16 Jul 2026', countryOfResidence: 'Bangladesh', countryInterested: 'Canada', studyLevel: 'Bachelors', course: 'Business & Management', intake: 'January 2027', university: null, applications: 0, source: 'Walk-in' },
  { id: 1893, studentNo: 'STU-2026-1893', name: 'Rohan Das', email: 'rohan.das@gmail.com', emailDate: '12 Jul', phone: '+91 90080 11223', phoneNote: 'Primary', branch: 'Dhaka', status: 'Applied', statusColor: s('Applied'), assignedTo: 'Mohammed Saleh', created: '13 Jul 2026', countryOfResidence: 'India', countryInterested: 'Australia', studyLevel: 'Masters', course: 'Engineering', intake: 'February 2027', university: 'University of Melbourne', applications: 3, source: 'Referral' },
  { id: 1888, studentNo: 'STU-2026-1888', name: 'Ayesha Khan', email: 'ayesha.khan@gmail.com', emailDate: '10 Jul', phone: '+92 300 4455667', phoneNote: 'Father', branch: 'Dhaka', status: 'Offer Received', statusColor: s('Offer Received'), assignedTo: 'Moses Otieno', created: '11 Jul 2026', countryOfResidence: 'Pakistan', countryInterested: 'United States', studyLevel: 'Bachelors', course: 'Health Sciences', intake: 'September 2026', university: 'Arizona State University', applications: 4, source: 'Website' },
  { id: 1884, studentNo: 'STU-2026-1884', name: 'Vikram Patel', email: 'vikram.p@gmail.com', emailDate: '08 Jul', phone: '+91 98765 43210', phoneNote: 'Primary', branch: 'Sylhet', status: 'Visa Applied', statusColor: s('Visa Applied'), assignedTo: 'Sarah Ali', created: '09 Jul 2026', countryOfResidence: 'India', countryInterested: 'United Kingdom', studyLevel: 'Masters', course: 'Law', intake: 'September 2026', university: 'University of Manchester', applications: 2, source: 'Agent' },
  { id: 1879, studentNo: 'STU-2026-1879', name: 'Nabila Haque', email: 'nabila.h@gmail.com', emailDate: '05 Jul', phone: '+880 1811 223344', phoneNote: 'WhatsApp', branch: 'Chattogram', status: 'Enrolled', statusColor: s('Enrolled'), assignedTo: 'Admin Two Test', created: '06 Jul 2026', countryOfResidence: 'Bangladesh', countryInterested: 'Canada', studyLevel: 'Masters', course: 'Computer Science', intake: 'September 2026', university: 'University of Toronto', applications: 1, source: 'Facebook' },
  { id: 1875, studentNo: 'STU-2026-1875', name: 'Arjun Mehta', email: 'arjun.mehta@gmail.com', emailDate: '03 Jul', phone: '+91 99887 66554', phoneNote: 'Primary', branch: 'Khulna', status: 'Active', statusColor: s('Active'), assignedTo: null, created: '04 Jul 2026', countryOfResidence: 'India', countryInterested: 'Germany', studyLevel: 'Masters', course: 'Engineering', intake: 'April 2027', university: 'Technical University of Munich', applications: 1, source: 'Website' },
  { id: 1870, studentNo: 'STU-2026-1870', name: 'Sadia Islam', email: 'sadia.islam@gmail.com', emailDate: '01 Jul', phone: '+880 1911 556677', phoneNote: 'Mother', branch: 'Dhaka', status: 'Docs Pending', statusColor: s('Docs Pending'), assignedTo: 'Mohammed Saleh', created: '02 Jul 2026', countryOfResidence: 'Bangladesh', countryInterested: 'Australia', studyLevel: 'Bachelors', course: 'Arts & Humanities', intake: 'February 2027', university: null, applications: 0, source: 'Walk-in' },
  { id: 1866, studentNo: 'STU-2026-1866', name: 'Karim Uddin', email: 'karim.uddin@gmail.com', emailDate: '28 Jun', phone: '+880 1611 778899', phoneNote: 'Primary', branch: 'Sylhet', status: 'Inactive', statusColor: s('Inactive'), assignedTo: null, created: '29 Jun 2026', countryOfResidence: 'Bangladesh', countryInterested: 'United States', studyLevel: 'Diploma', course: 'Business & Management', intake: 'September 2026', university: null, applications: 0, source: 'Facebook' },
  { id: 1861, studentNo: 'STU-2026-1861', name: 'Priya Nair', email: 'priya.nair@gmail.com', emailDate: '25 Jun', phone: '+91 90000 11111', phoneNote: 'WhatsApp', branch: 'Khulna', status: 'Enrolled', statusColor: s('Enrolled'), assignedTo: 'Sarah Ali', created: '26 Jun 2026', countryOfResidence: 'India', countryInterested: 'United Kingdom', studyLevel: 'PhD', course: 'Health Sciences', intake: 'January 2027', university: 'University of Manchester', applications: 2, source: 'Referral' },
  { id: 1855, studentNo: 'STU-2026-1855', name: 'Tanvir Ahmed', email: 'tanvir.ahmed@gmail.com', emailDate: '22 Jun', phone: '+880 1521 334455', phoneNote: 'Primary', branch: 'Chattogram', status: 'Applied', statusColor: s('Applied'), assignedTo: 'Admin Two Test', created: '23 Jun 2026', countryOfResidence: 'Bangladesh', countryInterested: 'Canada', studyLevel: 'Masters', course: 'Engineering', intake: 'September 2026', university: 'University of Toronto', applications: 3, source: 'Lead Convert' },
  { id: 1849, studentNo: 'STU-2026-1849', name: 'Meera Iyer', email: 'meera.iyer@gmail.com', emailDate: '19 Jun', phone: '+91 98111 22233', phoneNote: 'Primary', branch: 'Sylhet', status: 'Offer Received', statusColor: s('Offer Received'), assignedTo: 'Moses Otieno', created: '20 Jun 2026', countryOfResidence: 'India', countryInterested: 'Australia', studyLevel: 'Bachelors', course: 'Computer Science', intake: 'February 2027', university: 'University of Melbourne', applications: 2, source: 'Agent' },
  { id: 1842, studentNo: 'STU-2026-1842', name: 'Imran Ali', email: 'imran.ali@gmail.com', emailDate: '16 Jun', phone: '+92 301 5566778', phoneNote: 'Brother', branch: 'Dhaka', status: 'Withdrawn', statusColor: s('Withdrawn'), assignedTo: 'Mohammed Saleh', created: '17 Jun 2026', countryOfResidence: 'Pakistan', countryInterested: 'United States', studyLevel: 'Masters', course: 'Business & Management', intake: 'September 2026', university: null, applications: 1, source: 'Website' },
  { id: 1836, studentNo: 'STU-2026-1836', name: 'Sneha Reddy', email: 'sneha.reddy@gmail.com', emailDate: '12 Jun', phone: '+91 99555 44422', phoneNote: 'WhatsApp', branch: 'Khulna', status: 'Visa Applied', statusColor: s('Visa Applied'), assignedTo: 'Sarah Ali', created: '13 Jun 2026', countryOfResidence: 'India', countryInterested: 'New Zealand', studyLevel: 'Masters', course: 'Health Sciences', intake: 'January 2027', university: 'University of Auckland', applications: 2, source: 'Referral' },
  { id: 1829, studentNo: 'STU-2026-1829', name: 'Rahul Verma', email: 'rahul.verma@gmail.com', emailDate: '09 Jun', phone: '+91 90123 45678', phoneNote: 'Primary', branch: 'Chattogram', status: 'Active', statusColor: s('Active'), assignedTo: null, created: '10 Jun 2026', countryOfResidence: 'India', countryInterested: 'Germany', studyLevel: 'Bachelors', course: 'Engineering', intake: 'April 2027', university: null, applications: 0, source: 'Facebook' },
]
