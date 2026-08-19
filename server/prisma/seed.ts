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

/** src/mock/staffStore.ts `staffRoles`. Super Admin is the undeletable system role. */
const ROLES = [
  { name: 'Super Admin', isSystem: true, permissions: ['*'] },
  { name: 'Branch Manager', permissions: ['view-leads', 'lead-create-update', 'lead-assignment', 'view-students', 'view-applications', 'view-reports'] },
  { name: 'Counsellor', permissions: ['view-leads', 'lead-create-update', 'view-students', 'view-applications'] },
  { name: 'Admission Officer', permissions: ['view-applications', 'application-create-update', 'view-students'] },
  { name: 'Front Desk', permissions: ['view-leads', 'lead-create-update'] },
  { name: 'Accountant', permissions: ['view-invoices', 'view-reports'] },
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

  const SEED_LEADS = [
    { name: 'Aarav Sharma', email: 'aarav.sharma@gmail.com', phone: '+880 1845 012345', status: 'new-lead', branch: 'Sylhet', country: 'United Kingdom', gender: 'Male', studyLevel: 'Short Term Programs', qualification: 'Bachelors', source: 'Facebook', tags: ['High Commission', 'Mid Priority'] },
    { name: 'Fatima Rahman', email: 'fatima.r@gmail.com', phone: '+880 1712 445566', status: 'new-lead', branch: 'Khulna', country: 'Canada' },
    { name: 'Rohan Das', email: 'rohan.das@gmail.com', phone: '+880 1900 801122', status: 'contacted', branch: 'Dhaka', country: 'Australia', assignedTo: 'Sarah Ali', gender: 'Male', studyLevel: 'Masters', qualification: 'Bachelors', source: 'Website', tags: ['Hot Lead'] },
  ]

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

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
