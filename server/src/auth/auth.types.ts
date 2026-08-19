/**
 * Shapes shared across the auth module.
 */

/** What we sign into the access token. Keep it small — it travels on every request. */
export interface JwtPayload {
  /** users.publicId (UUID) — never the sequential id, which must not leak. */
  sub: string
  email: string
  /** Frontend-facing role word, not the DB role name. See `toUiRole`. */
  role: UiRole
  tenantId: number
  permissions: string[]
}

/**
 * The role vocabulary `src/app/router.tsx` already gates on:
 *   isStudent(role) => role === 'Student'   -> /portal
 *   isStaff(role)   => role === 'Staff'     -> limited admin nav
 *   anything else                            -> full admin
 *
 * The API must speak these exact words so routing needs no changes.
 */
export type UiRole = 'Administrator' | 'Staff' | 'Student'

/**
 * Map a database role name (src/mock/staffStore.ts `staffRoles`) onto the three
 * words the router understands. Full backoffice access is deliberately limited
 * to the two managerial roles; everyone else gets the restricted Staff nav.
 */
export function toUiRole(dbRoleName: string): UiRole {
  if (dbRoleName === 'Student') return 'Student'
  if (dbRoleName === 'Super Admin' || dbRoleName === 'Branch Manager') return 'Administrator'
  return 'Staff'
}

/** The user object returned to the SPA on login — mirrors AuthUser in src/store/auth.ts. */
export interface AuthUserDto {
  publicId: string
  name: string
  email: string
  role: UiRole
  phone?: string | null
  avatar?: string | null
  permissions: string[]
}
