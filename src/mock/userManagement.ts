// Mock data for the User Management module, modeled on the EduCtrl demo
// /admin/auth/staff (staff member accounts: roles, branches, reporting line).
//
// This is the *account & access* view of the same people the Staff module tracks
// for workload — so it's SEEDED from `staff` (names/emails/branches agree) and
// each user links back to its Staff workload page (`staffId`). Reuses the shared
// role/branch/avatar helpers. Persists to localStorage like the other modules.
// Docs: docs/superpowers/mock-data/adminpage.md.

import { staff, staffRoles, staffBranches, avatarColor, initials } from './staff'

export { staffRoles as userRoles, staffBranches as userBranches, avatarColor, initials }

export const userStatuses = ['Active', 'Inactive', 'Blocked'] as const
export type UserStatus = (typeof userStatuses)[number]

export interface UserAccount {
  id: number
  name: string
  email: string
  mobile: string
  roles: string[]
  branches: string[]
  reportingToId: number | null
  status: UserStatus
  createdOn: string
  isSuperAdmin: boolean
  /** Matching Staff record for the workload view, when this user is also staff. */
  staffId: number | null
}

const KEY = 'unidest-users'

// Overlay per staff id: the account-specific fields the Staff record doesn't hold
// (extra roles, all-branch access, reporting line, blocked status).
const OVERLAY: Record<number, Partial<Pick<UserAccount, 'roles' | 'branches' | 'reportingToId' | 'status' | 'isSuperAdmin'>>> = {
  1: { reportingToId: 5 },
  2: { reportingToId: 4 },
  3: { reportingToId: 5 },
  4: { roles: ['Branch Manager', 'Counsellor'], reportingToId: 5, status: 'Blocked' },
  5: { branches: [...staffBranches], reportingToId: null, isSuperAdmin: true },
  6: { reportingToId: 5 },
  7: { reportingToId: 4 },
}

const seedUsers: UserAccount[] = staff.map((s) => {
  const o = OVERLAY[s.id] ?? {}
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    mobile: s.phone,
    roles: o.roles ?? [s.role],
    branches: o.branches ?? [s.branch],
    reportingToId: o.reportingToId ?? null,
    status: o.status ?? (s.status as UserStatus),
    createdOn: s.joined,
    isSuperAdmin: o.isSuperAdmin ?? false,
    staffId: s.id,
  }
})

export const users: UserAccount[] = (() => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seedUsers
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : seedUsers
  } catch {
    return seedUsers
  }
})()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(users))
  } catch {
    // Storage blocked — changes stay in-memory for this session.
  }
}

const nextId = () => Math.max(0, ...users.map((u) => u.id)) + 1

export const getUser = (id: number) => users.find((u) => u.id === id)

export function addUser(data: Omit<UserAccount, 'id'>): UserAccount {
  const user: UserAccount = { ...data, id: nextId() }
  users.unshift(user)
  persist()
  return user
}

export function updateUser(id: number, patch: Partial<Omit<UserAccount, 'id'>>) {
  const user = users.find((u) => u.id === id)
  if (!user) return
  Object.assign(user, patch)
  persist()
}

export function setUserStatus(id: number, status: UserStatus) {
  const user = users.find((u) => u.id === id)
  if (!user) return
  user.status = status
  persist()
}

export function deleteUser(id: number) {
  const i = users.findIndex((u) => u.id === id)
  if (i >= 0) users.splice(i, 1)
  // Anyone reporting to the removed user now reports to no-one.
  users.forEach((u) => u.reportingToId === id && (u.reportingToId = null))
  persist()
}

/* ------------------------------------------------------------------ */
/* Live relationships                                                  */
/* ------------------------------------------------------------------ */

export const reportingToName = (id: number | null) => (id == null ? null : getUser(id)?.name ?? null)

/** Users who report to the given user (their direct reports). */
export const directReports = (id: number) => users.filter((u) => u.reportingToId === id)

/** Candidate managers for the "Reporting To" picker (everyone but the user). */
export const reportingOptions = (excludeId?: number) => users.filter((u) => u.id !== excludeId)
