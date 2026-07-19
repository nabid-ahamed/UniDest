import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GeoLocation {
  lat: number
  lng: number
}

interface AttendanceState {
  checkedIn: boolean
  /** ms timestamp of check-in; elapsed time is derived from this so it survives refresh. */
  checkInAt: number | null
  /** Location captured at check-in. */
  checkInLocation: GeoLocation | null
  checkIn: (location: GeoLocation) => void
  checkOut: () => void
  /** Push checkInAt forward by a break's paused duration so it isn't counted as work time. */
  addPausedMs: (ms: number) => void
}

export const useAttendance = create<AttendanceState>()(
  persist(
    (set) => ({
      checkedIn: false,
      checkInAt: null,
      checkInLocation: null,
      checkIn: (location) =>
        set({ checkedIn: true, checkInAt: Date.now(), checkInLocation: location }),
      checkOut: () => set({ checkedIn: false, checkInAt: null, checkInLocation: null }),
      addPausedMs: (ms) =>
        set((s) => ({ checkInAt: s.checkInAt ? s.checkInAt + ms : s.checkInAt })),
    }),
    { name: 'unidest-attendance' },
  ),
)
