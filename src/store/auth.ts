import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  name: string
  email: string
  role: string
  phone?: string
  /** Profile picture (data URL); falls back to the name initial when absent. */
  avatar?: string
  /** Student No when the user is a student (drives which portal record loads). */
  studentNo?: string
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  /**
   * JWT from POST /auth/login. This store is the single source of truth for it —
   * `src/lib/api/client.ts` reads it from here via `getAccessToken()` rather
   * than keeping a second copy in its own localStorage key, which would drift.
   */
  accessToken: string | null
  refreshToken: string | null
  /** Permission ids from the user's role (see server/prisma/seed.ts). */
  permissions: string[]
  /**
   * Set while an admin is "logged in as" a student. Holds the original admin so
   * a one-click "Return to admin" can restore them. null when not impersonating.
   */
  impersonator: AuthUser | null
  /** Mock sign-in — kept for impersonation and any screen not yet on the API. */
  login: (email: string, role?: string) => void
  /** Real sign-in: store the API's user and tokens. */
  signIn: (payload: {
    user: AuthUser
    accessToken: string
    refreshToken: string
    permissions: string[]
  }) => void
  logout: () => void
  /** Update the signed-in user's own profile (Basic Info page). */
  updateUser: (patch: Partial<AuthUser>) => void
  /**
   * Impersonate a student ("Login As" from the admin Students list). Stashes the
   * current admin as `impersonator`, then becomes the student. Prototype only —
   * real session-swap is Phase 2.
   */
  loginAs: (student: { name: string; email: string; studentNo: string }) => void
  /** Restore the original admin after impersonating. */
  stopImpersonating: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      permissions: [],
      impersonator: null,
      login: (email, role = 'Administrator') =>
        set({
          user: {
            name: email.split('@')[0].replace(/[._]/g, ' ') || 'Admin',
            email,
            role,
          },
          isAuthenticated: true,
          impersonator: null,
        }),
      signIn: ({ user, accessToken, refreshToken, permissions }) =>
        set({ user, accessToken, refreshToken, permissions, isAuthenticated: true, impersonator: null }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          permissions: [],
          impersonator: null,
        }),
      updateUser: (patch) =>
        set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
      loginAs: (student) =>
        set((s) => ({
          // Keep the first admin if already impersonating, so nested "Login As"
          // still returns all the way back to the real admin.
          impersonator: s.impersonator ?? s.user,
          user: {
            name: student.name,
            email: student.email,
            role: 'Student',
            studentNo: student.studentNo,
          },
          isAuthenticated: true,
        })),
      stopImpersonating: () =>
        set((s) =>
          s.impersonator
            ? { user: s.impersonator, impersonator: null, isAuthenticated: true }
            : s,
        ),
    }),
    { name: 'unidest-auth' },
  ),
)

/**
 * Read the access token outside React.
 *
 * `src/lib/api/client.ts` attaches the Authorization header from plain
 * functions, where hooks are unavailable. Going through the store (rather than
 * a separate localStorage key) keeps one source of truth, so signing out
 * cannot leave a stale token behind.
 */
export const getAccessToken = () => useAuth.getState().accessToken

/** Clear the session from non-React code — used by the client's 401 handler. */
export const clearSession = () => useAuth.getState().logout()
