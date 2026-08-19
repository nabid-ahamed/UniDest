/**
 * Staff, roles and branches.
 *
 * Assignments now reference a user row rather than a name string, so renaming
 * a staff member updates every lead, student and application they are assigned
 * to instead of silently orphaning them (the mock matched `assignedTo === name`).
 */
import { mocked, request, USING_REAL_API } from '../client'
import { staff as mockStaff, type StaffMember } from '../../../mock/staffStore'
import { roles as mockRoles } from '../../../mock/roles'

export type { StaffMember }

/** Workload counted through foreign keys, not by matching names. */
export interface StaffWorkload {
  leads: number
  students: number
  applications: number
}

export interface ApiStaff {
  id: number
  publicId: string
  name: string
  email: string
  phone: string
  role: string
  branch: string
  status: string
  joined: string
  avatar?: string
  workload: StaffWorkload
}

export interface ApiRole {
  id: number
  name: string
  permissions: string[]
  isSystem: boolean
  userCount: number
}

export interface ApiBranch {
  id: number
  name: string
  address: string
  phone: string
  staffCount: number
  leadCount: number
  studentCount: number
}

/** One entry in an "Assign to" picker. */
export interface AssignableUser {
  id: number
  name: string
  role: string
}

export const staffApi = {
  /** GET /staff */
  list: (): Promise<ApiStaff[]> =>
    USING_REAL_API
      ? request<ApiStaff[]>('/staff')
      : mocked(() =>
          mockStaff.map((s) => ({
            id: s.id,
            publicId: '',
            name: s.name,
            email: s.email,
            phone: s.phone,
            role: s.role,
            branch: s.branch,
            status: s.status,
            joined: s.joined,
            avatar: s.avatar,
            workload: { leads: 0, students: 0, applications: 0 },
          })),
        ),

  /** GET /staff/:id */
  get: (id: number): Promise<ApiStaff | null> =>
    USING_REAL_API
      ? request<ApiStaff>(`/staff/${id}`).catch(() => null)
      : mocked(() => null),

  /** GET /staff/assignable — active staff for the "Assign to" pickers. */
  assignable: (): Promise<AssignableUser[]> =>
    USING_REAL_API
      ? request<AssignableUser[]>('/staff/assignable')
      : mocked(() =>
          mockStaff
            .filter((s) => s.status === 'Active')
            .map((s) => ({ id: s.id, name: s.name, role: s.role })),
        ),

  /** POST /staff */
  create: (data: {
    name: string
    email: string
    role: string
    phone?: string
    branch?: string
    password?: string
  }): Promise<ApiStaff> =>
    request<ApiStaff>('/staff', { method: 'POST', body: JSON.stringify(data) }),

  /** PATCH /staff/:id */
  update: (id: number, patch: Partial<Omit<ApiStaff, 'id' | 'workload'>> & { password?: string }) =>
    request<ApiStaff>(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  /** DELETE /staff/:id — soft delete, so historical assignments still resolve. */
  remove: (id: number): Promise<void> =>
    request<{ ok: boolean }>(`/staff/${id}`, { method: 'DELETE' }).then(() => undefined),

  /** GET /roles */
  roles: (): Promise<ApiRole[]> =>
    USING_REAL_API
      ? request<ApiRole[]>('/roles')
      : mocked(() =>
          mockRoles.map((r) => ({
            id: r.id,
            name: r.name,
            permissions: r.permissions,
            isSystem: r.system,
            userCount: 0,
          })),
        ),

  /** GET /branches */
  branches: (): Promise<ApiBranch[]> =>
    USING_REAL_API
      ? request<ApiBranch[]>('/branches')
      : mocked(() => []),
}
