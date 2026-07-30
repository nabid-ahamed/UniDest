// Core Staff store — the staff records, CRUD, and helpers, with NO dependency on
// leads / students / applications. Kept separate from staff.ts (which adds the
// live workload counts that DO read those modules) so the assignable-staff list
// can be derived here and consumed by leads/students/applications without a
// circular import. Persisted to localStorage (prototype); API in Phase 2.

export const staffRoles = [
  'Super Admin',
  'Branch Manager',
  'Counsellor',
  'Admission Officer',
  'Front Desk',
  'Accountant',
] as const
export type StaffRole = (typeof staffRoles)[number]

export const staffStatuses = ['Active', 'Inactive'] as const
export type StaffStatus = (typeof staffStatuses)[number]

/** Avatar tints — darker 600/700 shades so white/dark initials clear WCAG AA. */
const AVATAR_COLORS = ['#1d4ed8', '#0e7490', '#6d28d9', '#c2410c', '#15803d', '#a16207', '#b91c1c', '#475569']

export function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

export interface StaffMember {
  id: number
  name: string
  email: string
  phone: string
  role: StaffRole
  branch: string
  status: StaffStatus
  joined: string // e.g. "12 Jan 2025"
  avatar?: string // profile picture (data URL); falls back to coloured initials
}

const STAFF_KEY = 'unidest-staff'

// Seeded so the first four names match the records leads/students/applications
// were assigned to, giving those staff real workload counts.
const seedStaff: StaffMember[] = [
  { id: 1, name: 'Sarah Ali', email: 'sarah.ali@globaled.com', phone: '+880 1710 111222', role: 'Counsellor', branch: 'Dhaka', status: 'Active', joined: '12 Jan 2025' },
  { id: 2, name: 'Mohammed Saleh', email: 'mohammed.saleh@globaled.com', phone: '+880 1710 333444', role: 'Admission Officer', branch: 'Chattogram', status: 'Active', joined: '03 Feb 2025' },
  { id: 3, name: 'Moses Otieno', email: 'moses.otieno@globaled.com', phone: '+880 1710 555666', role: 'Counsellor', branch: 'Sylhet', status: 'Active', joined: '19 Mar 2025' },
  { id: 4, name: 'Admin Two Test', email: 'admin.two@globaled.com', phone: '+880 1710 777888', role: 'Branch Manager', branch: 'Khulna', status: 'Inactive', joined: '28 Nov 2024' },
  { id: 5, name: 'Admin Admin', email: 'admin@globaled.com', phone: '+880 1700 000000', role: 'Super Admin', branch: 'Dhaka', status: 'Active', joined: '01 Sep 2024' },
  { id: 6, name: 'Farhana Kabir', email: 'farhana.kabir@globaled.com', phone: '+880 1710 999000', role: 'Front Desk', branch: 'Dhaka', status: 'Active', joined: '07 Apr 2025' },
  { id: 7, name: 'Tanvir Hossain', email: 'tanvir.hossain@globaled.com', phone: '+880 1711 121314', role: 'Accountant', branch: 'Chattogram', status: 'Active', joined: '22 May 2025' },
]

export function loadStaff(): StaffMember[] {
  try {
    const raw = localStorage.getItem(STAFF_KEY)
    if (!raw) return seedStaff
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : seedStaff
  } catch {
    return seedStaff
  }
}

export const staff: StaffMember[] = loadStaff()

function persist() {
  try {
    localStorage.setItem(STAFF_KEY, JSON.stringify(staff))
  } catch {
    // Storage blocked — changes stay in-memory for this session.
  }
}

export function getStaff(id: number): StaffMember | undefined {
  return staff.find((s) => s.id === id)
}

export function addStaff(data: Omit<StaffMember, 'id'>): StaffMember {
  const member: StaffMember = { ...data, id: Math.max(0, ...staff.map((s) => s.id)) + 1 }
  staff.unshift(member)
  persist()
  return member
}

export function updateStaff(id: number, patch: Partial<Omit<StaffMember, 'id'>>) {
  const member = staff.find((s) => s.id === id)
  if (!member) return
  Object.assign(member, patch)
  persist()
}

export function toggleStaffStatus(id: number) {
  const member = staff.find((s) => s.id === id)
  if (!member) return
  member.status = member.status === 'Active' ? 'Inactive' : 'Active'
  persist()
}

export function deleteStaff(id: number) {
  const i = staff.findIndex((s) => s.id === id)
  if (i >= 0) staff.splice(i, 1)
  persist()
}

/**
 * Names of staff who can be assigned work — active members only, de-duplicated.
 * This is what every "Assign Staff" picker (Leads, Students, Applications,
 * Tickets) reads, so adding a staff member makes them assignable everywhere.
 */
export function staffNames(): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  for (const s of staff) {
    if (s.status !== 'Active') continue
    if (seen.has(s.name)) continue
    seen.add(s.name)
    names.push(s.name)
  }
  return names
}
