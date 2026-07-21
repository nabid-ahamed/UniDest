import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebar: () => void
}

// Persisted: sidebar menu clicks do a full page reload, so without storage a
// collapsed sidebar would pop back open on every navigation.
export const useUI = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      openSidebar: () => set({ sidebarOpen: true }),
      closeSidebar: () => set({ sidebarOpen: false }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: 'unidest-ui' },
  ),
)
