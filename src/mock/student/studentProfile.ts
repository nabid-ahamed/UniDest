// Extended student-profile data for the "Study Abroad Apply → Profile" form.
// The Student record (mock/students.ts) holds the core identity fields; this
// store holds everything the big apply form adds (passport, addresses,
// background questions, and the repeater sections). Keyed by student id and
// persisted to localStorage so edits survive a reload.
// Docs: docs/superpowers/mock-data/student.md.

/** One row of a repeater accordion (Academic Details, Employment, …). */
export type RepeaterRow = Record<string, string>

export type YesNo = 'No' | 'Yes'

export interface StudentProfile {
  // Personal Info (extends the Student core: first/last name, email, mobile)
  middleName: string
  gender: string
  maritalStatus: string
  dob: string
  nationality: string
  citizenship: string
  countryOfEducation: string
  highestEducation: string

  // Study Preference
  studyCountryPreference: string[]
  servicesInterested: string[]

  // Current Address
  currentAddress: string
  currentCountry: string
  currentState: string
  currentCity: string
  currentPostal: string

  // Permanent Address
  sameAsCurrent: boolean
  permAddress: string
  permCountry: string
  permState: string
  permCity: string
  permPostal: string

  // Passport Information
  passportName: string
  passportNo: string
  passportIssueDate: string
  passportExpiryDate: string
  passportCountryIssued: string
  cityOfBirth: string
  countryOfBirth: string

  // Nationality
  multiCitizen: YesNo
  livingStudyingAbroad: YesNo

  // Background Info
  appliedImmigration: YesNo
  medicalCondition: YesNo
  visaRefusal: YesNo
  criminalOffence: YesNo

  // Emergency Contacts
  emergencyName: string
  emergencyRelationship: string
  emergencyPhone: string
  emergencyEmail: string
  emergencyAddress: string
  emergencyCountry: string
  emergencyState: string
  emergencyCity: string
  emergencyPostal: string

  // Collapsible repeater sections
  academicDetails: RepeaterRow[]
  tests: RepeaterRow[]
  internships: RepeaterRow[]
  employment: RepeaterRow[]
  visaHistory: RepeaterRow[]
  travelHistory: RepeaterRow[]
  familyDetails: RepeaterRow[]
}

/* ---- Option lists (dropdowns / radios) ---- */

export const genders = ['Male', 'Female', 'Other']
export const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated']
export const educationLevels = ['High School', 'Diploma', 'Bachelors', 'Masters', 'PhD']
export const servicesOptions = [
  'Admission Guidance',
  'Visa Assistance',
  'Work Visa',
  'Transport Services',
  'Accommodation',
  'IELTS Coaching',
  'Scholarship Guidance',
]

/** Empty profile — the form pre-fills core fields from the Student record. */
export function emptyProfile(): StudentProfile {
  return {
    middleName: '',
    gender: '',
    maritalStatus: '',
    dob: '',
    nationality: '',
    citizenship: '',
    countryOfEducation: '',
    highestEducation: '',
    studyCountryPreference: [],
    servicesInterested: [],
    currentAddress: '',
    currentCountry: '',
    currentState: '',
    currentCity: '',
    currentPostal: '',
    sameAsCurrent: true,
    permAddress: '',
    permCountry: '',
    permState: '',
    permCity: '',
    permPostal: '',
    passportName: '',
    passportNo: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    passportCountryIssued: '',
    cityOfBirth: '',
    countryOfBirth: '',
    multiCitizen: 'No',
    livingStudyingAbroad: 'No',
    appliedImmigration: 'No',
    medicalCondition: 'No',
    visaRefusal: 'No',
    criminalOffence: 'No',
    emergencyName: '',
    emergencyRelationship: '',
    emergencyPhone: '',
    emergencyEmail: '',
    emergencyAddress: '',
    emergencyCountry: '',
    emergencyState: '',
    emergencyCity: '',
    emergencyPostal: '',
    academicDetails: [],
    tests: [],
    internships: [],
    employment: [],
    visaHistory: [],
    travelHistory: [],
    familyDetails: [],
  }
}

const KEY = 'unidest-student-profile'

/** Load the profile for a student, merged over defaults (forward-compatible). */
export function loadStudentProfile(studentId: number): StudentProfile {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    const saved = all[studentId]
    return saved ? { ...emptyProfile(), ...saved } : emptyProfile()
  } catch {
    return emptyProfile()
  }
}

/** Persist the profile for a student. */
export function saveStudentProfile(studentId: number, profile: StudentProfile) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    all[studentId] = profile
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // Storage blocked — the edit stays in-memory for this session.
  }
}
