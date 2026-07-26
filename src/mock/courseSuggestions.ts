// Shared course-suggestion store. Both the admin "Course Suggestion" tab
// (LeadCourseSuggestionTab, reused by the student detail page) and the student
// portal read/write these same localStorage keys, so a suggestion shared by a
// counsellor shows up for the student, and a student's Approve/Reject shows up
// back in the admin "Accepted?" column. Docs: docs/superpowers/mock-data/student.md.

/** A file the office shared (title + filename bundled in `file`). */
export interface FileSuggestion {
  date: string
  file: string // "Title — filename.pdf"
  accepted: string // '--' | 'Approved' | 'Rejected'
}

/** A course pushed from the Course Finder. */
export interface CfSuggestion {
  date: string
  course: string
  university: string
  intake: string
  accepted: string // '--' | 'Approved' | 'Rejected'
}

const FILE_KEY = 'unidest-lead-suggestions'
const CF_KEY = 'unidest-cf-suggestions' // also written by the Course Finder page

function loadList<T>(key: string, personId: number): T[] {
  try {
    const all = JSON.parse(localStorage.getItem(key) ?? '{}')
    return Array.isArray(all[personId]) ? (all[personId] as T[]) : []
  } catch {
    return []
  }
}

function saveList<T>(key: string, personId: number, list: T[]) {
  try {
    const all = JSON.parse(localStorage.getItem(key) ?? '{}')
    all[personId] = list
    localStorage.setItem(key, JSON.stringify(all))
  } catch {
    // Storage blocked — changes stay in-memory for this session.
  }
}

export const loadFileSuggestions = (personId: number) => loadList<FileSuggestion>(FILE_KEY, personId)
export const saveFileSuggestions = (personId: number, list: FileSuggestion[]) =>
  saveList(FILE_KEY, personId, list)
export const loadCfSuggestions = (personId: number) => loadList<CfSuggestion>(CF_KEY, personId)
export const saveCfSuggestions = (personId: number, list: CfSuggestion[]) =>
  saveList(CF_KEY, personId, list)

/** Set (and persist) the `accepted` value of one entry; returns the new list. */
export function setFileSuggestionAccepted(personId: number, index: number, accepted: string) {
  const list = loadFileSuggestions(personId).map((s, i) => (i === index ? { ...s, accepted } : s))
  saveFileSuggestions(personId, list)
  return list
}

export function setCfSuggestionAccepted(personId: number, index: number, accepted: string) {
  const list = loadCfSuggestions(personId).map((s, i) => (i === index ? { ...s, accepted } : s))
  saveCfSuggestions(personId, list)
  return list
}

/* ---- Demo seed (so the portal isn't empty before anything is shared) ---- */

const FILE_SEED: FileSuggestion[] = [
  { date: '28 Mar 2026', file: 'University shortlist for UK — uk-shortlist.pdf', accepted: 'Approved' },
]

// Titles/universities match real `finderCourses` rows so the portal can enrich
// each card (city / country / study level / duration) via finderCourseByTitle.
const CF_SEED: CfSuggestion[] = [
  { date: '14-01-2026', course: 'MSc Data Science', university: 'University of Birmingham', intake: 'Sep 2026', accepted: '--' },
  { date: '09-01-2026', course: 'Master of Engineering (Electrical)', university: 'University of Melbourne', intake: 'Feb 2027', accepted: 'Approved' },
  { date: '28-12-2025', course: 'MSc Computer Science', university: 'University of Manchester', intake: 'Sep 2026', accepted: '--' },
]

/**
 * Seed the demo student's suggestions once. Idempotent and non-destructive: it
 * only writes when the person has no suggestions yet, so real Course Finder /
 * admin-shared data is never overwritten.
 */
export function ensureCourseSuggestionsSeed(personId: number) {
  if (loadFileSuggestions(personId).length === 0 && loadCfSuggestions(personId).length === 0) {
    saveFileSuggestions(personId, FILE_SEED)
    saveCfSuggestions(personId, CF_SEED)
  }
}
