// Staff module facade. The staff records + CRUD live in staffStore.ts (which has
// no leads/students/applications dependency, so the assignable-staff list can be
// derived without a circular import). This file re-exports that store and adds
// the live workload counts, which DO read those modules.
// Docs: docs/superpowers/mock-data/adminpage.md. Replace with real API in Phase 2.

import { leadBranches } from './leads'
import { leads } from './leads'
import { students } from './students'
import { applications } from './applications'

export {
  staffRoles,
  staffStatuses,
  avatarColor,
  initials,
  staff,
  loadStaff,
  getStaff,
  addStaff,
  updateStaff,
  toggleStaffStatus,
  deleteStaff,
  staffNames,
} from './staffStore'
export type { StaffRole, StaffStatus, StaffMember } from './staffStore'

/** Branch options (drop the "All Branch" sentinel used by the filters). */
export const staffBranches = leadBranches.filter((b) => b !== 'All Branch')

/* ------------------------------------------------------------------ */
/* Live workload counts (assignedTo === staff name across the CRM)     */
/* ------------------------------------------------------------------ */

export const assignedLeads = (name: string) => leads.filter((l) => l.assignedTo === name)
export const assignedStudents = (name: string) => students.filter((s) => s.assignedTo === name)
export const assignedApplications = (name: string) => applications.filter((a) => a.assignedTo === name)

export interface StaffWorkload {
  leads: number
  students: number
  applications: number
}

export function workload(name: string): StaffWorkload {
  return {
    leads: assignedLeads(name).length,
    students: assignedStudents(name).length,
    applications: assignedApplications(name).length,
  }
}
