// Document requirements for the "Study Abroad Apply → Documents" tab, modeled
// on demo.eductrl.com/cn4/overseas/docs. The office defines a set of named
// document requirements (grouped into Academic / Tests / Other); the student
// uploads a file per requirement. Uploaded file names persist to localStorage
// keyed by student id + requirement key.
// Docs: docs/superpowers/mock-data/student.md.

export interface DocRequirement {
  key: string
  title: string
  /** Human-readable allowed types, e.g. "pdf, docx, jpg, png". Blank = don't show the line. */
  allowedTypes?: string
  /** `accept` attribute for the file input. */
  accept: string
  notes?: string
  required?: boolean
  multiple?: boolean
  maxFiles?: number
}

/** A named group of document requirements, rendered as one table section. */
export interface DocGroup {
  title: string
  requirements: DocRequirement[]
}

/**
 * The document requirement groups, in display order — mirrors the reference
 * "Documents / Certificates" tab (Academic → Tests → Passport/LOR/Other). Each
 * group renders as a two-column table (Document | Upload). The per-course
 * SOP / Essay / CV tables are handled separately (they read Course Preferences).
 */
export const DOC_GROUPS: DocGroup[] = [
  {
    title: 'Academic Certificates',
    requirements: [
      { key: 'ssc-cert', title: 'Class 10th/SSC Certificate', accept: '.pdf,.docx,.jpg,.png', required: true },
      { key: 'ssc-marks', title: 'Class 10th/SSC Marks Sheet', accept: '.pdf,.docx,.jpg,.png', required: true },
      { key: 'hsc-cert', title: 'Class 12th/+2/HSC Certificate', accept: '.pdf,.docx,.jpg,.png', required: true },
      { key: 'hsc-marks', title: 'Class 12th/+2/HSC Marks Sheet', accept: '.pdf,.docx,.jpg,.png', required: true },
      { key: 'bachelor-cert', title: 'Bachelor Degree Certificate', allowedTypes: '.pdf, .docx, .jpg, .png', accept: '.pdf,.docx,.jpg,.png' },
      { key: 'bachelor-transcript', title: 'Bachelor Transcript / Marks Sheet', allowedTypes: '.doc, .docx, .png, .zip', accept: '.doc,.docx,.png,.zip', multiple: true, maxFiles: 2 },
      { key: 'diploma', title: 'Diploma Certificate', allowedTypes: '.pdf, .doc, .jpg', accept: '.pdf,.doc,.jpg' },
      { key: 'medium-cert', title: 'Medium of Instruction', allowedTypes: '.pdf, .doc, .docx', accept: '.pdf,.doc,.docx' },
      { key: 'high-school-cert', title: 'High School Certificates', allowedTypes: '.pdf, .jpg, .png', accept: '.pdf,.jpg,.png' },
    ],
  },
  {
    title: 'Tests/English Certificates',
    requirements: [
      { key: 'ielts', title: 'IELTS', accept: '.pdf' },
      { key: 'pte', title: 'PTE', accept: '.pdf' },
      { key: 'gre', title: 'GRE', accept: '.pdf' },
      { key: 'gmat', title: 'GMAT', accept: '.pdf' },
      { key: 'toefl', title: 'TOEFL', accept: '.pdf' },
      { key: 'duolingo', title: 'Duolingo', accept: '.pdf' },
    ],
  },
  {
    title: 'Passport, LOR, Experience Letters, Other Documents',
    requirements: [
      { key: 'passport', title: 'Passport', accept: '.pdf,.jpg,.png', required: true, multiple: true, maxFiles: 3, notes: 'Multiple files allowed. (Maximum 3 files)' },
      { key: 'photo', title: 'Student Photograph', allowedTypes: '.pdf, .jpg, .jpeg', accept: '.pdf,.jpg,.jpeg', notes: 'Allowed formats (.pdf, .jpg, .jpeg)' },
      { key: 'lor', title: 'Letter of Recommendation (LOR)', accept: '.pdf,.docx', required: true, multiple: true, maxFiles: 3, notes: 'Multiple files allowed. (Maximum 3 files)' },
      { key: 'experience', title: 'Experience Letters', accept: '.pdf,.docx,.jpg,.png', multiple: true, maxFiles: 6, notes: 'Multiple files allowed (6 files)' },
      { key: 'other-docs', title: 'Other Certificates/Documents', accept: '.pdf,.docx,.jpg,.png', multiple: true, maxFiles: 6, notes: 'Multiple files allowed (6 files)' },
    ],
  },
]

/**
 * Per-course document tables (SOP / Essay / CV). Each reads the student's
 * Course Preferences and renders a Course | University | Upload row per program.
 * `key` prefixes the per-course upload keys so they never collide.
 */
export interface CourseDocSection {
  title: string
  key: string
  label: string // upload column header, e.g. "Upload SOP"
  accept: string
  required?: boolean
}

export const COURSE_DOC_SECTIONS: CourseDocSection[] = [
  { title: 'SOP', key: 'sop', label: 'Upload SOP', accept: '.pdf,.doc,.docx', required: true },
  { title: 'Essay', key: 'essay', label: 'Upload Essay', accept: '.pdf,.doc,.docx' },
  { title: 'CV', key: 'cv', label: 'Upload CV', accept: '.pdf,.doc,.docx', required: true },
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

/* ---- "Mark all documents upload completed" flag (per student) ---- */

const DONE_KEY = 'unidest-student-docs-done'

export function loadDocsCompleted(studentId: number): boolean {
  try {
    const all = JSON.parse(localStorage.getItem(DONE_KEY) ?? '{}')
    return !!all[studentId]
  } catch {
    return false
  }
}

export function setDocsCompleted(studentId: number, done: boolean) {
  try {
    const all = JSON.parse(localStorage.getItem(DONE_KEY) ?? '{}')
    all[studentId] = done
    localStorage.setItem(DONE_KEY, JSON.stringify(all))
  } catch {
    // Storage blocked — the flag stays in-memory for this session.
  }
}
