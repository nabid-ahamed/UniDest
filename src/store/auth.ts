import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  name: string
  email: string
  role: string
  phone?: string
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  /** Mock sign-in. Replaced by a real API call in Phase 2. */
  login: (email: string, role?: string) => void
  logout: () => void
  /** Update the signed-in user's own profile (Basic Info page). */
  updateUser: (patch: Partial<AuthUser>) => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (email, role = 'Administrator') =>
        set({
          user: {
            name: email.split('@')[0].replace(/[._]/g, ' ') || 'Admin',
            email,
            role,
          },
          isAuthenticated: true,
        }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateUser: (patch) =>
        set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
    }),
    { name: 'unidest-auth' },
  ),
)
