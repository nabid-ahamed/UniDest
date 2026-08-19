/**
 * Auth endpoints. Unlike the other resources these are real from day one —
 * there was never a mock login worth preserving, only hardcoded credentials
 * in the login page.
 */
import { request } from '../client'

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

export const authApi = {
  /** POST /auth/login — throws ApiError(401) on bad credentials. */
  login: (email: string, password: string) =>
    request<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /** POST /auth/refresh — swap a refresh token for a fresh pair. */
  refresh: (refreshToken: string) =>
    request<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  /** GET /auth/me — who the current access token belongs to. */
  me: () => request<ApiAuthUser>('/auth/me'),

  /**
   * POST /auth/logout. Stateless on the server, so this is best-effort: the
   * client discards its tokens regardless of the response.
   */
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
}
