/**
 * Auth endpoints.
 *
 * These call the real API whenever there is one. The mock branch exists only so
 * a deployed demo build (no backend reachable — see USING_REAL_API in
 * ../client) can still sign in; without it the login form is a dead end there,
 * because every other resource falls back to mocks but auth would not.
 */
import { ApiError, mocked, request, USING_REAL_API } from '../client'
import { roles as mockRoles } from '../../../mock/roles'

/** Mirrors AuthUserDto on the server (server/src/auth/auth.types.ts). */
export interface ApiAuthUser {
  publicId: string
  name: string
  email: string
  /** Exactly the vocabulary src/app/router.tsx gates on. */
  role: 'Administrator' | 'Staff' | 'Student'
  phone?: string | null
  avatar?: string | null
  permissions: string[]
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: ApiAuthUser
}

/**
 * The three demo logins the login page advertises. Name, role and permissions
 * are copied from what POST /auth/login actually returns for the seeded users
 * (server/prisma/seed.ts), so demo mode and API mode gate the UI identically.
 *
 * Super Admin holds the '*' wildcard rather than an enumerated list, and
 * Student holds none — a student's portal routes are gated by role, not by
 * permission ids.
 */
const DEMO_USERS: Record<string, { name: string; role: ApiAuthUser['role']; permissions: string[] }> = {
  'admin@gmail.com': { name: 'Admin', role: 'Administrator', permissions: ['*'] },
  'staff@gmail.com': {
    name: 'Staff User',
    role: 'Staff',
    permissions: mockRoles.find((r) => r.name === 'Counsellor')?.permissions ?? [],
  },
  'student@gmail.com': { name: 'Rohan Das', role: 'Student', permissions: [] },
}

function mockLogin(email: string, password: string): AuthTokens {
  const demo = DEMO_USERS[email.toLowerCase().trim()]
  // Same failure the API gives, so the form renders one error path either way.
  if (!demo || password !== '123456') throw new ApiError('Invalid email or password.', 401)

  return {
    accessToken: 'demo-access-token',
    refreshToken: 'demo-refresh-token',
    user: {
      publicId: `demo-${demo.role.toLowerCase()}`,
      name: demo.name,
      email,
      role: demo.role,
      permissions: demo.permissions,
    },
  }
}

export const authApi = {
  /** POST /auth/login — throws ApiError(401) on bad credentials. */
  login: (email: string, password: string) =>
    USING_REAL_API
      ? request<AuthTokens>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
      : mocked(() => mockLogin(email, password)),

  /** POST /auth/refresh — swap a refresh token for a fresh pair. */
  refresh: (refreshToken: string) =>
    USING_REAL_API
      ? request<AuthTokens>('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        })
      : // A demo session never expires, so there is nothing to refresh.
        mocked<AuthTokens>(() => {
          throw new ApiError('Session refresh is unavailable in demo mode.', 401)
        }),

  /** GET /auth/me — who the current access token belongs to. */
  me: () =>
    USING_REAL_API
      ? request<ApiAuthUser>('/auth/me')
      : mocked<ApiAuthUser>(() => {
          throw new ApiError('Not available in demo mode.', 401)
        }),

  /**
   * POST /auth/logout. Stateless on the server, so this is best-effort: the
   * client discards its tokens regardless of the response.
   */
  logout: () =>
    USING_REAL_API
      ? request<{ ok: boolean }>('/auth/logout', { method: 'POST' })
      : mocked(() => ({ ok: true })),
}
