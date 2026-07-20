// Mock data for the Dashboard page.
// Docs: docs/superpowers/mock-data/adminpage.md. Replace with real API in Phase 2.

export interface StatCardData {
  key: 'leads' | 'students' | 'applications' | 'support'
  label: string
  sublabel: string
  value: number
  color: 'amber' | 'blue' | 'sky' | 'purple'
}

export const dashboardStats: StatCardData[] = [
  { key: 'leads', label: 'Leads', sublabel: 'Open Leads', value: 27, color: 'amber' },
  { key: 'students', label: 'Students', sublabel: 'Total Students', value: 1876, color: 'blue' },
  { key: 'applications', label: 'Applications', sublabel: 'Open Applications', value: 214, color: 'sky' },
  { key: 'support', label: 'Support Tickets', sublabel: 'Open Support Tickets', value: 96, color: 'purple' },
]

export interface DailyPoint {
  date: string
  count: number
}

// Students — last 14 days
export const studentsDaily: DailyPoint[] = [
  { date: '06 Jul', count: 3 },
  { date: '07 Jul', count: 5 },
  { date: '08 Jul', count: 2 },
  { date: '09 Jul', count: 6 },
  { date: '10 Jul', count: 4 },
  { date: '11 Jul', count: 7 },
  { date: '12 Jul', count: 3 },
  { date: '13 Jul', count: 5 },
  { date: '14 Jul', count: 8 },
  { date: '15 Jul', count: 4 },
  { date: '16 Jul', count: 6 },
  { date: '17 Jul', count: 5 },
  { date: '18 Jul', count: 7 },
  { date: '19 Jul', count: 4 },
]

// Leads — last 7 days
export const leadsDaily: DailyPoint[] = [
  { date: '13', count: 2 },
  { date: '14', count: 4 },
  { date: '15', count: 1 },
  { date: '16', count: 3 },
  { date: '17', count: 5 },
  { date: '18', count: 2 },
  { date: '19', count: 3 },
]

// Applications — last 7 days
export const applicationsDaily: DailyPoint[] = [
  { date: '13', count: 1 },
  { date: '14', count: 2 },
  { date: '15', count: 3 },
  { date: '16', count: 1 },
  { date: '17', count: 2 },
  { date: '18', count: 4 },
  { date: '19', count: 2 },
]

export interface FollowUp {
  id: number
  name: string
  detail: string
  when: string
}

export interface FollowUpBuckets {
  today: FollowUp[]
  due: FollowUp[]
  upcoming: FollowUp[]
}

export const leadFollowups: FollowUpBuckets = {
  today: [],
  due: [
    { id: 1, name: 'Karim Hossain', detail: 'UK — Masters in Data Science', when: 'Yesterday' },
    { id: 2, name: 'Priya Sharma', detail: 'Canada — Bachelors', when: '2 days ago' },
  ],
  upcoming: [
    { id: 3, name: 'Nadia Rahman', detail: 'Australia — MBA', when: 'Tomorrow' },
  ],
}

export const studentFollowups: FollowUpBuckets = {
  today: [],
  due: [
    { id: 1, name: 'Tanvir Ahmed', detail: 'Visa document review', when: 'Yesterday' },
  ],
  upcoming: [
    { id: 2, name: 'Sadia Islam', detail: 'Offer letter follow-up', when: 'In 2 days' },
    { id: 3, name: 'Rahul Verma', detail: 'Tuition deposit reminder', when: 'Next week' },
  ],
}

export interface Reminder {
  id: number
  name: string
  applicationNo: string
  deadline: string
  owner: string
  activity: string
}

export const applicationReminders: Reminder[] = [
  { id: 1, name: 'Rahim Uddin', applicationNo: '354134', deadline: '25 Sep 2025', owner: 'Admin Two Test', activity: 'Submit final transcripts' },
  { id: 2, name: 'Ishant Khatiwada', applicationNo: '537634', deadline: '17 Oct 2025', owner: 'Mohammed Saleh', activity: 'Please pay the bill' },
  { id: 3, name: 'Puneet Jindal', applicationNo: '150967', deadline: '24 Nov 2025', owner: 'You', activity: 'Loan process to start' },
  { id: 4, name: 'Usaid Khan', applicationNo: '302122', deadline: '23 Apr 2026', owner: 'Moses Otieno', activity: 'Check documents' },
  { id: 5, name: 'Ayesha Siddiqua', applicationNo: '418260', deadline: '12 May 2026', owner: 'Sarah Ali', activity: 'Book visa appointment' },
  { id: 6, name: 'Tenzin Norbu', applicationNo: '229845', deadline: '03 Jun 2026', owner: 'You', activity: 'Follow up on offer letter' },
  { id: 7, name: 'Farhan Chowdhury', applicationNo: '481037', deadline: '28 Jun 2026', owner: 'Sarah Ali', activity: 'Upload IELTS scorecard' },
  { id: 8, name: 'Meera Nair', applicationNo: '190558', deadline: '02 Jul 2026', owner: 'You', activity: 'Confirm intake selection' },
  { id: 9, name: 'Arjun Mehta', applicationNo: '673021', deadline: '09 Jul 2026', owner: 'Mohammed Saleh', activity: 'Sign offer acceptance' },
  { id: 10, name: 'Sadia Karim', applicationNo: '558914', deadline: '15 Jul 2026', owner: 'Moses Otieno', activity: 'Pay tuition deposit' },
  { id: 11, name: 'Rohit Sharma', applicationNo: '204776', deadline: '21 Jul 2026', owner: 'You', activity: 'Prepare SOP draft' },
  { id: 12, name: 'Nabila Haque', applicationNo: '839210', deadline: '27 Jul 2026', owner: 'Sarah Ali', activity: 'Collect bank statement' },
  { id: 13, name: 'Dinesh Patel', applicationNo: '116402', deadline: '04 Aug 2026', owner: 'Admin Two Test', activity: 'Verify passport validity' },
  { id: 14, name: 'Lakshmi Reddy', applicationNo: '927315', deadline: '11 Aug 2026', owner: 'You', activity: 'Schedule counselling call' },
  { id: 15, name: 'Imran Hossain', applicationNo: '345198', deadline: '19 Aug 2026', owner: 'Mohammed Saleh', activity: 'Request LOR from referee' },
  { id: 16, name: 'Priyanka Das', applicationNo: '760284', deadline: '26 Aug 2026', owner: 'Moses Otieno', activity: 'Book biometrics appointment' },
  { id: 17, name: 'Kabir Ahmed', applicationNo: '502631', deadline: '02 Sep 2026', owner: 'You', activity: 'Submit visa application' },
  { id: 18, name: 'Sneha Iyer', applicationNo: '288457', deadline: '10 Sep 2026', owner: 'Sarah Ali', activity: 'Arrange accommodation proof' },
  { id: 19, name: 'Tariq Aziz', applicationNo: '634509', deadline: '18 Sep 2026', owner: 'Admin Two Test', activity: 'Pay application fee' },
  { id: 20, name: 'Ananya Ghosh', applicationNo: '419876', deadline: '25 Sep 2026', owner: 'You', activity: 'Attend pre-departure briefing' },
  { id: 21, name: 'Yusuf Rahman', applicationNo: '805142', deadline: '01 Oct 2026', owner: 'Mohammed Saleh', activity: 'Finalize course choice' },
  { id: 22, name: 'Divya Menon', applicationNo: '573098', deadline: '08 Oct 2026', owner: 'Moses Otieno', activity: 'Get medical test done' },
  { id: 23, name: 'Shahriar Kabir', applicationNo: '260713', deadline: '16 Oct 2026', owner: 'You', activity: 'Confirm flight booking' },
]

export const reminderCount = applicationReminders.length

export const branches: string[] = ['All Branch', 'Dhaka', 'Chattogram', 'Sylhet', 'Khulna']

// ── Breakdown sections (Students / Leads / Tickets / Your stats) ──

/**
 * Semantic status tone — maps to the `status.*` colour tokens in
 * tailwind.config.js. Components resolve a tone to a class; they never receive
 * a raw hex, so contrast stays guaranteed in one place.
 */
export type StatusTone =
  | 'pending'
  | 'progress'
  | 'review'
  | 'success'
  | 'danger'
  | 'neutral'
  | 'info'
  | 'total'

export interface Breakdown {
  label: string
  count: number
  tone: StatusTone
}

export interface SimpleStat {
  label: string
  value: number
}

export const ticketSummary: SimpleStat[] = [
  { label: 'Open', value: 96 },
  { label: 'Pending', value: 41 },
  { label: 'Resolved', value: 312 },
  { label: 'Closed', value: 588 },
]

export const ticketsByPriority: Breakdown[] = [
  { label: 'High', count: 23, tone: 'danger' },
  { label: 'Medium', count: 58, tone: 'pending' },
  { label: 'Low', count: 56, tone: 'success' },
]

export const yourStats: SimpleStat[] = [
  { label: 'My Leads', value: 12 },
  { label: 'My Students', value: 47 },
  { label: 'My Applications', value: 29 },
  { label: 'My Open Tasks', value: 8 },
]

// Study Abroad Stats — colored application-status tiles
export interface AppStatusStat {
  label: string
  count: number
  tone: StatusTone
}

// Tones group statuses by pipeline stage, so colour actually carries meaning
// (previously 11 of these 22 shared one identical blue).
export const applicationStatusStats: AppStatusStat[] = [
  { label: 'Pending', count: 87, tone: 'pending' },
  { label: 'Documents Ready', count: 19, tone: 'progress' },
  { label: 'Admission Criteria Met', count: 11, tone: 'progress' },
  { label: 'EMGS Issued', count: 3, tone: 'success' },
  { label: 'Application Fee', count: 6, tone: 'pending' },
  { label: 'Application Submitted', count: 14, tone: 'progress' },
  { label: 'Offer Letter Received', count: 16, tone: 'success' },
  { label: 'Conditional Offer Letter', count: 5, tone: 'review' },
  { label: 'Funds Under Assessment', count: 4, tone: 'review' },
  { label: 'COE Received', count: 3, tone: 'success' },
  { label: 'Payment Received', count: 7, tone: 'success' },
  { label: 'CAS Requested', count: 2, tone: 'progress' },
  { label: 'CAS Received', count: 3, tone: 'success' },
  { label: 'I-20 Initiated', count: 1, tone: 'progress' },
  { label: 'I-20 Received', count: 2, tone: 'success' },
  { label: 'AIP Received', count: 1, tone: 'success' },
  { label: 'GIC Account Created', count: 2, tone: 'progress' },
  { label: 'Visa In Process', count: 12, tone: 'review' },
  { label: 'Visa Received', count: 9, tone: 'success' },
  { label: 'Admission Complete', count: 10, tone: 'success' },
  { label: 'Rejected', count: 4, tone: 'danger' },
  { label: 'Total Applications', count: 234, tone: 'total' },
]

// Students section — status tiles
export const studentStatusStats: AppStatusStat[] = [
  { label: 'Pending for Registration', count: 1892, tone: 'pending' },
  { label: 'Course Preference Added', count: 53, tone: 'progress' },
  { label: 'Onboarding', count: 6, tone: 'info' },
  { label: 'Documents Uploaded', count: 14, tone: 'progress' },
  { label: 'Application Processing', count: 61, tone: 'review' },
  { label: 'Admission Complete', count: 18, tone: 'success' },
  { label: 'Total Students', count: 1876, tone: 'total' },
]

// Leads section — status tiles
export const leadStatusStats: AppStatusStat[] = [
  { label: 'New Lead', count: 27, tone: 'info' },
  { label: 'Attempted', count: 12, tone: 'neutral' },
  { label: 'Counseling', count: 9, tone: 'review' },
  { label: 'SL Final Counseling', count: 4, tone: 'review' },
  { label: 'Warm', count: 8, tone: 'pending' },
  { label: 'Long Term Nurture', count: 5, tone: 'neutral' },
  { label: 'Cold', count: 6, tone: 'neutral' },
  { label: 'Registered', count: 152, tone: 'success' },
  { label: 'Rejected', count: 11, tone: 'danger' },
  { label: 'Potential', count: 7, tone: 'progress' },
  { label: 'Financials Outstanding', count: 3, tone: 'pending' },
  { label: 'Non Responsive', count: 14, tone: 'neutral' },
  { label: 'Testing', count: 2, tone: 'neutral' },
  { label: 'Total Leads', count: 176, tone: 'total' },
]
