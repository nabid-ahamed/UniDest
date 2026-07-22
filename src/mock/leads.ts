// Mock data for the Leads page.
// Docs: docs/superpowers/mock-data/adminpage.md. Replace with real API in Phase 2.

export interface Lead {
  id: number
  name: string
  email: string
  emailDate: string // e.g. "18 Jul"
  phone: string
  phoneNote: string // short label shown after the number
  whatsapp: boolean
  leadAgeDays: number
  branch: string
  status: string
  statusColor: string
  assignedTo: string | null // null = Unassigned
  created: string // e.g. "19 Jul 2026"
  nextFollowup: string | null
  countryInterested: string // destination country the lead wants to study in
  /** Labels shown as removable chips on the row. Seeded on a few leads only. */
  tags?: string[]
  // Profile fields shown on the lead detail page (missing → "-").
  gender?: string
  studyLevel?: string
  qualification?: string
  source?: string
  countryOfResidence?: string
}

// Badge colours are the darker 700/800 shades so white text clears WCAG AA
// (all verified >= 4.5:1). LeadRow still runs pickTextColor() as a safety net.
export const leadStatuses = [
  { label: 'New Lead', color: '#0e7490' },
  { label: 'Contacted', color: '#1d4ed8' },
  { label: 'Counseling', color: '#6d28d9' },
  { label: 'Warm', color: '#c2410c' },
  { label: 'Cold', color: '#a16207' },
  { label: 'Registered', color: '#15803d' },
  { label: 'Rejected', color: '#b91c1c' },
]

export const leadStaff = ['Sarah Ali', 'Mohammed Saleh', 'Moses Otieno', 'Admin Two Test']
export const leadCountries = ['Bangladesh', 'India', 'Nepal', 'Pakistan', 'Sri Lanka']
export const leadBranches = ['All Branch', 'Dhaka', 'Chattogram', 'Sylhet', 'Khulna']

// Full list of countries for "Country Interested In" (study destination) filter.
export const allCountries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia',
  'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
  'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina',
  'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia',
  'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China',
  'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czechia',
  'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador',
  'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia',
  'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein',
  'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Mauritania', 'Mauritius', 'Mexico', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro',
  'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nepal', 'Netherlands', 'New Zealand',
  'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Panama',
  'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
  'Romania', 'Russia', 'Rwanda', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
  'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Somalia', 'South Africa',
  'South Korea', 'Spain', 'Sri Lanka', 'Sudan', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
  'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
  'Turkmenistan', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia',
  'Zimbabwe',
]

// Advanced ("More") filter option lists
export const studyLevels = ['Bachelors', 'Masters', 'PhD', 'Diploma', 'Foundation']
export const coursesInterested = [
  'Business & Management',
  'Computer Science',
  'Engineering',
  'Health Sciences',
  'Law',
  'Arts & Humanities',
]
/**
 * Intake options generated at runtime: starts from the current month and lists
 * the next 2 years (24 months), each formatted as "September 2026".
 */
function generateIntakes(months = 24): string[] {
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
  const now = new Date()
  return Array.from({ length: months }, (_, i) =>
    fmt.format(new Date(now.getFullYear(), now.getMonth() + i, 1)),
  )
}
export const intakes = generateIntakes()
export const followupDateOptions = ['Today', 'Tomorrow', 'This Week', 'This Month', 'Overdue']
export const leadSources = ['Facebook', 'Website', 'Walk-in', 'Referral', 'Agent', 'Other']
export const services = [
  'Study Visa',
  'Work Visa',
  'Visitor Visa',
  'Tourist Visa',
  'Business Visa',
  'Dependent Visa',
  'Student Dependent Visa',
  'Permanent Residency (PR)',
  'Citizenship',
  'Immigration Consultation',
  'Visa Extension',
  'Other',
]

// Used by the "Add New Lead" form.
export const qualifications = [
  'SSC / O-Level',
  'HSC / A-Level',
  'Diploma',
  'Bachelors',
  'Masters',
  'PhD',
  'Other',
]
export const phoneCountryCodes = [
  { code: '+880', label: 'BD +880' },
  { code: '+91', label: 'IN +91' },
  { code: '+92', label: 'PK +92' },
  { code: '+977', label: 'NP +977' },
  { code: '+94', label: 'LK +94' },
  { code: '+44', label: 'UK +44' },
  { code: '+1', label: 'US +1' },
]
export const englishTests = ['IELTS', 'TOEFL', 'PTE', 'GRE', 'DUOLINGO']

/**
 * Most-recently-used tags, newest first. The Add-Tag dialog shows the last 10
 * and moves a tag back to the front each time it is applied.
 */
export const recentTags = [
  'Hot Lead',
  'Follow Up',
  'Scholarship Seeker',
  'IELTS Pending',
  'Document Pending',
  'High Budget',
  'Referral',
  'Walk-in',
  'Visa Query',
  'Not Reachable',
]

/** Total leads in the system (the list below is one filtered page). */
export const totalLeadCount = 190

const s = (label: string) =>
  leadStatuses.find((x) => x.label === label)?.color ?? '#06b6d4'

const seedLeads: Lead[] = [
  { id: 2379, name: 'Aarav Sharma', email: 'aarav.sharma@gmail.com', emailDate: '18 Jul', phone: '+91 98450 12345', phoneNote: 'at the time', whatsapp: true, leadAgeDays: 0, branch: 'Sylhet', status: 'New Lead', statusColor: s('New Lead'), assignedTo: null, created: '19 Jul 2026', nextFollowup: null, countryInterested: 'United Kingdom', tags: ['High Commission', 'Mid Priority'], gender: 'Male', studyLevel: 'Short Term Programs', qualification: 'Bachelors', source: 'Facebook', countryOfResidence: 'India' },
  { id: 2367, name: 'Fatima Rahman', email: 'fatima.r@gmail.com', emailDate: '21 Jun', phone: '+880 1712 445566', phoneNote: 'Human resource', whatsapp: false, leadAgeDays: 26, branch: 'Khulna', status: 'New Lead', statusColor: s('New Lead'), assignedTo: null, created: '23 Jun 2026', nextFollowup: '22 Jul 2026', countryInterested: 'Canada' },
  { id: 2370, name: 'Rohan Das', email: 'rohan.das@gmail.com', emailDate: '24 Jun', phone: '+91 90080 11223', phoneNote: 'Column four', whatsapp: true, leadAgeDays: 26, branch: 'Dhaka', status: 'Contacted', statusColor: s('Contacted'), assignedTo: 'Sarah Ali', created: '23 Jun 2026', nextFollowup: null, countryInterested: 'Australia', tags: ['Hot Lead'], gender: 'Male', studyLevel: 'Masters', qualification: 'Bachelors', source: 'Website', countryOfResidence: 'India' },
  { id: 2371, name: 'Ayesha Khan', email: 'ayesha.khan@gmail.com', emailDate: '26 Jun', phone: '+92 300 4455667', phoneNote: 'Agent created', whatsapp: false, leadAgeDays: 26, branch: 'Dhaka', status: 'New Lead', statusColor: s('New Lead'), assignedTo: null, created: '23 Jun 2026', nextFollowup: null, countryInterested: 'United States' },
  { id: 2372, name: 'Vikram Patel', email: 'vikram.p@gmail.com', emailDate: '27 Jun', phone: '+91 98765 43210', phoneNote: 'IELTS test', whatsapp: false, leadAgeDays: 26, branch: 'Sylhet', status: 'Warm', statusColor: s('Warm'), assignedTo: 'Mohammed Saleh', created: '23 Jun 2026', nextFollowup: '25 Jul 2026', countryInterested: 'United Kingdom', tags: ['Scholarship Seeker', 'Follow Up'] },
  { id: 2374, name: 'Nabila Haque', email: 'nabila.h@gmail.com', emailDate: '29 Jun', phone: '+880 1811 223344', phoneNote: 'country wise', whatsapp: false, leadAgeDays: 26, branch: 'Chattogram', status: 'New Lead', statusColor: s('New Lead'), assignedTo: null, created: '23 Jun 2026', nextFollowup: null, countryInterested: 'Canada' },
  { id: 2375, name: 'Arjun Mehta', email: 'arjun.mehta@gmail.com', emailDate: '01 Jul', phone: '+91 99887 66554', phoneNote: 'university', whatsapp: false, leadAgeDays: 26, branch: 'Khulna', status: 'Counseling', statusColor: s('Counseling'), assignedTo: 'Moses Otieno', created: '23 Jun 2026', nextFollowup: null, countryInterested: 'Germany' },
  { id: 2376, name: 'Sadia Islam', email: 'sadia.islam@gmail.com', emailDate: '02 Jul', phone: '+880 1911 556677', phoneNote: 'Linking of', whatsapp: false, leadAgeDays: 26, branch: 'Dhaka', status: 'New Lead', statusColor: s('New Lead'), assignedTo: null, created: '23 Jun 2026', nextFollowup: null, countryInterested: 'Australia' },
  { id: 2377, name: 'Karim Uddin', email: 'karim.uddin@gmail.com', emailDate: '04 Jul', phone: '+880 1611 778899', phoneNote: 'If we want', whatsapp: true, leadAgeDays: 26, branch: 'Sylhet', status: 'Cold', statusColor: s('Cold'), assignedTo: null, created: '23 Jun 2026', nextFollowup: null, countryInterested: 'United States' },
  { id: 2365, name: 'Priya Nair', email: 'priya.nair@gmail.com', emailDate: '16 Jun', phone: '+91 90000 11111', phoneNote: 'Welcome note', whatsapp: true, leadAgeDays: 26, branch: 'Khulna', status: 'Registered', statusColor: s('Registered'), assignedTo: 'Sarah Ali', created: '23 Jun 2026', nextFollowup: null, countryInterested: 'United Kingdom' },
  { id: 2360, name: 'Tanvir Ahmed', email: 'tanvir.ahmed@gmail.com', emailDate: '12 Jun', phone: '+880 1521 334455', phoneNote: 'follow up', whatsapp: false, leadAgeDays: 30, branch: 'Chattogram', status: 'Contacted', statusColor: s('Contacted'), assignedTo: 'Admin Two Test', created: '19 Jun 2026', nextFollowup: '20 Jul 2026', countryInterested: 'Canada' },
  { id: 2358, name: 'Meera Iyer', email: 'meera.iyer@gmail.com', emailDate: '10 Jun', phone: '+91 98111 22233', phoneNote: 'scholarship', whatsapp: true, leadAgeDays: 32, branch: 'Sylhet', status: 'New Lead', statusColor: s('New Lead'), assignedTo: null, created: '17 Jun 2026', nextFollowup: null, countryInterested: 'Australia' },
  { id: 2351, name: 'Imran Ali', email: 'imran.ali@gmail.com', emailDate: '05 Jun', phone: '+92 301 5566778', phoneNote: 'visa query', whatsapp: false, leadAgeDays: 39, branch: 'Dhaka', status: 'Rejected', statusColor: s('Rejected'), assignedTo: 'Mohammed Saleh', created: '10 Jun 2026', nextFollowup: null, countryInterested: 'United States' },
  { id: 2344, name: 'Sneha Reddy', email: 'sneha.reddy@gmail.com', emailDate: '01 Jun', phone: '+91 99555 44422', phoneNote: 'course finder', whatsapp: true, leadAgeDays: 45, branch: 'Khulna', status: 'Warm', statusColor: s('Warm'), assignedTo: 'Moses Otieno', created: '04 Jun 2026', nextFollowup: '21 Jul 2026', countryInterested: 'United Kingdom' },
  { id: 2338, name: 'Rahul Verma', email: 'rahul.verma@gmail.com', emailDate: '28 May', phone: '+91 90123 45678', phoneNote: 'intake 2026', whatsapp: false, leadAgeDays: 50, branch: 'Chattogram', status: 'New Lead', statusColor: s('New Lead'), assignedTo: null, created: '30 May 2026', nextFollowup: null, countryInterested: 'Germany' },
]

// ---------------------------------------------------------------------------
// Persistence (frontend-only): the Add New Lead form does a full page redirect
// back to the list, so an in-memory array would lose the new lead. Until the
// real API exists, the working copy lives in localStorage; the seed above is
// only the first-run default.
// ---------------------------------------------------------------------------

const LEADS_KEY = 'unidest-leads'

function loadLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(LEADS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as Lead[]
    }
  } catch {
    // Corrupt/blocked storage → fall back to the seed.
  }
  return seedLeads
}

/** Working list — seeded on first run, then whatever the user last saved. */
export const leads: Lead[] = loadLeads()

export function saveLeads(next: Lead[]) {
  try {
    localStorage.setItem(LEADS_KEY, JSON.stringify(next))
  } catch {
    // Storage full/blocked — the session still works, it just won't persist.
  }
}

/** Prepend a new lead (assigning the next id) and persist. Returns it. */
export function addLead(data: Omit<Lead, 'id'>): Lead {
  const lead: Lead = { ...data, id: Math.max(0, ...leads.map((l) => l.id)) + 1 }
  saveLeads([lead, ...leads])
  return lead
}

/** Replace one lead (by id) in memory and persist. */
export function updateLead(updated: Lead) {
  const i = leads.findIndex((l) => l.id === updated.id)
  if (i >= 0) leads[i] = updated
  saveLeads([...leads])
}
