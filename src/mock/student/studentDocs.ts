// Document requirements for the "Study Abroad Apply → Documents" tab, modeled
// on demo.eductrl.com/cn4/overseas/docs. The office defines a set of named
// document requirements (grouped into Academic / Tests / Other); the student
// uploads a file per requirement. Uploaded file names persist to localStorage
// keyed by student id + requirement key.
// Docs: docs/superpowers/mock-data/student.md.

export interface DocRequirement {
  key: string
  title: string
  /** Human-readable allowed types, e.g. "pdf, docx, jpg, png". */
  allowedTypes: string
  /** `accept` attribute for the file input. */
  accept: string
  notes?: string
  required?: boolean
  multiple?: boolean
  maxFiles?: number
}

/** Section 1 — Academic Certificates & Document (each file ≤ 2 MB). */
export const ACADEMIC_DOCS: DocRequirement[] = [
  { key: 'ssc-cert', title: 'Class 10th/SSC Certificate', allowedTypes: 'pdf, docx, jpg, png', accept: '.pdf,.docx,.jpg,.png' },
  { key: 'ssc-marks', title: 'Class 10th/SSC Marks Sheet', allowedTypes: 'pdf, docx, jpg, png', accept: '.pdf,.docx,.jpg,.png' },
  { key: 'hsc-cert', title: 'Class 12th/+2/HSC Certificate', allowedTypes: 'pdf, docx, jpg, png', accept: '.pdf,.docx,.jpg,.png' },
  { key: 'hsc-marks', title: 'Class 12th/+2/HSC Marks Sheet', allowedTypes: 'pdf, docx, jpg, png', accept: '.pdf,.docx,.jpg,.png' },
  { key: 'bachelor-cert', title: 'Bachelor Degree Certificate', allowedTypes: 'pdf, docx, jpg, png', accept: '.pdf,.docx,.jpg,.png' },
  { key: 'bachelor-transcript', title: 'Bachelor Transcript / Marks Sheet', allowedTypes: 'pdf, docx, jpg, png', accept: '.pdf,.docx,.jpg,.png' },
  { key: 'passport', title: 'Passport', allowedTypes: 'pdf, jpg, png', accept: '.pdf,.jpg,.png', required: true },
]

/** Section 2 — Tests / English Certificates (pdf only, rendered as a grid). */
export const TEST_DOCS: DocRequirement[] = [
  { key: 'ielts', title: 'IELTS', allowedTypes: 'pdf', accept: '.pdf' },
  { key: 'toefl', title: 'TOEFL', allowedTypes: 'pdf', accept: '.pdf' },
  { key: 'pte', title: 'PTE', allowedTypes: 'pdf', accept: '.pdf' },
  { key: 'duolingo', title: 'Duolingo', allowedTypes: 'pdf', accept: '.pdf' },
  { key: 'gre', title: 'GRE', allowedTypes: 'pdf', accept: '.pdf' },
  { key: 'gmat', title: 'GMAT', allowedTypes: 'pdf', accept: '.pdf' },
]

/** Section 3 — SOP / LOR / CV. */
export const OTHER_DOCS: DocRequirement[] = [
  { key: 'sop', title: 'Statement of Purpose (SOP)', allowedTypes: 'pdf, docx', accept: '.pdf,.docx' },
  { key: 'lor', title: 'Letter of Recommendation (LOR)', allowedTypes: 'pdf, docx', accept: '.pdf,.docx', required: true, multiple: true, maxFiles: 3 },
  { key: 'cv', title: 'CV', allowedTypes: 'pdf, doc, docx', accept: '.pdf,.doc,.docx', required: true, notes: 'Upload CV (without course preference)' },
]

/* ---- Uploaded-file persistence (file names only, keyed by student) ---- */

const KEY = 'unidest-student-docs'

/** All uploaded file names for a student, as { requirementKey: fileNames[] }. */
export function loadDocUploads(studentId: number): Record<string, string[]> {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return all[studentId] ?? {}
  } catch {
    return {}
  }
}

function persist(studentId: number, uploads: Record<string, string[]>) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    all[studentId] = uploads
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // Storage blocked — uploads stay in-memory for this session.
  }
}

/** Set the uploaded file list for one requirement; returns the new map. */
export function setDocUpload(
  studentId: number,
  key: string,
  files: string[],
): Record<string, string[]> {
  const uploads = { ...loadDocUploads(studentId) }
  if (files.length) uploads[key] = files
  else delete uploads[key]
  persist(studentId, uploads)
  return uploads
}

/* ---- Per-course document rows (driven by Course Preferences) ---- */

export interface CourseDocRow {
  course: string
  university: string
}

/**
 * The student's selected programs (from the Course Preferences tab store),
 * used to render the per-course CV upload table. Reads the same
 * `unidest-lead-programs` store keyed by the person id.
 */
export function loadCourseRows(personId: number): CourseDocRow[] {
  try {
    const all = JSON.parse(localStorage.getItem('unidest-lead-programs') ?? '{}')
    const list = Array.isArray(all[personId]) ? all[personId] : []
    return list.map((p: { course?: string; university?: string }) => ({
      course: p.course ?? '--',
      university: p.university ?? '--',
    }))
  } catch {
    return []
  }
}
