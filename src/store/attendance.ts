import { create } from 'zustand'

interface AttendanceState {
  checkedIn: boolean
  setCheckedIn: (v: boolean) => void
}

/** Shared check-in state so the header (sign-out) can block logout while clocked-in. */
export const useAttendance = create<AttendanceState>((set) => ({
  checkedIn: false,
  setCheckedIn: (v) => set({ checkedIn: v }),
}))
