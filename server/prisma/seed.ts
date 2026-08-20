/**
 * Seeds the database with the same values the mock frontend uses, so demos and
 * screenshots stay identical after the API swap.
 *
 * Idempotent: every write is an `upsert` keyed on a natural unique constraint,
 * so re-running is safe. Seeded lookup rows are marked `isSystem: true` — the
 * admin UI may add rows but must not delete these (design spec §5.3).
 *
 * Run with: npx prisma db seed
 */
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL }),
})

const TENANT_ID = 1n

/** Slugify a label into a stable lookup key: "New Lead" -> "new-lead". */
const toKey = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// --- Values copied from src/mock/* so the UI renders unchanged ---------------

/** src/mock/leads.ts */
const LEAD_STATUSES = [
  { label: 'New Lead', color: '#0e7490' },
  { label: 'Contacted', color: '#1d4ed8' },
  { label: 'Counseling', color: '#6d28d9' },
  { label: 'Warm', color: '#c2410c' },
  { label: 'Cold', color: '#a16207' },
  { label: 'Registered', color: '#15803d', isWon: true },
  { label: 'Rejected', color: '#b91c1c', isLost: true },
]

/** src/mock/students.ts */
const STUDENT_STATUSES = [
  { label: 'Active', color: '#0e7490' },
  { label: 'Docs Pending', color: '#a16207' },
  { label: 'Applied', color: '#1d4ed8' },
  { label: 'Offer Received', color: '#6d28d9' },
  { label: 'Visa Applied', color: '#c2410c' },
  { label: 'Enrolled', color: '#15803d', isWon: true, isTerminal: true },
  { label: 'Inactive', color: '#475569', isTerminal: true },
  { label: 'Withdrawn', color: '#b91c1c', isTerminal: true },
]

/** src/mock/applications.ts */
const APPLICATION_STATUSES = [
  { label: 'Pending', color: '#b91c1c' },
  { label: 'Funds Under Assessment', color: '#0e7490' },
  { label: 'Admission Criteria Met', color: '#6d28d9' },
  { label: 'Payment Received', color: '#1d4ed8' },
  { label: 'Offer Letter Received', color: '#15803d', isWon: true, isTerminal: true },
  { label: 'Withdrawn', color: '#475569', isTerminal: true },
]

/**
 * src/mock/leads.ts `leadBranches`, minus the leading 'All Branch' — that is a
 * filter sentinel in the UI, not a real branch, and must not become a row.
 */
const BRANCHES = ['Dhaka', 'Chattogram', 'Sylhet', 'Khulna']

/**
 * Roles and their permissions, copied verbatim from PRESETS in
 * `src/mock/roles.ts` — that file is the definition the Roles admin screen
 * edits, so the seed must not paraphrase it. An earlier version invented ids
 * ('view-reports', 'view-invoices') that exist nowhere in the frontend, which
 * silently 403'd every route gated on the real ones.
 */
const ROLES = [
  { name: 'Super Admin', isSystem: true, permissions: ['*'] },
  // Not a staff role — the portal login for students. Kept in the same table so
  // one auth path serves everyone; `toUiRole` maps this name to 'Student',
  // which is what src/app/router.tsx gates the /portal routes on.
  // Deliberately empty: portal access is ownership-scoped, not permission-based
  // (see StudentScopeService and the @AllowStudent() decorator).
  { name: 'Student', isSystem: true, permissions: [] },
  { name: 'Branch Manager', permissions: [
    'view-backend', 'view-leads', 'lead-create-update', 'lead-assignment', 'view-students', 'manage-students',
    'student-assignment', 'view-applications', 'manage-applications', 'application-assignment', 'view-staff',
    'staff-attendance', 'staff-leaves', 'approve-leaves', 'course-finder', 'invoice', 'edit-invoice',
    'university-invoice', 'support-tickets', 'ticket-assignment', 'file-uploads', 'analytics', 'import',
    'export-data', 'branch-mgmt', 'transfer-branch', 'broadcast-leads-students', 'broadcast-staff',
  ] },
  { name: 'Counsellor', permissions: [
    'view-backend', 'view-leads', 'lead-create-update', 'view-students', 'manage-students', 'view-applications',
    'course-finder', 'support-tickets', 'canned-responses', 'file-uploads', 'view-assigned-only',
  ] },
  { name: 'Admission Officer', permissions: [
    'view-backend', 'view-students', 'view-applications', 'manage-applications', 'application-apply-through',
    'application-assignment', 'invoice', 'edit-invoice', 'university-invoice', 'file-uploads',
  ] },
  { name: 'Front Desk', permissions: [
    'view-backend', 'view-leads', 'lead-create-update', 'view-students', 'support-tickets', 'file-uploads',
  ] },
  { name: 'Accountant', permissions: [
    'view-backend', 'invoice', 'edit-invoice', 'university-invoice', 'commission', 'analytics', 'export-data',
  ] },
]
/** src/mock/staffStore.ts `seedStaff`. */
const STAFF = [
  { name: 'Sarah Ali', email: 'sarah.ali@globaled.com', phone: '+880 1710 111222', role: 'Counsellor', branch: 'Dhaka' },
  { name: 'Mohammed Saleh', email: 'mohammed.saleh@globaled.com', phone: '+880 1710 333444', role: 'Admission Officer', branch: 'Chattogram' },
  { name: 'Moses Otieno', email: 'moses.otieno@globaled.com', phone: '+880 1710 555666', role: 'Counsellor', branch: 'Sylhet' },
]

/**
 * The three demo logins the login page already advertises
 * (src/features/auth/LoginPage.tsx). Password matches the UI hint so the
 * click-to-fill helper keeps working against real credentials.
 */
const DEMO_PASSWORD = '123456'
const DEMO_USERS = [
  { name: 'Admin', email: 'admin@gmail.com', role: 'Super Admin', branch: 'Dhaka' },
  { name: 'Staff User', email: 'staff@gmail.com', role: 'Counsellor', branch: 'Dhaka' },
  { name: 'Rohan Das', email: 'student@gmail.com', role: 'Student', branch: 'Dhaka' },
]

/** A small country set; the full ~190 list lands with the catalog in Stage 6. */
const COUNTRIES = [
  'United Kingdom', 'Canada', 'Australia', 'United States', 'Finland',
  'Germany', 'New Zealand', 'Ireland', 'Bangladesh', 'India',
]

async function main() {
  console.log('Seeding…')

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'globaled' },
    update: {},
    create: { id: TENANT_ID, name: 'GlobalEd', slug: 'globaled' },
  })
  console.log(`  tenant: ${tenant.name}`)

  for (const name of BRANCHES) {
    await prisma.branch.upsert({
      where: { tenantId_name: { tenantId: TENANT_ID, name } },
      update: {},
      create: { tenantId: TENANT_ID, name },
    })
  }
  console.log(`  branches: ${BRANCHES.length}`)

  for (const r of ROLES) {
    await prisma.role.upsert({
      where: { tenantId_name: { tenantId: TENANT_ID, name: r.name } },
      update: { permissions: r.permissions },
      create: {
        tenantId: TENANT_ID,
        name: r.name,
        permissions: r.permissions,
        isSystem: r.isSystem ?? false,
      },
    })
  }
  console.log(`  roles: ${ROLES.length}`)

  for (const [i, s] of LEAD_STATUSES.entries()) {
    await prisma.leadStatus.upsert({
      where: { tenantId_key: { tenantId: TENANT_ID, key: toKey(s.label) } },
      update: { label: s.label, color: s.color, sortOrder: i },
      create: {
        tenantId: TENANT_ID, key: toKey(s.label), label: s.label, color: s.color,
        sortOrder: i, isWon: s.isWon ?? false, isLost: s.isLost ?? false, isSystem: true,
      },
    })
  }
  console.log(`  lead statuses: ${LEAD_STATUSES.length}`)

  for (const [i, s] of STUDENT_STATUSES.entries()) {
    await prisma.studentStatus.upsert({
      where: { tenantId_key: { tenantId: TENANT_ID, key: toKey(s.label) } },
      update: { label: s.label, color: s.color, sortOrder: i },
      create: {
        tenantId: TENANT_ID, key: toKey(s.label), label: s.label, color: s.color,
        sortOrder: i, isWon: s.isWon ?? false, isTerminal: s.isTerminal ?? false, isSystem: true,
      },
    })
  }
  console.log(`  student statuses: ${STUDENT_STATUSES.length}`)

  for (const [i, s] of APPLICATION_STATUSES.entries()) {
    await prisma.applicationStatus.upsert({
      where: { tenantId_key: { tenantId: TENANT_ID, key: toKey(s.label) } },
      update: { label: s.label, color: s.color, sortOrder: i },
      create: {
        tenantId: TENANT_ID, key: toKey(s.label), label: s.label, color: s.color,
        sortOrder: i, isWon: s.isWon ?? false, isTerminal: s.isTerminal ?? false, isSystem: true,
      },
    })
  }
  console.log(`  application statuses: ${APPLICATION_STATUSES.length}`)

  for (const name of COUNTRIES) {
    await prisma.country.upsert({
      where: { name },
      update: {},
      create: { tenantId: TENANT_ID, name },
    })
  }
  console.log(`  countries: ${COUNTRIES.length}`)

  // Users. Passwords are argon2-hashed — never stored in plaintext.
  const passwordHash = await argon2.hash(DEMO_PASSWORD)
  const roleByName = new Map(
    (await prisma.role.findMany({ where: { tenantId: TENANT_ID } })).map((r) => [r.name, r.id]),
  )
  const branchByName = new Map(
    (await prisma.branch.findMany({ where: { tenantId: TENANT_ID } })).map((b) => [b.name, b.id]),
  )

  for (const u of [...DEMO_USERS, ...STAFF]) {
    await prisma.user.upsert({
      where: { tenantId_email: { tenantId: TENANT_ID, email: u.email } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        name: u.name,
        email: u.email,
        passwordHash,
        phone: 'phone' in u ? u.phone : null,
        roleId: roleByName.get(u.role)!,
        branchId: branchByName.get(u.branch) ?? null,
      },
    })
  }
  console.log(`  users: ${DEMO_USERS.length + STAFF.length} (password for all: ${DEMO_PASSWORD})`)

  // A few leads so /leads has real rows to render.
  const statusByKey = new Map(
    (await prisma.leadStatus.findMany({ where: { tenantId: TENANT_ID } })).map((s) => [s.key, s.id]),
  )
  const countryByName = new Map(
    (await prisma.country.findMany()).map((c) => [c.name, c.id]),
  )
  const userByName = new Map(
    (await prisma.user.findMany({ where: { tenantId: TENANT_ID } })).map((u) => [u.name, u.id]),
  )
  const userIdByEmail = new Map(
    (await prisma.user.findMany({ where: { tenantId: TENANT_ID } })).map((u) => [u.email, u.id]),
  )

  /** All 15 leads from src/mock/leads.ts, so /leads looks the same after the swap. */
  const SEED_LEADS = [
    { name: 'Aarav Sharma', email: 'aarav.sharma@gmail.com', phone: '+880 1845 012345', phoneNote: 'at the time', whatsapp: true, status: 'new-lead', branch: 'Sylhet', country: 'United Kingdom', gender: 'Male', studyLevel: 'Short Term Programs', qualification: 'Bachelors', source: 'Facebook', tags: ['High Commission', 'Mid Priority'] },
    { name: 'Fatima Rahman', email: 'fatima.r@gmail.com', phone: '+880 1712 445566', phoneNote: 'Human resource', status: 'new-lead', branch: 'Khulna', country: 'Canada', nextFollowUp: '2026-07-22' },
    { name: 'Rohan Das', email: 'rohan.das@gmail.com', phone: '+880 1900 801122', phoneNote: 'Column four', whatsapp: true, status: 'contacted', branch: 'Dhaka', country: 'Australia', assignedTo: 'Sarah Ali', gender: 'Male', studyLevel: 'Masters', qualification: 'Bachelors', source: 'Website', tags: ['Hot Lead'] },
    { name: 'Ayesha Khan', email: 'ayesha.khan@gmail.com', phone: '+92 300 4455667', phoneNote: 'Agent created', status: 'new-lead', branch: 'Dhaka', country: 'United States' },
    { name: 'Vikram Patel', email: 'vikram.p@gmail.com', phone: '+880 1876 543210', phoneNote: 'IELTS test', status: 'warm', branch: 'Sylhet', country: 'United Kingdom', assignedTo: 'Mohammed Saleh', nextFollowUp: '2026-07-30', tags: ['Scholarship Seeker', 'Follow Up'] },
    { name: 'Nabila Haque', email: 'nabila.h@gmail.com', phone: '+880 1811 223344', phoneNote: 'country wise', status: 'new-lead', branch: 'Chattogram', country: 'Canada' },
    { name: 'Arjun Mehta', email: 'arjun.mehta@gmail.com', phone: '+880 1988 766554', phoneNote: 'university', status: 'counseling', branch: 'Khulna', country: 'Germany', assignedTo: 'Moses Otieno' },
    { name: 'Sadia Islam', email: 'sadia.islam@gmail.com', phone: '+880 1911 556677', phoneNote: 'Linking of', status: 'new-lead', branch: 'Dhaka', country: 'Australia' },
    { name: 'Karim Uddin', email: 'karim.uddin@gmail.com', phone: '+880 1611 778899', phoneNote: 'If we want', whatsapp: true, status: 'cold', branch: 'Sylhet', country: 'United States' },
    { name: 'Priya Nair', email: 'priya.nair@gmail.com', phone: '+880 1900 001111', phoneNote: 'Welcome note', whatsapp: true, status: 'registered', branch: 'Khulna', country: 'United Kingdom', assignedTo: 'Sarah Ali' },
    { name: 'Tanvir Ahmed', email: 'tanvir.ahmed@gmail.com', phone: '+880 1521 334455', phoneNote: 'follow up', status: 'contacted', branch: 'Chattogram', country: 'Canada', nextFollowUp: '2026-07-20' },
    { name: 'Meera Iyer', email: 'meera.iyer@gmail.com', phone: '+880 1811 122233', phoneNote: 'scholarship', whatsapp: true, status: 'new-lead', branch: 'Sylhet', country: 'Australia' },
    { name: 'Imran Ali', email: 'imran.ali@gmail.com', phone: '+92 301 5566778', phoneNote: 'visa query', status: 'rejected', branch: 'Dhaka', country: 'United States', assignedTo: 'Mohammed Saleh' },
    { name: 'Sneha Reddy', email: 'sneha.reddy@gmail.com', phone: '+880 1955 544422', phoneNote: 'course finder', whatsapp: true, status: 'warm', branch: 'Khulna', country: 'United Kingdom', assignedTo: 'Moses Otieno', nextFollowUp: '2026-08-02' },
    { name: 'Zara Sheikh', email: 'zara.sheikh@gmail.com', phone: '+880 1733 665544', phoneNote: 'walk in', status: 'counseling', branch: 'Dhaka', country: 'Ireland', assignedTo: 'Sarah Ali' },
  ] as Array<{
    name: string; email: string; phone: string; phoneNote?: string; whatsapp?: boolean
    status: string; branch: string; country: string; assignedTo?: string
    gender?: string; studyLevel?: string; qualification?: string; source?: string
    tags?: string[]; nextFollowUp?: string
  }>

  for (const l of SEED_LEADS) {
    const existing = await prisma.lead.findFirst({
      where: { tenantId: TENANT_ID, email: l.email, deletedAt: null },
    })
    if (existing) continue
    await prisma.lead.create({
      data: {
        tenantId: TENANT_ID,
        name: l.name,
        email: l.email,
        phone: l.phone,
        phoneNote: l.phoneNote ?? null,
        whatsapp: l.whatsapp ?? false,
        nextFollowUpAt: l.nextFollowUp ? new Date(l.nextFollowUp) : null,
        gender: l.gender ?? null,
        studyLevel: l.studyLevel ?? null,
        qualification: l.qualification ?? null,
        source: l.source ?? null,
        tags: l.tags ?? [],
        statusId: statusByKey.get(l.status)!,
        branchId: branchByName.get(l.branch) ?? null,
        assignedToId: l.assignedTo ? (userByName.get(l.assignedTo) ?? null) : null,
        primaryInterestCountryId: countryByName.get(l.country) ?? null,
      },
    })
  }
  console.log(`  leads: ${SEED_LEADS.length}`)

  // --- Students -------------------------------------------------------------
  const studentStatusByKey = new Map(
    (await prisma.studentStatus.findMany({ where: { tenantId: TENANT_ID } })).map((s) => [s.key, s.id]),
  )

  /** From src/mock/students.ts `seedStudents`. */
  const SEED_STUDENTS = [
    { name: 'Aarav Sharma', email: 'aarav.sharma@gmail.com', phone: '+880 1845 012345', phoneNote: 'Primary', branch: 'Sylhet', status: 'active', assignedTo: 'Sarah Ali', residence: 'India', interest: 'United Kingdom', studyLevel: 'Masters', course: 'Computer Science', intake: 'September 2026', university: 'University of Manchester', source: 'Lead Convert' },
    { name: 'Fatima Rahman', email: 'fatima.r@gmail.com', phone: '+880 1712 445566', phoneNote: 'WhatsApp', branch: 'Khulna', status: 'docs-pending', residence: 'Bangladesh', interest: 'Canada', studyLevel: 'Bachelors', course: 'Business & Management', intake: 'January 2027', source: 'Walk-in' },
    { name: 'Rohan Das', email: 'rohan.das@gmail.com', phone: '+880 1900 801122', phoneNote: 'Primary', branch: 'Dhaka', status: 'applied', assignedTo: 'Mohammed Saleh', residence: 'India', interest: 'Australia', studyLevel: 'Masters', course: 'Engineering', intake: 'February 2027', university: 'University of Melbourne', source: 'Referral', portalLogin: 'student@gmail.com' },
    { name: 'Ayesha Khan', email: 'ayesha.khan@gmail.com', phone: '+92 300 4455667', phoneNote: 'Father', branch: 'Dhaka', status: 'offer-received', assignedTo: 'Moses Otieno', residence: 'Bangladesh', interest: 'United States', studyLevel: 'Bachelors', course: 'Health Sciences', intake: 'September 2026', university: 'Arizona State University', source: 'Website' },
    { name: 'Vikram Patel', email: 'vikram.p@gmail.com', phone: '+880 1876 543210', phoneNote: 'Primary', branch: 'Sylhet', status: 'visa-applied', assignedTo: 'Sarah Ali', residence: 'India', interest: 'United Kingdom', studyLevel: 'Masters', course: 'Data Science', intake: 'September 2026', university: 'University of Leeds', source: 'Facebook' },
    { name: 'Nabila Haque', email: 'nabila.h@gmail.com', phone: '+880 1811 223344', phoneNote: 'Primary', branch: 'Chattogram', status: 'enrolled', assignedTo: 'Moses Otieno', residence: 'Bangladesh', interest: 'Canada', studyLevel: 'Bachelors', course: 'Nursing', intake: 'January 2027', university: 'University of Toronto', source: 'Referral' },
  ] as Array<{
    name: string; email: string; phone: string; phoneNote?: string; branch: string
    status: string; assignedTo?: string; residence?: string; interest?: string
    studyLevel?: string; course?: string; intake?: string; university?: string; source?: string
    /// Email of the users row this student signs in with. The demo student's
    /// login (student@gmail.com) deliberately differs from their contact email,
    /// which is exactly why the link is an FK and not an email match.
    portalLogin?: string
  }>

  for (const st of SEED_STUDENTS) {
    const existing = await prisma.student.findFirst({
      where: { tenantId: TENANT_ID, email: st.email, deletedAt: null },
    })
    if (existing) {
      // Backfill the portal link on databases seeded before the column existed.
      if (st.portalLogin && !existing.userId) {
        await prisma.student.update({
          where: { id: existing.id },
          data: { userId: userIdByEmail.get(st.portalLogin) ?? null },
        })
      }
      continue
    }

    // studentNo needs the generated id, so insert with a placeholder then patch.
    const created = await prisma.student.create({
      data: {
        tenantId: TENANT_ID,
        studentNo: `PENDING-${st.email}`,
        name: st.name,
        email: st.email,
        phone: st.phone,
        phoneNote: st.phoneNote ?? null,
        source: st.source ?? null,
        studyLevel: st.studyLevel ?? null,
        course: st.course ?? null,
        intake: st.intake ?? null,
        university: st.university ?? null,
        statusId: studentStatusByKey.get(st.status)!,
        branchId: branchByName.get(st.branch) ?? null,
        assignedToId: st.assignedTo ? (userByName.get(st.assignedTo) ?? null) : null,
        residenceCountryId: st.residence ? (countryByName.get(st.residence) ?? null) : null,
        interestCountryId: st.interest ? (countryByName.get(st.interest) ?? null) : null,
        userId: st.portalLogin ? (userIdByEmail.get(st.portalLogin) ?? null) : null,
      },
    })
    await prisma.student.update({
      where: { id: created.id },
      data: { studentNo: `STU-${created.createdAt.getFullYear()}-${created.id}` },
    })
  }
  console.log(`  students: ${SEED_STUDENTS.length}`)

  // --- University catalog ---------------------------------------------------
  //
  // The mock stores money as one string ("USD 100000") and intakes in three
  // different formats. Both are normalised here so the columns are sortable and
  // filterable rather than needing to be parsed on every read.

  /** "USD 100000" -> { amount: 100000, currency: 'USD' }. Null stays null. */
  const parseMoney = (raw: string | null | undefined) => {
    if (!raw) return { amount: null as number | null, currency: null as string | null }
    const m = raw.trim().match(/^([A-Z]{3})\s+([\d.,]+)$/)
    if (!m) return { amount: null, currency: null }
    return { amount: Number(m[2].replace(/,/g, '')), currency: m[1] }
  }

  /**
   * The mock's `commission` is polymorphic: either a fixed amount ("USD 40000")
   * or a formula ("10% of first year fee"). Keeping the type explicit avoids
   * having to guess which it is at read time.
   */
  const parseCommission = (raw: string | null | undefined) => {
    if (!raw) return { commissionType: null as string | null, commissionValue: null as string | null }
    return /^[A-Z]{3}\s/.test(raw.trim())
      ? { commissionType: 'fixed', commissionValue: raw.trim() }
      : { commissionType: 'percentage', commissionValue: raw.trim() }
  }

  const MONTH_INDEX: Record<string, number> = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
  }

  const CATEGORIES = [
    'Engineering', 'IT', 'Commerce, Business and Administration', 'Health',
    'Law', 'Architecture and Building', 'Mathematics', 'Education',
  ]

  /** From src/mock/courseFinder.ts `finderCourses`. */
  const SEED_COURSES = [
    { title: 'Bachelor of Computer Science', university: 'University of Newcastle', city: 'Newcastle', country: 'Australia', studyLevel: 'Undergraduate', studyArea: 'IT', discipline: 'Software Engineering', durationYears: 3, intakes: ['Jan', 'Mar'], tuitionFee: 'USD 100000', applicationFee: null, commission: 'USD 40000', ielts: 6.0, ieltsNoBand: 5.5, toefl: 78, pte: 54 },
    { title: 'Animation, Game Design', university: 'Kent State University', city: 'Kent, Ohio', country: 'United States', studyLevel: 'Undergraduate', studyArea: 'IT', discipline: 'Game Design', durationYears: 4, intakes: ['Aug'], tuitionFee: 'USD 32000', applicationFee: 'USD 70', commission: '10% of first year fee', ielts: 6.0, ieltsNoBand: 5.5, toefl: 71, pte: 50 },
    { title: 'Game Design and Simulation Development', university: 'Marshall University', city: 'Huntington, West Virginia', country: 'United States', studyLevel: 'Undergraduate', studyArea: 'IT', discipline: 'Game Design', durationYears: 4, intakes: ['Jan', 'Aug'], tuitionFee: 'USD 20000', applicationFee: 'USD 40', commission: 'USD 2000', ielts: 6.5, ieltsNoBand: 6.0, toefl: 80, pte: 58 },
    { title: 'MSc Data Science', university: 'University of Manchester', city: 'Manchester', country: 'United Kingdom', studyLevel: 'Postgraduate', studyArea: 'IT', discipline: 'Data Science', durationYears: 1, intakes: ['Sep'], tuitionFee: 'GBP 28000', applicationFee: 'GBP 60', commission: '12% of first year fee', ielts: 6.5, ieltsNoBand: 6.0, toefl: 90, pte: 62 },
    { title: 'MSc Computer Science', university: 'University of Helsinki', city: 'Helsinki', country: 'Finland', studyLevel: 'Postgraduate', studyArea: 'IT', discipline: 'Software Engineering', durationYears: 2, intakes: ['Aug'], tuitionFee: 'EUR 15000', applicationFee: null, commission: 'EUR 1500', ielts: 6.5, ieltsNoBand: 6.0, toefl: 92, pte: 62 },
    { title: 'Bachelor of Nursing', university: 'University of Toronto', city: 'Toronto', country: 'Canada', studyLevel: 'Undergraduate', studyArea: 'Health', discipline: 'Nursing', durationYears: 4, intakes: ['Jan', 'Sep'], tuitionFee: 'CAD 45000', applicationFee: 'CAD 120', commission: '15% of first year fee', ielts: 6.5, ieltsNoBand: 6.0, toefl: 89, pte: 60 },
    { title: 'Master of Engineering', university: 'University of Melbourne', city: 'Melbourne', country: 'Australia', studyLevel: 'Postgraduate', studyArea: 'Engineering', discipline: 'Civil Engineering', durationYears: 2, intakes: ['Feb', 'Jul'], tuitionFee: 'AUD 48000', applicationFee: 'AUD 100', commission: 'AUD 5000', ielts: 6.5, ieltsNoBand: 6.0, toefl: 79, pte: 58 },
    { title: 'MBA', university: 'Arizona State University', city: 'Tempe, Arizona', country: 'United States', studyLevel: 'Postgraduate', studyArea: 'Commerce, Business and Administration', discipline: 'Business Administration', durationYears: 2, intakes: ['Aug'], tuitionFee: 'USD 62000', applicationFee: 'USD 90', commission: '10% of first year fee', ielts: 7.0, ieltsNoBand: 6.5, toefl: 100, pte: 68, gmat: 600 },
    { title: 'BSc Business & Management', university: 'University of Leeds', city: 'Leeds', country: 'United Kingdom', studyLevel: 'Undergraduate', studyArea: 'Commerce, Business and Administration', discipline: 'Business Administration', durationYears: 3, intakes: ['Sep'], tuitionFee: 'GBP 24000', applicationFee: null, commission: 'GBP 2400', ielts: 6.0, ieltsNoBand: 5.5, toefl: 80, pte: 56 },
  ] as Array<{
    title: string; university: string; city: string; country: string
    studyLevel: string; studyArea: string; discipline: string
    durationYears: number | null; intakes: string[]
    tuitionFee: string | null; applicationFee: string | null; commission: string
    ielts?: number; ieltsNoBand?: number; toefl?: number; pte?: number; gre?: number; gmat?: number
  }>

  // Countries referenced by the catalog but missing from the earlier list.
  for (const name of [...new Set(SEED_COURSES.map((c) => c.country))]) {
    await prisma.country.upsert({
      where: { name },
      update: {},
      create: { tenantId: TENANT_ID, name },
    })
  }
  const allCountryByName = new Map(
    (await prisma.country.findMany()).map((c) => [c.name, c.id]),
  )

  // Two-level category tree: study areas on top, discipline areas beneath.
  // upsert cannot key on a nullable column (Prisma rejects `parentId: null` in
  // a compound where), so top-level categories use find-then-create.
  for (const [i, name] of CATEGORIES.entries()) {
    const existing = await prisma.courseCategory.findFirst({ where: { name, parentId: null } })
    if (!existing) {
      await prisma.courseCategory.create({
        data: { tenantId: TENANT_ID, name, displayOrder: i },
      })
    }
  }
  const topCategories = await prisma.courseCategory.findMany({ where: { parentId: null } })
  const topByName = new Map(topCategories.map((c) => [c.name, c.id]))

  for (const c of SEED_COURSES) {
    const parentId = topByName.get(c.studyArea)
    if (!parentId) continue
    const existingChild = await prisma.courseCategory.findFirst({
      where: { name: c.discipline, parentId },
    })
    if (!existingChild) {
      await prisma.courseCategory.create({
        data: { tenantId: TENANT_ID, name: c.discipline, parentId },
      })
    }
  }
  const childCategories = await prisma.courseCategory.findMany({ where: { parentId: { not: null } } })
  const childByName = new Map(childCategories.map((c) => [c.name, c.id]))
  console.log(`  course categories: ${topCategories.length} areas + ${childCategories.length} disciplines`)

  // Universities, de-duplicated from the course list (as the mock derives them).
  const uniqueUnis = new Map<string, { name: string; city: string; country: string }>()
  for (const c of SEED_COURSES) {
    if (!uniqueUnis.has(c.university)) {
      uniqueUnis.set(c.university, { name: c.university, city: c.city, country: c.country })
    }
  }
  for (const u of uniqueUnis.values()) {
    const countryId = allCountryByName.get(u.country)
    if (!countryId) continue
    await prisma.university.upsert({
      where: { name_countryId: { name: u.name, countryId } },
      update: {},
      create: { tenantId: TENANT_ID, name: u.name, city: u.city, countryId },
    })
  }
  const universities = await prisma.university.findMany()
  const uniByName = new Map(universities.map((u) => [u.name, u.id]))
  console.log(`  universities: ${universities.length}`)

  for (const c of SEED_COURSES) {
    const universityId = uniByName.get(c.university)
    if (!universityId) continue

    const tuition = parseMoney(c.tuitionFee)
    const appFee = parseMoney(c.applicationFee)
    const commission = parseCommission(c.commission)

    const existing = await prisma.course.findFirst({
      where: { title: c.title, universityId, deletedAt: null },
    })
    const course =
      existing ??
      (await prisma.course.create({
        data: {
          tenantId: TENANT_ID,
          universityId,
          categoryId: childByName.get(c.discipline) ?? null,
          title: c.title,
          studyLevel: c.studyLevel,
          durationYears: c.durationYears,
          durationMonths: c.durationYears ? c.durationYears * 12 : null,
          tuitionFee: tuition.amount,
          applicationFee: appFee.amount,
          currency: tuition.currency ?? appFee.currency,
          commissionType: commission.commissionType,
          commissionValue: commission.commissionValue,
          // Admission minimums — the course side. A student's own scores are a
          // separate concern (student_test_scores, deferred to a later stage).
          requirements: {
            ielts: c.ielts ?? null,
            ieltsNoBand: c.ieltsNoBand ?? null,
            toefl: c.toefl ?? null,
            pte: c.pte ?? null,
            gre: c.gre ?? null,
            gmat: c.gmat ?? null,
          },
        },
      }))

    // Bare month names mean "recurring", so year stays null.
    for (const m of c.intakes) {
      const month = MONTH_INDEX[m]
      if (!month) continue
      const existingIntake = await prisma.intake.findFirst({
        where: { courseId: course.id, month, year: null },
      })
      if (!existingIntake) {
        await prisma.intake.create({
          data: { tenantId: TENANT_ID, courseId: course.id, month },
        })
      }
    }
  }
  const courseCount = await prisma.course.count()
  const intakeCount = await prisma.intake.count()
  console.log(`  courses: ${courseCount} (${intakeCount} intakes)`)

  // --- Applications ---------------------------------------------------------
  const appStatusByKey = new Map(
    (await prisma.applicationStatus.findMany({ where: { tenantId: TENANT_ID } })).map((s) => [s.key, s.id]),
  )
  const seededStudents = await prisma.student.findMany({
    where: { tenantId: TENANT_ID, deletedAt: null },
    orderBy: { id: 'asc' },
  })
  const allCourses = await prisma.course.findMany({
    where: { deletedAt: null },
    include: { intakes: true },
    orderBy: { id: 'asc' },
  })

  /**
   * Applications are attached to the seeded students by position, so every
   * demo student has a plausible pipeline. The mock had no id generator for
   * applications at all — they could only be read — so there is no fixed set
   * of rows to reproduce here.
   */
  const SEED_APPLICATIONS = [
    { studentIndex: 0, courseIndex: 3, status: 'payment-received', channel: 'DIRECT', assignedTo: 'Sarah Ali' },
    { studentIndex: 0, courseIndex: 8, status: 'pending', channel: 'Applyboard', assignedTo: 'Sarah Ali' },
    { studentIndex: 2, courseIndex: 6, status: 'offer-letter-received', channel: 'DIRECT', assignedTo: 'Mohammed Saleh' },
    { studentIndex: 3, courseIndex: 7, status: 'admission-criteria-met', channel: 'Adventus', assignedTo: 'Moses Otieno' },
    { studentIndex: 4, courseIndex: 3, status: 'funds-under-assessment', channel: 'DIRECT', assignedTo: 'Sarah Ali' },
    { studentIndex: 5, courseIndex: 5, status: 'offer-letter-received', channel: 'INTO Global', assignedTo: 'Moses Otieno' },
  ]

  let appsCreated = 0
  for (const a of SEED_APPLICATIONS) {
    const student = seededStudents[a.studentIndex]
    const course = allCourses[a.courseIndex]
    if (!student || !course) continue

    const existing = await prisma.application.findFirst({
      where: { studentId: student.id, courseId: course.id, deletedAt: null },
    })
    if (existing) continue

    const statusId = appStatusByKey.get(a.status)
    if (!statusId) continue

    const application = await prisma.application.create({
      data: {
        tenantId: TENANT_ID,
        studentId: student.id,
        courseId: course.id,
        intakeId: course.intakes[0]?.id ?? null,
        statusId,
        branchId: student.branchId,
        assignedToId: userByName.get(a.assignedTo) ?? null,
        appliedThrough: a.channel,
      },
    })

    // Seed the timeline with the creation entry, matching what the service
    // writes on every later status change.
    await prisma.applicationStatusHistory.create({
      data: {
        tenantId: TENANT_ID,
        applicationId: application.id,
        toStatusId: statusId,
        note: 'Application created',
      },
    })
    appsCreated++
  }
  console.log(`  applications: ${appsCreated}`)

  // ---- Support tickets -----------------------------------------------------
  // Statuses first: a lookup table, not an enum (see the model comment).
  // isOpen drives the dashboard's "Open Support Tickets" card — reports read
  // that flag, never the label, which tenants are free to rename.
  const TICKET_STATUSES = [
    { key: 'open', label: 'Open', color: '#1d4ed8', isOpen: true },
    { key: 'pending', label: 'Pending', color: '#a16207', isOpen: true },
    { key: 'resolved', label: 'Resolved', color: '#15803d', isOpen: false },
    { key: 'closed', label: 'Closed', color: '#475569', isOpen: false },
  ]
  for (const [i, st] of TICKET_STATUSES.entries()) {
    await prisma.ticketStatus.upsert({
      where: { tenantId_key: { tenantId: TENANT_ID, key: st.key } },
      update: { label: st.label, color: st.color, isOpen: st.isOpen, sortOrder: i },
      create: { tenantId: TENANT_ID, ...st, sortOrder: i, isSystem: true },
    })
  }
  const ticketStatusByKey = new Map(
    (await prisma.ticketStatus.findMany({ where: { tenantId: TENANT_ID } })).map((s) => [s.key, s.id]),
  )

  const ticketStudents = await prisma.student.findMany({
    where: { tenantId: TENANT_ID, deletedAt: null },
    select: { id: true, name: true, branchId: true },
    orderBy: { id: 'asc' },
  })
  const ticketLeads = await prisma.lead.findMany({
    where: { tenantId: TENANT_ID, deletedAt: null },
    select: { id: true, name: true, branchId: true },
    orderBy: { id: 'asc' },
  })

  const SEED_TICKETS = [
    { subject: 'Offer letter not received yet', category: 'Application', status: 'open', priority: 'High', student: 0, assignedTo: 'Sarah Ali',
      messages: [
        { body: 'I submitted everything two weeks ago but have not received my offer letter.', fromStaff: false },
        { body: 'Thanks for flagging this — the university has it in review. I will chase them today.', fromStaff: true, author: 'Sarah Ali' },
      ] },
    { subject: 'Tuition instalment failed', category: 'Payment', status: 'pending', priority: 'High', student: 1, assignedTo: 'Mohammed Saleh',
      messages: [{ body: 'My card was declined for the second instalment. How do I retry?', fromStaff: false }] },
    { subject: 'Which documents do I need for the visa?', category: 'Visa', status: 'open', priority: 'Medium', lead: 0,
      messages: [{ body: 'Could you send the visa document checklist for Australia?', fromStaff: false }] },
    { subject: 'Transcript upload keeps failing', category: 'Documents', status: 'resolved', priority: 'Low', student: 2, assignedTo: 'Sarah Ali',
      messages: [
        { body: 'The upload fails every time I try my transcript PDF.', fromStaff: false },
        { body: 'That file was over the size limit. I have raised it — please try again.', fromStaff: true, author: 'Sarah Ali' },
        { body: 'Worked, thank you!', fromStaff: false },
      ] },
    { subject: 'Change of preferred intake', category: 'Course Selection', status: 'closed', priority: 'Medium', student: 3,
      messages: [{ body: 'I would like to move from September to January intake.', fromStaff: false }] },
  ] as Array<{
    subject: string; category: string; status: string; priority: string
    student?: number; lead?: number; assignedTo?: string
    messages: Array<{ body: string; fromStaff?: boolean; author?: string }>
  }>

  let ticketsCreated = 0
  for (const t of SEED_TICKETS) {
    const existing = await prisma.ticket.findFirst({
      where: { tenantId: TENANT_ID, subject: t.subject, deletedAt: null },
    })
    if (existing) continue

    const student = t.student !== undefined ? ticketStudents[t.student] : undefined
    const lead = t.lead !== undefined ? ticketLeads[t.lead] : undefined
    if (!student && !lead) continue

    const ticket = await prisma.ticket.create({
      data: {
        tenantId: TENANT_ID,
        subject: t.subject,
        category: t.category,
        studentId: student?.id ?? null,
        leadId: lead?.id ?? null,
        branchId: student?.branchId ?? lead?.branchId ?? null,
        assignedToId: t.assignedTo ? (userByName.get(t.assignedTo) ?? null) : null,
        statusId: ticketStatusByKey.get(t.status)!,
        priority: t.priority,
      },
    })

    const requesterName = student?.name ?? lead?.name ?? 'Requester'
    for (const m of t.messages) {
      await prisma.ticketMessage.create({
        data: {
          tenantId: TENANT_ID,
          ticketId: ticket.id,
          authorId: m.fromStaff && m.author ? (userByName.get(m.author) ?? null) : null,
          authorName: m.fromStaff ? (m.author ?? 'Support') : requesterName,
          fromStaff: m.fromStaff ?? false,
          body: m.body,
        },
      })
    }
    ticketsCreated++
  }
  console.log(`  tickets: ${ticketsCreated}`)

  // ---- Invoices ------------------------------------------------------------
  // Statuses are a lookup, not an ENUM. isPaid is the flag reports read; the
  // label is free to be renamed.
  const INVOICE_STATUSES = [
    { key: 'unpaid', label: 'Due', color: '#b91c1c', isPaid: false },
    { key: 'partial', label: 'Partially Paid', color: '#a16207', isPaid: false },
    { key: 'paid', label: 'Paid', color: '#15803d', isPaid: true },
  ]
  for (const [i, st] of INVOICE_STATUSES.entries()) {
    await prisma.invoiceStatus.upsert({
      where: { tenantId_key: { tenantId: TENANT_ID, key: st.key } },
      update: { label: st.label, color: st.color, isPaid: st.isPaid, sortOrder: i },
      create: { tenantId: TENANT_ID, ...st, sortOrder: i, isSystem: true },
    })
  }

  // Billing entities, from `businesses` in src/mock/studentInvoices.ts.
  const BUSINESSES = [
    { name: 'GlobalEd HQ', address: 'House 29, Road 1, Banani, Dhaka', phone: '+880 1700 000000', email: 'billing@globaled.com', taxId: 'GE-100234', currency: 'USD' },
    { name: 'GlobalEd Chattogram', address: 'GEC Circle, Chattogram', phone: '+880 1811 223344', email: 'ctg@globaled.com', taxId: 'GE-100567', currency: 'USD' },
  ]
  for (const b of BUSINESSES) {
    await prisma.business.upsert({
      where: { tenantId_name: { tenantId: TENANT_ID, name: b.name } },
      update: b,
      create: { tenantId: TENANT_ID, ...b },
    })
  }
  console.log(`  invoice statuses: ${INVOICE_STATUSES.length}, businesses: ${BUSINESSES.length}`)

  // ---- Commission statuses -------------------------------------------------
  const COMMISSION_STATUSES = [
    { key: 'pending', label: 'Pending', color: '#a16207', isPaid: false },
    { key: 'paid', label: 'Paid', color: '#15803d', isPaid: true },
  ]
  for (const [i, st] of COMMISSION_STATUSES.entries()) {
    await prisma.commissionStatus.upsert({
      where: { tenantId_key: { tenantId: TENANT_ID, key: st.key } },
      update: { label: st.label, color: st.color, isPaid: st.isPaid, sortOrder: i },
      create: { tenantId: TENANT_ID, ...st, sortOrder: i, isSystem: true },
    })
  }
  console.log(`  commission statuses: ${COMMISSION_STATUSES.length}`)




  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
