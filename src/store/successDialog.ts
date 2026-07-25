import { create } from 'zustand'

interface SuccessDialogState {
  open: boolean
  title: string
  message: string
  /** Open the global success modal. Title defaults to "Deleted!". */
  show: (message: string, title?: string) => void
  close: () => void
}

// A single app-wide success modal (the SweetAlert-style "Deleted!" popup).
// Lives in AdminLayout so it survives the route change when a detail page
// deletes a record and navigates back to its list.
export const useSuccessDialog = create<SuccessDialogState>((set) => ({
  open: false,
  title: 'Deleted!',
  message: '',
  show: (message, title = 'Deleted!') => set({ open: true, message, title }),
  close: () => set({ open: false }),
}))

/** Imperative helper — trigger the success modal from anywhere, no hook needed. */
export const showSuccessDialog = (message: string, title = 'Deleted!') =>
  useSuccessDialog.getState().show(message, title)
