// Mock data for the Webinar & Events page.
// Docs: docs/superpowers/mock-data/adminpage.md. Replace with real API in Phase 2.

export interface Webinar {
  id: number
  topic: string
  date: string // e.g. "11-06-2026 02:31 PM"
  venue: string
  audienceType: 'Student' | 'Agent' | 'Student / Agent'
  /** null = no enrolments yet (shown as "--"). */
  enrolledUsers: number | null
  /** Join link shown on the detail page (null → "--"). */
  webinarLink?: string | null
  description?: string | null
  notifiedEmail?: string | null
}

/** Public share URL for a webinar (mock domain until the backend exists). */
export const webinarShareLink = (w: Webinar) =>
  `https://unidest.com/webinar/${w.id}-${w.topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)}`

export const webinarAudienceTypes = ['Student', 'Agent', 'Student / Agent'] as const

const seedWebinars: Webinar[] = [
  { id: 18, topic: 'UK September 2026 Intake — Everything You Need to Know', date: '11-06-2026 02:31 PM', venue: 'Online', audienceType: 'Student', enrolledUsers: null, webinarLink: 'https://meet.google.com/uni-dest-uk26', description: 'Entry requirements, tuition, scholarships and the application timeline for the UK September 2026 intake.' },
  { id: 17, topic: 'IELTS Band 7+ Strategy Session', date: '01-05-2026 08:30 AM', venue: 'Dhaka HQ Seminar Hall', audienceType: 'Student / Agent', enrolledUsers: 1, description: 'Live strategy session with our IELTS trainers — writing task 2 structures and speaking drills.', notifiedEmail: 'students@unidest.com' },
  { id: 16, topic: 'Agent Partner Onboarding Workshop', date: '16-03-2026 12:45 PM', venue: 'Chattogram Branch', audienceType: 'Agent', enrolledUsers: null },
  { id: 15, topic: 'Intro Webinar: Study in Canada', date: '18-12-2025 12:16 PM', venue: 'Online', audienceType: 'Student', enrolledUsers: 2 },
  { id: 14, topic: 'Scholarship Application Masterclass', date: '31-10-2025 10:15 PM', venue: 'Online', audienceType: 'Student', enrolledUsers: 1 },
  { id: 13, topic: 'Was ist Ausbildung? Who Can Apply and What You Should Know', date: '26-09-2025 03:03 PM', venue: 'Webinar', audienceType: 'Student', enrolledUsers: 1 },
  { id: 12, topic: 'Careers in DevOps — Course & University Guide', date: '09-10-2025 07:15 PM', venue: 'Online', audienceType: 'Student', enrolledUsers: 1 },
  { id: 11, topic: 'Introduction to Automation Testing', date: '23-06-2025 07:00 PM', venue: 'Online', audienceType: 'Student', enrolledUsers: null },
  { id: 10, topic: 'Statement of Purpose (SOP) Writing Clinic', date: '14-03-2025 11:45 AM', venue: 'Sylhet Branch', audienceType: 'Student', enrolledUsers: 1 },
  { id: 9, topic: 'Study in Australia — Visa & GTE Session', date: '21-03-2025 05:32 PM', venue: 'Online', audienceType: 'Student', enrolledUsers: null },
  { id: 8, topic: 'Automation Testing (Java, Selenium)', date: '28-02-2025 04:45 PM', venue: 'Online', audienceType: 'Student', enrolledUsers: 1 },
  { id: 7, topic: 'Sales and Marketing Fundamentals', date: '09-01-2025 06:45 PM', venue: 'Online', audienceType: 'Student', enrolledUsers: null },
  { id: 6, topic: 'USA F-1 Visa Interview Preparation', date: '02-08-2024 03:15 PM', venue: 'Online', audienceType: 'Student', enrolledUsers: 1 },
  { id: 5, topic: 'Marketing Your Profile to Universities', date: '31-08-2023 06:00 PM', venue: 'Khulna Branch', audienceType: 'Student', enrolledUsers: 1 },
  { id: 4, topic: 'Daily Schedule & Leisure Activities Abroad', date: '05-12-2022 06:00 PM', venue: 'Online', audienceType: 'Student', enrolledUsers: 16 },
  { id: 3, topic: 'The Seasons and The Weather — Life in the UK', date: '13-11-2022 06:00 PM', venue: 'Online', audienceType: 'Student', enrolledUsers: 24 },
  { id: 2, topic: 'Learn to Talk About Personal Information and Introduction', date: '04-12-2020 06:00 PM', venue: 'Online', audienceType: 'Student', enrolledUsers: 28 },
  { id: 1, topic: 'Learn to Talk About Living and Home Furnishing', date: '21-11-2020 06:00 PM', venue: 'Online', audienceType: 'Student', enrolledUsers: 7 },
]

// ---------------------------------------------------------------------------
// Persistence (frontend-only): sidebar navigation does full page reloads, so
// in-memory edits would vanish. Until the real API exists, the working copy
// lives in localStorage; the seed above is only the first-run default.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'unidest-webinars'

function loadWebinars(): Webinar[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as Webinar[]
    }
  } catch {
    // Corrupt/blocked storage → fall back to the seed.
  }
  return seedWebinars
}

/** Working list — seeded on first run, then whatever the user last saved. */
export const webinars: Webinar[] = loadWebinars()

export function saveWebinars(next: Webinar[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage full/blocked — the session still works, it just won't persist.
  }
}

/** Replace one webinar (by id) and persist. */
export function updateWebinar(updated: Webinar) {
  saveWebinars(webinars.map((w) => (w.id === updated.id ? updated : w)))
}

// ---------------------------------------------------------------------------
// Enrolments
// ---------------------------------------------------------------------------

export interface WebinarEnrollment {
  id: number
  name: string
  email: string
  phone: string
  userType: 'Student' | 'Agent'
  enrolledOn: string // e.g. "28 May 2026"
}

/** Parse the mock date formats ("11-06-2026 02:31 PM" / "11 Jun 2026, 2:31 PM"). */
export function parseWebinarDate(s: string): Date | null {
  let m = s.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{1,2}):(\d{2}) (AM|PM)$/)
  if (m) {
    const [, dd, mm, yyyy, hh, min, ap] = m
    return new Date(
      Number(yyyy), Number(mm) - 1, Number(dd),
      (Number(hh) % 12) + (ap === 'PM' ? 12 : 0), Number(min),
    )
  }
  m = s.match(/^(\d{1,2}) (\w{3}) (\d{4}), (\d{1,2}):(\d{2}) (AM|PM)$/)
  if (m) {
    const [, dd, mon, yyyy, hh, min, ap] = m
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(mon)
    if (month < 0) return null
    return new Date(
      Number(yyyy), month, Number(dd),
      (Number(hh) % 12) + (ap === 'PM' ? 12 : 0), Number(min),
    )
  }
  return null
}

const enrolleeNames = [
  'Aarav Sharma', 'Fatima Rahman', 'Rohan Das', 'Ayesha Khan', 'Vikram Patel',
  'Nabila Haque', 'Arjun Mehta', 'Sadia Islam', 'Karim Uddin', 'Priya Nair',
  'Tanvir Ahmed', 'Meera Iyer', 'Imran Ali', 'Sneha Reddy', 'Rahul Verma',
  'Nusrat Jahan', 'Farhan Kabir', 'Ananya Bose', 'Zubair Hossain', 'Ishita Sen',
  'Mahir Chowdhury', 'Ritika Malhotra', 'Sabbir Rahman', 'Pooja Menon', 'Adnan Sami',
  'Lamia Akter', 'Dev Kapoor', 'Sharmin Sultana', 'Kunal Joshi', 'Tasnim Ferdous',
]

/**
 * Mock enrolment list, generated deterministically from the webinar id so a
 * webinar always shows the same people. Count = `enrolledUsers`.
 * Maps to (future): `webinar_enrolments` joined to `students` / `agents`.
 */
export function webinarEnrollments(w: Webinar): WebinarEnrollment[] {
  const count = w.enrolledUsers ?? 0
  const base = parseWebinarDate(w.date) ?? new Date(2026, 0, 15)
  const fmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  return Array.from({ length: count }, (_, i) => {
    const name = enrolleeNames[(w.id * 7 + i) % enrolleeNames.length]
    const email = `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@gmail.com`
    const phone = `+880 17${(10 + ((w.id + i) % 80)).toString().padStart(2, '0')} ${(
      300000 + ((w.id * 991 + i * 137) % 600000)
    ).toString()}`
    const userType: WebinarEnrollment['userType'] =
      w.audienceType === 'Agent'
        ? 'Agent'
        : w.audienceType === 'Student / Agent' && i % 3 === 2
          ? 'Agent'
          : 'Student'
    const when = new Date(base)
    when.setDate(base.getDate() - (2 + ((i * 5) % 25)))
    return { id: i + 1, name, email, phone, userType, enrolledOn: fmt.format(when) }
  })
}
