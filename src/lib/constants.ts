/**
 * Shared dropdown options and lookup lists.
 *
 * These are the filter and form choices the UI offers — not data. They moved
 * out of `src/mock/` once the screens they serve began reading their *records*
 * from the API: leaving them there made the folder mean two things at once,
 * and "mock" should mean exactly one — "not yet migrated".
 *
 * Several of these (statuses, branches, countries) also exist as rows in the
 * database. The API is the authority for what a record *is*; these lists are
 * what the pickers offer. Where a screen needs the live set, it should read the
 * corresponding API endpoint instead.
 */

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


// ---- Students ------------------------------------------------------------

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
  'Assign Students to Staff',
  'Archive Students',
  'Delete Students',
]


// ---- Applications ------------------------------------------------

export const applicationStatuses: { label: string; color: string }[] = [
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

// ---- Support tickets ---------------------------------------------

/** The ticket vocabulary the pickers offer. Seeded into ticket_statuses. */
export type TicketStatus = 'Open' | 'Pending' | 'Resolved' | 'Closed'
export type TicketPriority = 'High' | 'Medium' | 'Low'

export const ticketStatuses: TicketStatus[] = ['Open', 'Pending', 'Resolved', 'Closed']
export const ticketPriorities: TicketPriority[] = ['High', 'Medium', 'Low']
export const ticketCategories = [
  'Application',
  'Payment',
  'Documents',
  'Visa',
  'Course Selection',
  'Account',
  'Other',
]
export const ticketBulkActions = [
  'Assign to staff',
  'Change status',
  'Change priority',
  'Delete selected',
]

// ---- Invoices ----------------------------------------------------

export const invoiceStatuses = ['Due', 'Paid'] as const
export const paymentLabels = ['1st Payment', '2nd Payment', '3rd Payment', 'Final Payment']
export const invoiceCurrencies = ['USD', 'GBP', 'EUR', 'AUD', 'CAD', 'INR']
export const invoiceableStatuses = ['Offer Letter Received', 'Payment Received']

// ---- Webinars ----------------------------------------------------

export const webinarAudienceTypes = ['Student', 'Agent', 'Student / Agent'] as const

// ---- Media library -----------------------------------------------

export const allowedMediaExtensions = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'mp4', 'mov', 'wmv', 'webm']
export const maxMediaMb = 16

// ---- Student resources -------------------------------------------

export const allowedExtensions = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'zip', 'mp4']
export const maxFileMb = 49
