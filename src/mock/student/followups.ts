// Student follow-up records, keyed by student id. A follow-up captures the
// details of a contact attempt (call / walk-in / etc.), the resulting
// application status, and the next scheduled follow-up. Persisted to
// localStorage (prototype); replaced by an API in Phase 2. Modeled on
// demo.eductrl.com's student "New Follow-up Record" dialog.

export interface FollowupRecord {
  id: number
  details: string
  mode: string // Inbound Call / Outbound Call / Video-Call / Walk-In / Others
  status: string // resulting application/student status
  /** Scheduled next follow-up, display string (e.g. "28 Jul 2026, 3:30 PM"); '' = none. */
  next: string
  /** When this record was logged, e.g. "28 Jul 2026, 11:05 AM". */
  at: string
  by: string
}

/** Modes of communication offered in the dialog (reference set). */
export const followupModes = [
  'Inbound Call',
  'Outbound Call',
  'Video-Call',
  'Walk-In',
  'Others',
] as const

const KEY = 'unidest-student-followups'

function loadAll(): Record<number, FollowupRecord[]> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

/** Follow-up records for one student, newest first. */
export function loadFollowups(studentId: number): FollowupRecord[] {
  const all = loadAll()
  return Array.isArray(all[studentId]) ? all[studentId] : []
}

function persist(studentId: number, records: FollowupRecord[]) {
  try {
    const all = loadAll()
    all[studentId] = records
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // Storage blocked — the record stays in-memory for this session.
  }
}

/**
 * Add a follow-up record (newest first) and return the updated list. The
 * caller supplies `at`/timestamps so this stays free of Date() side effects.
 */
export function addFollowup(
  studentId: number,
  rec: Omit<FollowupRecord, 'id'>,
): FollowupRecord[] {
  const records = loadFollowups(studentId)
  const id = records.length ? Math.max(...records.map((r) => r.id)) + 1 : 1
  const next = [{ id, ...rec }, ...records]
  persist(studentId, next)
  return next
}

/** The most recent scheduled next-follow-up for a student (''/undefined = none). */
export function nextFollowupFor(studentId: number): string {
  return loadFollowups(studentId).find((r) => r.next)?.next ?? ''
}
