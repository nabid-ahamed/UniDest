// Per-student webinar registrations for the portal "Webinar & Events" page.
// Registering also increments the shared webinar's `enrolledUsers` (via the
// admin Webinars module), so the office's enrolment count reflects it.
// Docs: docs/superpowers/mock-data/student.md.

import { webinars, saveWebinars } from '../webinars'

const KEY = 'unidest-webinar-registrations'

/** Webinar ids the student has registered for. */
export function loadRegistrations(studentId: number): number[] {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return Array.isArray(all[studentId]) ? all[studentId] : []
  } catch {
    return []
  }
}

export function isRegistered(studentId: number, webinarId: number): boolean {
  return loadRegistrations(studentId).includes(webinarId)
}

/**
 * Register the student for a webinar. Persists the registration and bumps the
 * webinar's `enrolledUsers` on the shared record. Returns the new id list.
 */
export function registerForWebinar(studentId: number, webinarId: number): number[] {
  const regs = loadRegistrations(studentId)
  if (regs.includes(webinarId)) return regs
  const next = [...regs, webinarId]
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    all[studentId] = next
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // Storage blocked — registration stays in-memory for this session.
  }
  // Reflect the enrolment on the shared webinar (admin Webinars page reads it).
  const w = webinars.find((x) => x.id === webinarId)
  if (w) {
    w.enrolledUsers = (w.enrolledUsers ?? 0) + 1
    saveWebinars(webinars)
  }
  return next
}
