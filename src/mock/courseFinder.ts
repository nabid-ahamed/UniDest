// Mock data for the University Course Finder page (modeled on the EduCtrl demo).
// Docs: docs/superpowers/mock-data/adminpage.md. Replace with real API in Phase 2.

export interface FinderCourse {
  id: number
  title: string
  university: string
  city: string
  country: string
  studyLevel: string
  studyArea: string
  disciplineArea: string
  /** Duration in years; null renders "--" and matches only the "Any" bucket. */
  durationYears: number | null
  intakes: string[] // months, e.g. ['Jan', 'Mar']
  tuitionFee: string | null // e.g. "USD 100000"
  applicationFee: string | null
  commission: string // shown inside the commission modal
  ielts: number | null
  ieltsNoBand: number | null
  toefl: number | null
  pte: number | null
  gre: number | null
  gmat: number | null
  /** Tailwind gradient for the logo placeholder box. */
  logoClass: string
}

export const finderStudyLevels = [
  'Undergraduate',
  'Postgraduate',
  'PhD',
  'Foundation',
  'UG Diploma/ Certificate/ Associate Degree',
  'PG Diploma/Certificate',
  'UG+PG (Accelerated) Degree',
  'High School Diploma',
  'HND',
  'Nursing',
  'Short Term Programs',
]

export const studyAreas = [
  'Engineering',
  'IT',
  'Commerce, Business and Administration',
  'Health',
  'Law',
  'Architecture and Building',
  'Mathematics',
  'Education',
]

/** Discipline options per study area (demo's dependent dropdown). */
export const disciplineAreas: Record<string, string[]> = {
  Engineering: ['Civil Engineering', 'Electrical Engineering', 'Mechanical Engineering'],
  IT: ['Software Engineering', 'Data Science', 'Cybersecurity', 'Game Design'],
  'Commerce, Business and Administration': ['Accounting', 'Finance', 'Management', 'Marketing'],
  Health: ['Public Health', 'Nursing', 'Pharmacy'],
  Law: ['International Law', 'Corporate Law'],
  'Architecture and Building': ['Architecture', 'Construction Management'],
  Mathematics: ['Applied Mathematics', 'Statistics'],
  Education: ['Early Childhood', 'TESOL'],
}

export const durationBuckets = ['Any', '0-1 year', '1-2 years', '2-3 years', '3-4 years', '4+ years']

export const sortOptions = [
  'Sort By',
  'IELTS Score Low to High',
  'IELTS Score High to Low',
  'Course Name',
  'Course Fee Low to High',
  'Course Fee High to Low',
]

export const intakeMonths = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const finderPageSizes = [25, 50, 100, 200]

/** Numeric fee for sorting; null sorts last. */
export function feeAmount(c: FinderCourse): number | null {
  const m = c.tuitionFee?.match(/[\d,]+/)
  return m ? Number(m[0].replace(/,/g, '')) : null
}

/** True when the course duration falls in the picked bucket. */
export function inDurationBucket(years: number | null, bucket: string): boolean {
  if (bucket === 'Any') return true
  if (years == null) return false
  if (bucket === '0-1 year') return years <= 1
  if (bucket === '1-2 years') return years > 1 && years <= 2
  if (bucket === '2-3 years') return years > 2 && years <= 3
  if (bucket === '3-4 years') return years > 3 && years <= 4
  return years > 4
}

const g = {
  navy: 'from-blue-900 to-blue-700',
  crimson: 'from-rose-900 to-rose-700',
  green: 'from-emerald-900 to-emerald-700',
  gold: 'from-amber-700 to-amber-500',
  violet: 'from-violet-900 to-violet-700',
  teal: 'from-teal-900 to-teal-700',
  slate: 'from-slate-800 to-slate-600',
}

export const finderCourses: FinderCourse[] = [
  { id: 34, title: 'Bachelor of Computer Science', university: 'University of Newcastle', city: 'Newcastle', country: 'Australia', studyLevel: 'Undergraduate', studyArea: 'IT', disciplineArea: 'Software Engineering', durationYears: 3, intakes: ['Jan', 'Mar'], tuitionFee: 'USD 100000', applicationFee: null, commission: 'USD 40000', ielts: 6.0, ieltsNoBand: 5.5, toefl: 78, pte: 54, gre: null, gmat: null, logoClass: g.navy },
  { id: 36, title: 'Animation, Game Design', university: 'Kent State University', city: 'Kent, Ohio', country: 'United States', studyLevel: 'Undergraduate', studyArea: 'IT', disciplineArea: 'Game Design', durationYears: 4, intakes: ['Aug'], tuitionFee: 'USD 32000', applicationFee: 'USD 70', commission: '10% of first year fee', ielts: 6.0, ieltsNoBand: 5.5, toefl: 71, pte: 50, gre: null, gmat: null, logoClass: g.gold },
  { id: 38, title: 'Game Design and Simulation Development', university: 'Marshall University', city: 'Huntington, West Virginia', country: 'United States', studyLevel: 'Undergraduate', studyArea: 'IT', disciplineArea: 'Game Design', durationYears: 4, intakes: ['Jan', 'Aug'], tuitionFee: 'USD 20000', applicationFee: 'USD 40', commission: 'USD 2000', ielts: 6.5, ieltsNoBand: 6.0, toefl: 80, pte: 58, gre: null, gmat: null, logoClass: g.green },
  { id: 39, title: 'Esports Performance and Health, Game Studies, General', university: 'University of New Haven', city: 'West Haven, Connecticut', country: 'United States', studyLevel: 'Undergraduate', studyArea: 'Health', disciplineArea: 'Public Health', durationYears: 4, intakes: ['Aug'], tuitionFee: 'USD 45000', applicationFee: 'USD 50', commission: 'USD 4500', ielts: 6.0, ieltsNoBand: 5.5, toefl: 75, pte: 53, gre: null, gmat: null, logoClass: g.crimson },
  { id: 41, title: 'MSc Computer Science', university: 'University of Manchester', city: 'Manchester', country: 'United Kingdom', studyLevel: 'Postgraduate', studyArea: 'IT', disciplineArea: 'Software Engineering', durationYears: 1, intakes: ['Sep'], tuitionFee: 'GBP 31000', applicationFee: 'GBP 60', commission: 'GBP 3100', ielts: 6.5, ieltsNoBand: 6.0, toefl: 90, pte: 62, gre: null, gmat: null, logoClass: g.violet },
  { id: 42, title: 'MSc Data Science', university: 'University of Birmingham', city: 'Birmingham', country: 'United Kingdom', studyLevel: 'Postgraduate', studyArea: 'IT', disciplineArea: 'Data Science', durationYears: 1, intakes: ['Sep', 'Jan'], tuitionFee: 'GBP 28500', applicationFee: null, commission: 'GBP 2850', ielts: 6.5, ieltsNoBand: 6.0, toefl: 88, pte: 60, gre: null, gmat: null, logoClass: g.navy },
  { id: 44, title: 'MBA Business Management', university: 'University of Toronto', city: 'Toronto', country: 'Canada', studyLevel: 'Postgraduate', studyArea: 'Commerce, Business and Administration', disciplineArea: 'Management', durationYears: 2, intakes: ['Sep'], tuitionFee: 'CAD 95000', applicationFee: 'CAD 125', commission: 'CAD 9500', ielts: 7.0, ieltsNoBand: 6.5, toefl: 100, pte: 68, gre: null, gmat: 600, logoClass: g.slate },
  { id: 45, title: 'PG Diploma Project Management', university: 'Conestoga College', city: 'Kitchener, Ontario', country: 'Canada', studyLevel: 'PG Diploma/Certificate', studyArea: 'Commerce, Business and Administration', disciplineArea: 'Management', durationYears: 1, intakes: ['Jan', 'May', 'Sep'], tuitionFee: 'CAD 18500', applicationFee: 'CAD 100', commission: 'CAD 1850', ielts: 6.5, ieltsNoBand: 6.0, toefl: 88, pte: 60, gre: null, gmat: null, logoClass: g.teal },
  { id: 47, title: 'Master of Engineering (Electrical)', university: 'University of Melbourne', city: 'Melbourne', country: 'Australia', studyLevel: 'Postgraduate', studyArea: 'Engineering', disciplineArea: 'Electrical Engineering', durationYears: 2, intakes: ['Feb', 'Jul'], tuitionFee: 'AUD 52000', applicationFee: 'AUD 100', commission: 'AUD 5200', ielts: 6.5, ieltsNoBand: 6.0, toefl: 79, pte: 58, gre: null, gmat: null, logoClass: g.navy },
  { id: 48, title: 'Master of Public Health', university: 'Monash University', city: 'Melbourne', country: 'Australia', studyLevel: 'Postgraduate', studyArea: 'Health', disciplineArea: 'Public Health', durationYears: 2, intakes: ['Feb', 'Jul'], tuitionFee: 'AUD 47000', applicationFee: null, commission: '12% of first year fee', ielts: 6.5, ieltsNoBand: 6.0, toefl: 79, pte: 58, gre: null, gmat: null, logoClass: g.green },
  { id: 51, title: 'BSc (Hons) Civil Engineering', university: 'Technical University of Munich', city: 'Munich', country: 'Germany', studyLevel: 'Undergraduate', studyArea: 'Engineering', disciplineArea: 'Civil Engineering', durationYears: 3, intakes: ['Oct'], tuitionFee: 'EUR 3000', applicationFee: null, commission: 'EUR 300', ielts: 6.5, ieltsNoBand: 6.0, toefl: 88, pte: 60, gre: null, gmat: null, logoClass: g.slate },
  { id: 52, title: 'LLM International Law', university: 'University of Auckland', city: 'Auckland', country: 'New Zealand', studyLevel: 'Postgraduate', studyArea: 'Law', disciplineArea: 'International Law', durationYears: 1, intakes: ['Mar', 'Jul'], tuitionFee: 'NZD 42000', applicationFee: null, commission: 'NZD 4200', ielts: 6.5, ieltsNoBand: 6.0, toefl: 90, pte: 62, gre: null, gmat: null, logoClass: g.violet },
  { id: 54, title: 'PhD Applied Mathematics', university: 'Arizona State University', city: 'Tempe, Arizona', country: 'United States', studyLevel: 'PhD', studyArea: 'Mathematics', disciplineArea: 'Applied Mathematics', durationYears: 5, intakes: ['Aug'], tuitionFee: 'USD 28000', applicationFee: 'USD 70', commission: 'USD 2800', ielts: 7.0, ieltsNoBand: 6.5, toefl: 100, pte: 68, gre: 310, gmat: null, logoClass: g.crimson },
  { id: 55, title: 'Foundation in Business', university: 'University of Manchester', city: 'Manchester', country: 'United Kingdom', studyLevel: 'Foundation', studyArea: 'Commerce, Business and Administration', disciplineArea: 'Management', durationYears: 1, intakes: ['Sep', 'Jan'], tuitionFee: 'GBP 19000', applicationFee: null, commission: 'GBP 1900', ielts: 5.5, ieltsNoBand: 5.0, toefl: 65, pte: 46, gre: null, gmat: null, logoClass: g.violet },
  { id: 57, title: 'BBA Accounting and Finance', university: 'University of Toronto', city: 'Toronto', country: 'Canada', studyLevel: 'Undergraduate', studyArea: 'Commerce, Business and Administration', disciplineArea: 'Accounting', durationYears: 4, intakes: ['Sep'], tuitionFee: 'CAD 61000', applicationFee: 'CAD 125', commission: 'CAD 6100', ielts: 6.5, ieltsNoBand: 6.0, toefl: 89, pte: 61, gre: null, gmat: null, logoClass: g.slate },
  { id: 59, title: 'MSc Cybersecurity', university: 'University of New Haven', city: 'West Haven, Connecticut', country: 'United States', studyLevel: 'Postgraduate', studyArea: 'IT', disciplineArea: 'Cybersecurity', durationYears: 2, intakes: ['Jan', 'Aug'], tuitionFee: 'USD 39000', applicationFee: 'USD 50', commission: 'USD 3900', ielts: 6.5, ieltsNoBand: 6.0, toefl: 85, pte: 59, gre: 300, gmat: null, logoClass: g.crimson },
  { id: 61, title: 'Bachelor of Nursing', university: 'University of Newcastle', city: 'Newcastle', country: 'Australia', studyLevel: 'Nursing', studyArea: 'Health', disciplineArea: 'Nursing', durationYears: 3, intakes: ['Feb'], tuitionFee: 'AUD 41000', applicationFee: null, commission: 'AUD 4100', ielts: 7.0, ieltsNoBand: 7.0, toefl: 94, pte: 65, gre: null, gmat: null, logoClass: g.navy },
  { id: 63, title: 'Master of Architecture', university: 'University of Melbourne', city: 'Melbourne', country: 'Australia', studyLevel: 'Postgraduate', studyArea: 'Architecture and Building', disciplineArea: 'Architecture', durationYears: 3, intakes: ['Feb'], tuitionFee: 'AUD 50000', applicationFee: 'AUD 100', commission: 'AUD 5000', ielts: 6.5, ieltsNoBand: 6.0, toefl: 79, pte: 58, gre: null, gmat: null, logoClass: g.navy },
  { id: 65, title: 'Graduate Certificate in TESOL', university: 'Kent State University', city: 'Kent, Ohio', country: 'United States', studyLevel: 'PG Diploma/Certificate', studyArea: 'Education', disciplineArea: 'TESOL', durationYears: 1, intakes: ['Jan', 'Aug'], tuitionFee: 'USD 15000', applicationFee: 'USD 70', commission: 'USD 1500', ielts: 6.0, ieltsNoBand: 5.5, toefl: 71, pte: 50, gre: null, gmat: null, logoClass: g.gold },
  { id: 66, title: 'High School Diploma Program', university: 'Braemar College', city: 'Toronto', country: 'Canada', studyLevel: 'High School Diploma', studyArea: 'Education', disciplineArea: 'Early Childhood', durationYears: 2, intakes: ['Sep', 'Feb'], tuitionFee: 'CAD 16500', applicationFee: 'CAD 200', commission: 'CAD 1650', ielts: null, ieltsNoBand: null, toefl: null, pte: null, gre: null, gmat: null, logoClass: g.teal },
  { id: 68, title: 'Short Term Program: Business English', university: 'University of Auckland', city: 'Auckland', country: 'New Zealand', studyLevel: 'Short Term Programs', studyArea: 'Education', disciplineArea: 'TESOL', durationYears: null, intakes: ['Jan', 'Apr', 'Jul', 'Oct'], tuitionFee: 'NZD 6500', applicationFee: null, commission: 'NZD 650', ielts: 5.0, ieltsNoBand: 4.5, toefl: 60, pte: 42, gre: null, gmat: null, logoClass: g.violet },
  { id: 70, title: 'MSc Statistics and Data Analytics', university: 'Technical University of Munich', city: 'Munich', country: 'Germany', studyLevel: 'Postgraduate', studyArea: 'Mathematics', disciplineArea: 'Statistics', durationYears: 2, intakes: ['Apr', 'Oct'], tuitionFee: 'EUR 4000', applicationFee: null, commission: 'EUR 400', ielts: 6.5, ieltsNoBand: 6.0, toefl: 88, pte: 60, gre: 305, gmat: null, logoClass: g.slate },
]

/** Countries that actually have courses, for the top search bar multi-select. */
export const finderCountries = [...new Set(finderCourses.map((c) => c.country))].sort()

/** Total course count in the "system" (the list above is one filtered page). */
export const totalFinderCourseCount = 1190
