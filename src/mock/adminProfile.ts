import { allCountries } from './leads'

/**
 * "Update Your Profile" data for an Admin/Staff user (header → My profile).
 * Modeled on demo.eductrl.com/cn4/admin/auth/basic-info (reference only).
 * Persisted per user-email in localStorage so each account keeps its own copy.
 */
export interface RepeaterRow {
  [key: string]: string
}

export interface AdminProfile {
  // Basic Information
  photoName: string
  firstName: string
  lastName: string
  email: string
  mobileDial: string
  mobile: string
  whatsappDial: string
  whatsapp: string
  fatherName: string
  motherName: string
  // Personal Details
  gender: '' | 'Male' | 'Female'
  maritalStatus: '' | 'Single' | 'Married'
  citizenship: string
  dob: string
  bloodGroup: string
  about: string
  // Identity Information
  passportNumber: string
  passportIssueDate: string
  passportExpiryDate: string
  issuingCountry: string
  // Employment Details
  employeeId: string
  dateOfJoining: string
  designation: string
  department: string
  employmentType: string
  onboardingStatus: string
  employmentStatus: string
  sourceOfHire: string
  currentCtc: string
  pastExpYears: string
  pastExpMonths: string
  aadhar: string
  panTaxId: string
  dateOfExit: string
  // Contact Details
  workPhoneDial: string
  workPhone: string
  extension: string
  seatingLocation: string
  personalMobile: string
  personalEmail: string
  // Current Address
  curAddress: string
  curCountry: string
  curState: string
  curCity: string
  curPostal: string
  // Permanent Address
  permAddress: string
  permCountry: string
  permState: string
  permCity: string
  permPostal: string
  // Emergency Contact
  emgName: string
  emgEmail: string
  emgPhone: string
  emgAddress: string
  // Bank Details
  bankAccount: string
  bankHolder: string
  bankName: string
  bankSortCode: string
  branchName: string
  // VISA Information
  visaNumber: string
  visaExpiry: string
  entryClearance: string
  brp: string
  // Right To Work
  shareCode: string
  shareCodeEntry: string
  shareCodeExpiry: string
  rwcCheckDate: string
  rwcFileName: string
  // Repeaters
  workExperience: RepeaterRow[]
  education: RepeaterRow[]
  dependents: RepeaterRow[]
  // Documents (mock — filenames only)
  docPassport: string
  docAadhar: string
  docResume: string
  docPanTax: string
  additionalDocs: RepeaterRow[]
}

/** Option lists for the profile selects. */
export const dialCodes = ['+880', '+91', '+1', '+44', '+61', '+971', '+49', '+7']
export const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
export const profileCountries = allCountries
export const departments = ['Admissions', 'Counselling', 'Marketing', 'Finance', 'Operations', 'IT', 'HR', 'Front Desk']
export const designations = ['Super Admin', 'Branch Manager', 'Counsellor', 'Admission Officer', 'Front Desk', 'Accountant', 'Marketing Executive']
export const employmentTypes = ['Full Time', 'Part Time', 'Contract', 'Internship', 'Consultant']
export const onboardingStatuses = ['Not Started', 'In Progress', 'Completed']
export const employmentStatuses = ['Active', 'Probation', 'On Leave', 'Notice Period', 'Resigned', 'Terminated']
export const seatingLocations = ['Dhaka HQ', 'Chattogram Branch', 'Sylhet Branch', 'Khulna Branch', 'Remote']

/** Split a display name into first / last for seeding. */
function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/)
  return { first: parts[0] ?? '', last: parts.slice(1).join(' ') }
}

/** A blank profile seeded from the signed-in user's name/email. */
export function emptyProfile(name: string, email: string): AdminProfile {
  const { first, last } = splitName(name || 'Admin')
  return {
    photoName: '',
    firstName: first,
    lastName: last,
    email,
    mobileDial: '+880',
    mobile: '',
    whatsappDial: '+880',
    whatsapp: '',
    fatherName: '',
    motherName: '',
    gender: '',
    maritalStatus: '',
    citizenship: '',
    dob: '',
    bloodGroup: '',
    about: '',
    passportNumber: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    issuingCountry: '',
    employeeId: '',
    dateOfJoining: '',
    designation: '',
    department: '',
    employmentType: '',
    onboardingStatus: '',
    employmentStatus: '',
    sourceOfHire: '',
    currentCtc: '',
    pastExpYears: '',
    pastExpMonths: '',
    aadhar: '',
    panTaxId: '',
    dateOfExit: '',
    workPhoneDial: '+880',
    workPhone: '',
    extension: '',
    seatingLocation: '',
    personalMobile: '',
    personalEmail: '',
    curAddress: '',
    curCountry: '',
    curState: '',
    curCity: '',
    curPostal: '',
    permAddress: '',
    permCountry: '',
    permState: '',
    permCity: '',
    permPostal: '',
    emgName: '',
    emgEmail: '',
    emgPhone: '',
    emgAddress: '',
    bankAccount: '',
    bankHolder: '',
    bankName: '',
    bankSortCode: '',
    branchName: '',
    visaNumber: '',
    visaExpiry: '',
    entryClearance: '',
    brp: '',
    shareCode: '',
    shareCodeEntry: '',
    shareCodeExpiry: '',
    rwcCheckDate: '',
    rwcFileName: '',
    workExperience: [],
    education: [],
    dependents: [],
    docPassport: '',
    docAadhar: '',
    docResume: '',
    docPanTax: '',
    additionalDocs: [],
  }
}

const keyFor = (email: string) => `unidest-profile-${email || 'default'}`

export function loadAdminProfile(name: string, email: string): AdminProfile {
  const base = emptyProfile(name, email)
  try {
    const raw = localStorage.getItem(keyFor(email))
    if (raw) return { ...base, ...(JSON.parse(raw) as Partial<AdminProfile>) }
  } catch {
    // ignore — return the seeded blank
  }
  return base
}

export function saveAdminProfile(email: string, profile: AdminProfile) {
  try {
    localStorage.setItem(keyFor(email), JSON.stringify(profile))
  } catch {
    // storage blocked — stays in memory for the session
  }
}
