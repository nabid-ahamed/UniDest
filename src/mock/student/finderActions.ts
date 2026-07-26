// Student-side Course Finder actions: bookmarks + "Apply" (which adds the
// course to the student's Course Preferences — the same `unidest-lead-programs`
// store the Study Abroad Apply → Course Preferences tab reads).
// Docs: docs/superpowers/mock-data/student.md.

import type { FinderCourse } from '../courseFinder'

const BOOKMARKS_KEY = 'unidest-finder-bookmarks'
const PROGRAMS_KEY = 'unidest-lead-programs'
const PRIORITIES = ['1st Preference', '2nd Preference', '3rd Preference']

/* ---- Bookmarks (per student) ---- */

export function loadBookmarks(studentId: number): number[] {
  try {
    const all = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? '{}')
    return Array.isArray(all[studentId]) ? all[studentId] : []
  } catch {
    return []
  }
}

/** Toggle a course bookmark; returns the new id list. */
export function toggleBookmark(studentId: number, courseId: number): number[] {
  const current = loadBookmarks(studentId)
  const next = current.includes(courseId)
    ? current.filter((id) => id !== courseId)
    : [...current, courseId]
  try {
    const all = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? '{}')
    all[studentId] = next
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(all))
  } catch {
    // Storage blocked — bookmark stays in-memory for this session.
  }
  return next
}

/* ---- Apply → add to Course Preferences ---- */

interface Program {
  priority: string
  country: string
  university: string
  course: string
  intake: string
  courseId: string
}

function loadPrograms(studentId: number): Program[] {
  try {
    const all = JSON.parse(localStorage.getItem(PROGRAMS_KEY) ?? '{}')
    return Array.isArray(all[studentId]) ? all[studentId] : []
  } catch {
    return []
  }
}

/**
 * Add a finder course to the student's Course Preferences. Returns `false` if
 * the program is already there (so the caller can message accordingly).
 */
export function applyToCourse(studentId: number, course: FinderCourse): boolean {
  const list = loadPrograms(studentId)
  if (list.some((p) => p.course === course.title && p.university === course.university)) return false

  const program: Program = {
    priority: PRIORITIES[Math.min(list.length, PRIORITIES.length - 1)],
    country: course.country,
    university: course.university,
    course: course.title,
    intake: course.intakes[0] ? `${course.intakes[0]} 2026` : '--',
    courseId: String(course.id),
  }
  try {
    const all = JSON.parse(localStorage.getItem(PROGRAMS_KEY) ?? '{}')
    all[studentId] = [...list, program]
    localStorage.setItem(PROGRAMS_KEY, JSON.stringify(all))
  } catch {
    // Storage blocked — the preference just won't persist.
  }
  return true
}
