import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  name: string
  email: string
  role: string
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  /** Mock sign-in. Replaced by a real API call in Phase 2. */
  login: (email: string) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (email) =>
        set({
          user: {
            name: email.split('@')[0].replace(/[._]/g, ' ') || 'Admin',
            email,
            role: 'Administrator',
          },
          isAuthenticated: true,
        }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'unidest-auth' },
  ),
)
