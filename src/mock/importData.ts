// Mock data + engine for the Import module, modeled on the EduCtrl demo
// (/admin/import-export/students) — a tabbed CSV importer.
//
// Connected to existing modules: this is the ONLY place the app bulk-creates
// records, and every tab writes straight into a real module — Leads (addLead),
// Students, Staff (addStaff) and Course Management (addCourse). Sample files are
// generated from each module's real columns, uploads are parsed + validated in
// the browser, and a successful import appends live rows you can immediately see
// in that module. Docs: docs/superpowers/mock-data/adminpage.md.

import { addLead, leadStatuses, leadStaff, studyLevels, type Lead } from './leads'
import { students, studentStatuses, studentSources, type Student } from './students'
import { addStaff, staffRoles, staffStatuses, staffBranches, type StaffMember } from './staff'
import { addCourse, type ManagedCourse } from './courseManagement'
import { studyAreas } from './courseFinder'

/* ------------------------------------------------------------------ */
/* Small date helpers (shared shape with the other modules)            */
/* ------------------------------------------------------------------ */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const today = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
const shortDate = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`
}
const leadColor = (label: string) => leadStatuses.find((x) => x.label === label)?.color ?? '#06b6d4'
const studentColor = (label: string) => studentStatuses.find((x) => x.label === label)?.color ?? '#0e7490'

/* ------------------------------------------------------------------ */
/* Entity config                                                       */
/* ------------------------------------------------------------------ */

export interface ImportColumn {
  header: string
  field: string
  required?: boolean
  sample: string
  /** Valid values (case-insensitive) — surfaced as a rule + validated. */
  enumValues?: readonly string[]
}

export interface ImportOptions {
  branch?: string
  autoPassword?: boolean
  /** Staff member the imported records are assigned to (leads). */
  assignTo?: string
  /** Set every imported record's next follow-up to today (leads). */
  followupToday?: boolean
}

export interface ImportEntity {
  key: 'leads' | 'students' | 'staff' | 'courses'
  label: string
  tabLabel: string
  fileNoun: string
  route: string
  /** Live record count from the connected module. */
  count: () => number
  columns: ImportColumn[]
  /** Show an "Assign to Branch" dropdown. */
  branchOption: boolean
  /** Show the "Auto-generate password & email" checkbox. */
  passwordOption: boolean
  /** Show an "Assign imported leads to" (staff) dropdown + the choices. */
  staffOptions?: readonly string[]
  /** Show a "Set next follow-up to today's date" checkbox. */
  followupOption?: boolean
  /** Append one validated record to the connected module. */
  importRecord: (rec: Record<string, string>, opts: ImportOptions) => void
}

export const importEntities: ImportEntity[] = [
  {
    key: 'leads',
    label: 'Import Leads',
    tabLabel: 'Leads',
    fileNoun: 'lead',
    route: '/leads',
    count: () => leadsCount(),
    branchOption: true,
    passwordOption: false,
    staffOptions: leadStaff,
    followupOption: true,
    columns: [
      { header: 'First name', field: 'name', required: true, sample: 'Jamie' },
      { header: 'Email', field: 'email', required: true, sample: 'jamie@example.com' },
      { header: 'Phone', field: 'phone', sample: '+880 1700 000000' },
      { header: 'Branch', field: 'branch', sample: 'Dhaka', enumValues: staffBranches },
      { header: 'Country Interested', field: 'country', sample: 'United Kingdom' },
      { header: 'Study Level', field: 'studyLevel', sample: 'Masters', enumValues: studyLevels },
      { header: 'Source', field: 'source', sample: 'Website' },
    ],
    importRecord: (rec, opts) => {
      addLead({
        name: rec.name,
        email: rec.email,
        emailDate: shortDate(),
        phone: rec.phone || '',
        phoneNote: 'Imported',
        whatsapp: false,
        leadAgeDays: 0,
        branch: opts.branch || rec.branch || 'Dhaka',
        status: 'New Lead',
        statusColor: leadColor('New Lead'),
        assignedTo: opts.assignTo || null,
        created: today(),
        nextFollowup: opts.followupToday ? today() : null,
        countryInterested: rec.country || '',
        studyLevel: rec.studyLevel || undefined,
        source: rec.source || 'Import',
      } as Omit<Lead, 'id'>)
    },
  },
  {
    key: 'students',
    label: 'Import Students',
    tabLabel: 'Students',
    fileNoun: 'student',
    route: '/students',
    count: () => students.length,
    branchOption: true,
    passwordOption: true,
    columns: [
      { header: 'First name', field: 'name', required: true, sample: 'Alex' },
      { header: 'Email', field: 'email', required: true, sample: 'alex@example.com' },
      { header: 'Phone', field: 'phone', sample: '+880 1700 000000' },
      { header: 'Branch', field: 'branch', sample: 'Dhaka', enumValues: staffBranches },
      { header: 'Country Interested', field: 'country', sample: 'Canada' },
      { header: 'Study Level', field: 'studyLevel', sample: 'Bachelors', enumValues: studyLevels },
      { header: 'Course', field: 'course', sample: 'Computer Science' },
      { header: 'University', field: 'university', sample: 'University of Toronto' },
      { header: 'Intake', field: 'intake', sample: 'September 2026' },
      { header: 'Source', field: 'source', sample: 'Website', enumValues: studentSources },
    ],
    importRecord: (rec, opts) => {
      const student: Student = {
        id: Math.max(0, ...students.map((s) => s.id)) + 1,
        studentNo: `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        name: rec.name,
        email: rec.email,
        emailDate: shortDate(),
        phone: rec.phone || '',
        phoneNote: 'Imported',
        branch: opts.branch || rec.branch || 'Dhaka',
        status: 'Active',
        statusColor: studentColor('Active'),
        assignedTo: null,
        created: today(),
        countryOfResidence: '',
        countryInterested: rec.country || '',
        studyLevel: rec.studyLevel || '',
        course: rec.course || '',
        intake: rec.intake || '',
        university: rec.university || null,
        applications: 0,
        source: rec.source || 'Import',
      }
      students.unshift(student)
    },
  },
  {
    key: 'staff',
    label: 'Import Staff',
    tabLabel: 'Staff',
    fileNoun: 'staff member',
    route: '/staff',
    count: () => staffCount(),
    branchOption: true,
    passwordOption: true,
    columns: [
      { header: 'Name', field: 'name', required: true, sample: 'Priya Sharma' },
      { header: 'Email', field: 'email', required: true, sample: 'priya@globaled.app' },
      { header: 'Phone', field: 'phone', sample: '+880 1700 000000' },
      { header: 'Role', field: 'role', sample: 'Counsellor', enumValues: staffRoles },
      { header: 'Branch', field: 'branch', sample: 'Dhaka', enumValues: staffBranches },
      { header: 'Status', field: 'status', sample: 'Active', enumValues: staffStatuses },
    ],
    importRecord: (rec, opts) => {
      addStaff({
        name: rec.name,
        email: rec.email,
        phone: rec.phone || '',
        role: (staffRoles.includes(rec.role as never) ? rec.role : 'Counsellor') as StaffMember['role'],
        branch: opts.branch || rec.branch || 'Dhaka',
        status: (rec.status === 'Inactive' ? 'Inactive' : 'Active') as StaffMember['status'],
        joined: today(),
      } as Omit<StaffMember, 'id'>)
    },
  },
  {
    key: 'courses',
    label: 'Import University Course Data',
    tabLabel: 'Course Data',
    fileNoun: 'course',
    route: '/courses',
    count: () => coursesCount(),
    branchOption: false,
    passwordOption: false,
    columns: [
      { header: 'Title', field: 'title', required: true, sample: 'MSc Data Science' },
      { header: 'University', field: 'university', required: true, sample: 'University of Toronto' },
      { header: 'Country', field: 'country', sample: 'Canada' },
      { header: 'City', field: 'city', sample: 'Toronto' },
      { header: 'Study Level', field: 'studyLevel', sample: 'Masters', enumValues: studyLevels },
      { header: 'Study Area', field: 'studyArea', sample: 'IT', enumValues: studyAreas },
      { header: 'Duration Years', field: 'duration', sample: '2' },
      { header: 'Tuition Fee', field: 'tuition', sample: 'USD 42000' },
      { header: 'Intakes', field: 'intakes', sample: 'Jan;Sep' },
    ],
    importRecord: (rec) => {
      const durationYears = rec.duration ? Number(rec.duration) || null : null
      addCourse({
        title: rec.title,
        university: rec.university,
        city: rec.city || '',
        country: rec.country || '',
        studyLevel: rec.studyLevel || 'Masters',
        studyArea: rec.studyArea || 'IT',
        disciplineArea: '',
        durationYears,
        intakes: rec.intakes ? rec.intakes.split(/[;,]/).map((s) => s.trim()).filter(Boolean) : [],
        tuitionFee: rec.tuition || null,
        applicationFee: null,
        commission: '',
        ielts: null,
        ieltsNoBand: null,
        toefl: null,
        pte: null,
        gre: null,
        gmat: null,
        logoClass: 'from-slate-700 to-slate-500',
        status: 'Enabled',
        concentration: '',
        durationMonths: durationYears ? durationYears * 12 : null,
        description: 'Imported via bulk course import.',
        entryRequirements: '',
        websiteUrl: '',
      } as Omit<ManagedCourse, 'id'>)
    },
  },
]

// Counts are read live; `leads`/`staff`/`courses` are localStorage-backed so we
// re-read them through their arrays' length via the modules that own them.
import { leads } from './leads'
import { staff } from './staff'
import { courses } from './courseManagement'
const leadsCount = () => leads.length
const staffCount = () => staff.length
const coursesCount = () => courses.length

export const getEntity = (key: string) => importEntities.find((e) => e.key === key)

/* ------------------------------------------------------------------ */
/* CSV parsing + validation                                            */
/* ------------------------------------------------------------------ */

/** Minimal RFC-4180-ish CSV parser (handles quoted fields + commas/newlines). */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  const src = text.replace(/\r\n?/g, '\n')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += c
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n') {
      row.push(field); rows.push(row); field = ''; row = []
    } else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  const nonEmpty = rows.filter((r) => r.some((v) => v.trim() !== ''))
  const headers = (nonEmpty.shift() ?? []).map((h) => h.trim())
  return { headers, rows: nonEmpty }
}

export interface PreviewRow {
  values: Record<string, string> // keyed by field
  errors: string[]
  valid: boolean
}

export interface ImportPreview {
  headerOk: boolean
  missingHeaders: string[]
  rows: PreviewRow[]
  validCount: number
  errorCount: number
}

/** Map + validate parsed CSV against an entity's column spec. */
export function buildPreview(entity: ImportEntity, parsed: { headers: string[]; rows: string[][] }): ImportPreview {
  const required = entity.columns.filter((c) => c.required)
  const missingHeaders = required
    .filter((c) => !parsed.headers.some((h) => h.toLowerCase() === c.header.toLowerCase()))
    .map((c) => c.header)

  const idx: Record<string, number> = {}
  entity.columns.forEach((c) => {
    idx[c.field] = parsed.headers.findIndex((h) => h.toLowerCase() === c.header.toLowerCase())
  })

  const rows: PreviewRow[] = parsed.rows.map((raw) => {
    const values: Record<string, string> = {}
    const errors: string[] = []
    entity.columns.forEach((c) => {
      const v = idx[c.field] >= 0 ? (raw[idx[c.field]] ?? '').trim() : ''
      values[c.field] = v
      if (c.required && !v) errors.push(`${c.header} is required`)
      if (v && c.enumValues && !c.enumValues.some((e) => e.toLowerCase() === v.toLowerCase())) {
        errors.push(`Invalid ${c.header}: "${v}"`)
      }
    })
    return { values, errors, valid: errors.length === 0 }
  })

  return {
    headerOk: missingHeaders.length === 0,
    missingHeaders,
    rows,
    validCount: rows.filter((r) => r.valid).length,
    errorCount: rows.filter((r) => !r.valid).length,
  }
}

/** CSV sample string built from the entity's real columns + one example row. */
export function buildSampleCsv(entity: ImportEntity): string {
  const header = entity.columns.map((c) => c.header)
  const example = entity.columns.map((c) => c.sample)
  const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  return [header, example].map((r) => r.map(cell).join(',')).join('\n')
}

/** Append every valid row to the connected module; returns how many landed. */
export function runImport(entity: ImportEntity, preview: ImportPreview, opts: ImportOptions): number {
  const valid = preview.rows.filter((r) => r.valid)
  valid.forEach((r) => entity.importRecord(r.values, opts))
  return valid.length
}
