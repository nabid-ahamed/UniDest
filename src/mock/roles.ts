// Role Management module, modeled on the EduCtrl demo (/admin/auth/role). A role
// is a named permission set that staff accounts are assigned. The list shows each
// role's granted permissions, whether it's managerial, and how many users hold it;
// the form is a grouped permission-checkbox editor.
//
// Connected to existing modules: roles ARE the roles used across Staff and User
// Management (seeded from `staffRoles`), and "Number of Users" is read live from
// the User Management accounts (`users[].roles`). Editing a role's permissions is
// the RBAC layer behind those accounts. Persists to localStorage.
// Docs: docs/superpowers/mock-data/adminpage.md.

import { staffRoles } from './staff'
import { users } from './userManagement'

/* ------------------------------------------------------------------ */
/* Permission catalog (grouped, mirrors the reference)                 */
/* ------------------------------------------------------------------ */

export interface Permission {
  id: string
  label: string
  desc: string
}

export interface PermissionGroup {
  group: string
  items: Permission[]
}

export const permissionGroups: PermissionGroup[] = [
  {
    group: 'General',
    items: [
      { id: 'view-backend', label: 'View Backend', desc: 'Access the admin dashboard.' },
      { id: 'view-assigned-only', label: 'View Assigned Data Only', desc: 'See only leads/students/applications assigned to this user.' },
    ],
  },
  {
    group: 'Lead Management',
    items: [
      { id: 'view-leads', label: 'View Leads', desc: 'View leads.' },
      { id: 'lead-create-update', label: 'Lead Create/Update', desc: 'Create, edit and change lead status; add follow-ups.' },
      { id: 'lead-assignment', label: 'Lead Assignment', desc: 'Assign a lead to another staff member.' },
    ],
  },
  {
    group: 'Student Management',
    items: [
      { id: 'view-students', label: 'View Students', desc: 'View student profiles and documents.' },
      { id: 'manage-students', label: 'Manage Students', desc: 'Create and manage student details.' },
      { id: 'student-assignment', label: 'Student Assignment', desc: 'Assign a student to another staff member.' },
    ],
  },
  {
    group: 'Application Management',
    items: [
      { id: 'view-applications', label: 'View University Applications', desc: 'View student applications.' },
      { id: 'manage-applications', label: 'Manage University Applications', desc: 'Create and manage applications and status.' },
      { id: 'application-assignment', label: 'Application Assignment', desc: 'Assign an application to another staff member.' },
      { id: 'application-apply-through', label: 'Application Apply Through', desc: 'Set the agency configuration an application applies through.' },
      { id: 'delete-visa-service-application', label: 'Delete Visa/Service Application', desc: 'Delete a visa/other services application.' },
    ],
  },
  {
    group: 'Staff Management',
    items: [
      { id: 'view-staff', label: 'View Staff', desc: 'View staff members list and details.' },
      { id: 'edit-staff', label: 'Edit Staff', desc: 'Create and edit staff users.' },
      { id: 'staff-attendance', label: 'Staff Attendance', desc: 'View staff attendance.' },
      { id: 'staff-leaves', label: 'Staff Leaves', desc: 'View staff leaves.' },
      { id: 'approve-leaves', label: 'Approve Leaves', desc: 'Approve or disapprove staff leaves.' },
    ],
  },
  {
    group: 'Agent Management',
    items: [
      { id: 'agent-management', label: 'Agent Management', desc: 'Create and manage agents/partners.' },
      { id: 'commission', label: 'Commission', desc: 'Manage agent/partner commissions.' },
    ],
  },
  {
    group: 'Course Management',
    items: [{ id: 'course-finder', label: 'Course Finder', desc: 'Search courses and suggest them to students.' }],
  },
  {
    group: 'Invoice Management',
    items: [
      { id: 'invoice', label: 'Invoice', desc: 'Create invoices and record payments.' },
      { id: 'edit-invoice', label: 'Edit Invoice', desc: 'Edit existing invoices.' },
      { id: 'university-invoice', label: 'University Invoice', desc: 'Manage university invoices.' },
    ],
  },
  {
    group: 'Support Tickets',
    items: [
      { id: 'support-tickets', label: 'Support Tickets', desc: 'View and reply to support tickets.' },
      { id: 'ticket-assignment', label: 'Ticket Assignment', desc: 'Assign a support ticket to another staff member.' },
    ],
  },
  {
    group: 'CMS Management',
    items: [
      { id: 'cms-articles', label: 'CMS Articles', desc: 'Manage home page, pages, blog posts and countries.' },
      { id: 'cms-events', label: 'CMS Events', desc: 'Manage webinars and events content.' },
    ],
  },
  {
    group: 'Upload Management',
    items: [{ id: 'file-uploads', label: 'File Uploads', desc: 'Upload documents shared with students.' }],
  },
  {
    group: 'Message Templates',
    items: [
      { id: 'mail-templates', label: 'Mail Templates', desc: 'Manage email, SMS and WhatsApp templates.' },
      { id: 'canned-responses', label: 'Canned Responses', desc: 'Create, edit and delete canned responses.' },
    ],
  },
  {
    group: 'Referral Management',
    items: [{ id: 'student-referral', label: 'Student Referral', desc: 'Manage the student referral feature.' }],
  },
  {
    group: 'Report Management',
    items: [{ id: 'analytics', label: 'Analytics', desc: "View analytics and reports." }],
  },
  {
    group: 'Advanced',
    items: [
      { id: 'automations', label: 'Automations', desc: 'Manage automation workflows and campaigns.' },
      { id: 'import', label: 'Import', desc: 'Import leads, students and course data.' },
      { id: 'roles-mgmt', label: 'Roles Management', desc: 'Create, edit and assign permissions to roles.' },
      { id: 'branch-mgmt', label: 'Branch Management', desc: 'Manage business branches.' },
      { id: 'country-info', label: 'Country Info', desc: 'Manage study destination country information.' },
      { id: 'overseas-education-configs', label: 'Overseas Education Configs', desc: 'Manage course suggestion and country data.' },
      { id: 'export-data', label: 'Export Lead/Student Data', desc: 'Export data from lists to files.' },
      { id: 'settings', label: 'Settings', desc: 'Manage portal settings and configuration.' },
      { id: 'broadcast-leads-students', label: 'Broadcast to Leads & Students', desc: 'Send bulk messages to leads and students.' },
      { id: 'broadcast-staff', label: 'Broadcast to Staff', desc: 'Send bulk messages to staff.' },
      { id: 'broadcast-agents', label: 'Broadcast to Agents', desc: 'Send bulk messages to agents.' },
      { id: 'transfer-branch', label: 'Transfer Branch', desc: 'Move leads/students between branches.' },
    ],
  },
  {
    group: 'Chat',
    items: [
      { id: 'create-chat-groups', label: 'Create Chat Groups', desc: 'Create team chat groups.' },
      { id: 'manage-chat-groups', label: 'Manage Chat Groups', desc: 'Add or remove members from a chat group.' },
    ],
  },
]

export const allPermissions: Permission[] = permissionGroups.flatMap((g) => g.items)
export const allPermissionIds: string[] = allPermissions.map((p) => p.id)
export const permissionLabel = (id: string) => allPermissions.find((p) => p.id === id)?.label ?? id

/* ------------------------------------------------------------------ */
/* Role type + seeds                                                   */
/* ------------------------------------------------------------------ */

export interface Role {
  id: number
  name: string
  managerial: boolean
  /** Granted permission ids. */
  permissions: string[]
  /** System roles (Super Admin) can't be deleted and always have every permission. */
  system: boolean
}

// Permission presets per seeded role — everything else is derived from staffRoles.
const PRESETS: Record<string, { managerial: boolean; permissions: string[] }> = {
  'Super Admin': { managerial: true, permissions: allPermissionIds },
  'Branch Manager': {
    managerial: true,
    permissions: [
      'view-backend', 'view-leads', 'lead-create-update', 'lead-assignment', 'view-students', 'manage-students',
      'student-assignment', 'view-applications', 'manage-applications', 'application-assignment', 'view-staff',
      'staff-attendance', 'staff-leaves', 'approve-leaves', 'course-finder', 'invoice', 'edit-invoice',
      'university-invoice', 'support-tickets', 'ticket-assignment', 'file-uploads', 'analytics', 'import',
      'export-data', 'branch-mgmt', 'transfer-branch', 'broadcast-leads-students', 'broadcast-staff',
    ],
  },
  Counsellor: {
    managerial: false,
    permissions: [
      'view-backend', 'view-leads', 'lead-create-update', 'view-students', 'manage-students', 'view-applications',
      'course-finder', 'support-tickets', 'canned-responses', 'file-uploads', 'view-assigned-only',
    ],
  },
  'Admission Officer': {
    managerial: false,
    permissions: [
      'view-backend', 'view-students', 'view-applications', 'manage-applications', 'application-apply-through',
      'application-assignment', 'invoice', 'edit-invoice', 'university-invoice', 'file-uploads',
    ],
  },
  'Front Desk': {
    managerial: false,
    permissions: ['view-backend', 'view-leads', 'lead-create-update', 'view-students', 'support-tickets', 'file-uploads'],
  },
  Accountant: {
    managerial: false,
    permissions: ['view-backend', 'invoice', 'edit-invoice', 'university-invoice', 'commission', 'analytics', 'export-data'],
  },
}

const KEY = 'unidest-roles'

const seedRoles: Role[] = staffRoles.map((name, i) => {
  const preset = PRESETS[name] ?? { managerial: false, permissions: ['view-backend'] }
  return {
    id: i + 1,
    name,
    managerial: preset.managerial,
    permissions: preset.permissions,
    system: name === 'Super Admin',
  }
})

function load(): Role[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seedRoles
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : seedRoles
  } catch {
    return seedRoles
  }
}

export const roles: Role[] = load()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(roles))
  } catch {
    // Storage blocked — changes stay in-memory for this session.
  }
}

const nextId = () => Math.max(0, ...roles.map((r) => r.id)) + 1

export const getRole = (id: number) => roles.find((r) => r.id === id)

/** Live count of User Management accounts holding this role. */
export const userCountForRole = (name: string) => users.filter((u) => u.roles.includes(name)).length

/** A role with every permission (or a system role) shows "All". */
export const hasAllPermissions = (role: Role) =>
  role.system || allPermissionIds.every((id) => role.permissions.includes(id))

export function addRole(data: Omit<Role, 'id' | 'system'>): Role {
  const role: Role = { ...data, id: nextId(), system: false }
  roles.push(role)
  persist()
  return role
}

export function updateRole(id: number, patch: Partial<Omit<Role, 'id' | 'system'>>) {
  const role = roles.find((r) => r.id === id)
  if (!role) return
  Object.assign(role, patch)
  persist()
}

/** Returns false for system roles, which can't be deleted. */
export function deleteRole(id: number): boolean {
  const role = roles.find((r) => r.id === id)
  if (!role || role.system) return false
  roles.splice(roles.indexOf(role), 1)
  persist()
  return true
}
