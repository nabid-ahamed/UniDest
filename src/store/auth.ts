import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  name: string
  email: string
  role: string
  phone?: string
  /** Student No when the user is a student (drives which portal record loads). */
  studentNo?: string
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  /**
   * Set while an admin is "logged in as" a student. Holds the original admin so
   * a one-click "Return to admin" can restore them. null when not impersonating.
   */
  impersonator: AuthUser | null
  /** Mock sign-in. Replaced by a real API call in Phase 2. */
  login: (email: string, role?: string) => void
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
      logout: () => set({ user: null, isAuthenticated: false, impersonator: null }),
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
