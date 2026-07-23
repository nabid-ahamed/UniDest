// Mock data for the Course Management module (Courses / Course Categories /
// Universities), modeled on the EduCtrl demo /admin/coursemanagement pages.
//
// It reuses the existing Course Finder catalogue as the seed for courses, then
// derives Universities and Categories from that same catalogue — so the three
// sub-modules stay connected (a course points at one university + one category,
// and each university/category reports its live course count) with no duplicated
// source of truth. Everything persists to localStorage like the Staff module.
// Docs: docs/superpowers/mock-data/adminpage.md. Replace with real API in Phase 2.

import {
  finderCourses,
  finderStudyLevels,
  studyAreas,
  disciplineAreas,
  intakeMonths,
  type FinderCourse,
} from './courseFinder'

export { finderStudyLevels as studyLevels, intakeMonths }

/* ------------------------------------------------------------------ */
/* Shared vocab                                                        */
/* ------------------------------------------------------------------ */

/** Courses use the demo's Enabled / Disabled wording. */
export const courseStatuses = ['Enabled', 'Disabled'] as const
export type CourseStatus = (typeof courseStatuses)[number]

/** Universities and Categories use Active / Inactive. */
export const activeStatuses = ['Active', 'Inactive'] as const
export type ActiveStatus = (typeof activeStatuses)[number]

export const universityTypes = ['Public', 'Private'] as const
export type UniversityType = (typeof universityTypes)[number]

export const currencies = ['USD', 'GBP', 'CAD', 'AUD', 'EUR', 'NZD'] as const

/** Short currency name for the fee cell, parsed from "USD 100000". */
export function feeCurrency(fee: string | null): string {
  return fee?.match(/^[A-Z]{3}/)?.[0] ?? ''
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** A managed course = the finder course plus management-only fields. */
export interface ManagedCourse extends FinderCourse {
  status: CourseStatus
  concentration: string
  durationMonths: number | null
  description: string
  entryRequirements: string
  websiteUrl: string
}

export interface University {
  id: number
  name: string
  country: string
  city: string
  website: string
  type: UniversityType
  established: number | null
  ranking: number | null
  showToAgent: boolean
  logoClass: string
  status: ActiveStatus
}

/** Flat node in the Study Area > Discipline Area tree. parentId null = top. */
export interface CourseCategory {
  id: number
  name: string
  parentId: number | null
  description: string
  displayOrder: number
  status: ActiveStatus
}

/* ------------------------------------------------------------------ */
/* Seeds — derived from the shared Course Finder catalogue             */
/* ------------------------------------------------------------------ */

const COURSES_KEY = 'unidest-courses'
const UNIVERSITIES_KEY = 'unidest-universities'
const CATEGORIES_KEY = 'unidest-course-categories'

// Convert the finder duration (years) into months for the form's field.
const toMonths = (years: number | null) => (years == null ? null : Math.round(years * 12))

const seedCourses: ManagedCourse[] = finderCourses.map((c, i) => ({
  ...c,
  status: i % 7 === 3 ? 'Disabled' : 'Enabled',
  concentration: c.disciplineArea,
  durationMonths: toMonths(c.durationYears),
  description: `${c.title} at ${c.university} — a ${c.studyLevel} program in ${c.studyArea}.`,
  entryRequirements:
    c.ielts != null
      ? `IELTS ${c.ielts} (no band below ${c.ieltsNoBand}). Academic transcripts and a statement of purpose required.`
      : 'Academic transcripts and a statement of purpose required.',
  websiteUrl: '',
}))

// University metadata, keyed by the exact name used in finderCourses so the
// derived list always lines up with the courses that reference it.
const UNI_META: Record<
  string,
  { website: string; type: UniversityType; established: number; ranking: number | null; showToAgent: boolean }
> = {
  'University of Newcastle': { website: 'newcastle.edu.au', type: 'Public', established: 1965, ranking: 173, showToAgent: true },
  'Kent State University': { website: 'kent.edu', type: 'Public', established: 1910, ranking: 401, showToAgent: true },
  'Marshall University': { website: 'marshall.edu', type: 'Public', established: 1837, ranking: 601, showToAgent: false },
  'University of New Haven': { website: 'newhaven.edu', type: 'Private', established: 1920, ranking: 701, showToAgent: true },
  'University of Manchester': { website: 'manchester.ac.uk', type: 'Public', established: 1824, ranking: 34, showToAgent: true },
  'University of Birmingham': { website: 'birmingham.ac.uk', type: 'Public', established: 1900, ranking: 84, showToAgent: true },
  'University of Toronto': { website: 'utoronto.ca', type: 'Public', established: 1827, ranking: 21, showToAgent: true },
  'Conestoga College': { website: 'conestogac.on.ca', type: 'Public', established: 1967, ranking: null, showToAgent: true },
  'University of Melbourne': { website: 'unimelb.edu.au', type: 'Public', established: 1853, ranking: 14, showToAgent: true },
  'Monash University': { website: 'monash.edu', type: 'Public', established: 1958, ranking: 37, showToAgent: true },
  'Technical University of Munich': { website: 'tum.de', type: 'Public', established: 1868, ranking: 28, showToAgent: false },
  'University of Auckland': { website: 'auckland.ac.nz', type: 'Public', established: 1883, ranking: 65, showToAgent: true },
  'Arizona State University': { website: 'asu.edu', type: 'Public', established: 1885, ranking: 179, showToAgent: true },
  'Braemar College': { website: 'braemarcollege.com', type: 'Private', established: 1995, ranking: null, showToAgent: false },
}

const seedUniversities: University[] = (() => {
  const seen = new Map<string, University>()
  let id = 1
  for (const c of finderCourses) {
    if (seen.has(c.university)) continue
    const meta = UNI_META[c.university] ?? {
      website: '',
      type: 'Public' as UniversityType,
      established: 1900,
      ranking: null,
      showToAgent: true,
    }
    seen.set(c.university, {
      id: id++,
      name: c.university,
      country: c.country,
      city: c.city,
      logoClass: c.logoClass,
      status: 'Active',
      ...meta,
    })
  }
  return [...seen.values()]
})()

const CATEGORY_DESC: Record<string, string> = {
  Engineering: 'Civil, electrical, mechanical and allied engineering programs.',
  IT: 'Software, data, cybersecurity and interactive media programs.',
  'Commerce, Business and Administration': 'Accounting, finance, management and marketing programs.',
  Health: 'Public health, nursing and pharmacy programs.',
  Law: 'International and corporate law programs.',
  'Architecture and Building': 'Architecture and construction management programs.',
  Mathematics: 'Applied mathematics and statistics programs.',
  Education: 'Teaching, early childhood and language education programs.',
}

// Top-level study areas first (stable ids), then their discipline children.
const seedCategories: CourseCategory[] = (() => {
  const rows: CourseCategory[] = []
  let id = 1
  const parentId = new Map<string, number>()
  studyAreas.forEach((area, i) => {
    const pid = id++
    parentId.set(area, pid)
    rows.push({
      id: pid,
      name: area,
      parentId: null,
      description: CATEGORY_DESC[area] ?? '',
      displayOrder: (i + 1) * 10,
      status: 'Active',
    })
  })
  for (const area of studyAreas) {
    ;(disciplineAreas[area] ?? []).forEach((disc, j) => {
      rows.push({
        id: id++,
        name: disc,
        parentId: parentId.get(area) ?? null,
        description: '',
        displayOrder: (j + 1) * 10,
        status: 'Active',
      })
    })
  }
  return rows
})()

/* ------------------------------------------------------------------ */
/* Persistence (same pattern as the Staff module)                      */
/* ------------------------------------------------------------------ */

function load<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return seed
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : seed
  } catch {
    return seed
  }
}

function save<T>(key: string, value: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage blocked — changes stay in-memory for this session.
  }
}

export const courses: ManagedCourse[] = load(COURSES_KEY, seedCourses)
export const universities: University[] = load(UNIVERSITIES_KEY, seedUniversities)
export const courseCategories: CourseCategory[] = load(CATEGORIES_KEY, seedCategories)

const nextId = <T extends { id: number }>(list: T[]) => Math.max(0, ...list.map((x) => x.id)) + 1

/* ------------------------- Courses CRUD --------------------------- */

export const getCourse = (id: number) => courses.find((c) => c.id === id)

export function addCourse(data: Omit<ManagedCourse, 'id'>): ManagedCourse {
  const course: ManagedCourse = { ...data, id: nextId(courses) }
  courses.unshift(course)
  save(COURSES_KEY, courses)
  return course
}

export function updateCourse(id: number, patch: Partial<Omit<ManagedCourse, 'id'>>) {
  const course = courses.find((c) => c.id === id)
  if (!course) return
  Object.assign(course, patch)
  save(COURSES_KEY, courses)
}

export function toggleCourseStatus(id: number) {
  const course = courses.find((c) => c.id === id)
  if (!course) return
  course.status = course.status === 'Enabled' ? 'Disabled' : 'Enabled'
  save(COURSES_KEY, courses)
}

export function deleteCourse(id: number) {
  const i = courses.findIndex((c) => c.id === id)
  if (i >= 0) courses.splice(i, 1)
  save(COURSES_KEY, courses)
}

/* ----------------------- Universities CRUD ------------------------ */

export const getUniversity = (id: number) => universities.find((u) => u.id === id)
export const universityByName = (name: string) => universities.find((u) => u.name === name)

export function addUniversity(data: Omit<University, 'id'>): University {
  const uni: University = { ...data, id: nextId(universities) }
  universities.unshift(uni)
  save(UNIVERSITIES_KEY, universities)
  return uni
}

export function updateUniversity(id: number, patch: Partial<Omit<University, 'id'>>) {
  const uni = universities.find((u) => u.id === id)
  if (!uni) return
  Object.assign(uni, patch)
  save(UNIVERSITIES_KEY, universities)
}

export function deleteUniversity(id: number) {
  const i = universities.findIndex((u) => u.id === id)
  if (i >= 0) universities.splice(i, 1)
  save(UNIVERSITIES_KEY, universities)
}

/* ------------------------ Categories CRUD ------------------------- */

export const getCategory = (id: number) => courseCategories.find((c) => c.id === id)
export const topCategories = () =>
  courseCategories.filter((c) => c.parentId === null).sort((a, b) => a.displayOrder - b.displayOrder)
export const childCategories = (parentId: number) =>
  courseCategories.filter((c) => c.parentId === parentId).sort((a, b) => a.displayOrder - b.displayOrder)

export function addCategory(data: Omit<CourseCategory, 'id'>): CourseCategory {
  const cat: CourseCategory = { ...data, id: nextId(courseCategories) }
  courseCategories.push(cat)
  save(CATEGORIES_KEY, courseCategories)
  return cat
}

export function updateCategory(id: number, patch: Partial<Omit<CourseCategory, 'id'>>) {
  const cat = courseCategories.find((c) => c.id === id)
  if (!cat) return
  Object.assign(cat, patch)
  save(CATEGORIES_KEY, courseCategories)
}

export function deleteCategory(id: number) {
  // Removing a parent also removes its orphaned children.
  const remove = new Set<number>([id])
  courseCategories.forEach((c) => c.parentId === id && remove.add(c.id))
  for (const rid of remove) {
    const i = courseCategories.findIndex((c) => c.id === rid)
    if (i >= 0) courseCategories.splice(i, 1)
  }
  save(CATEGORIES_KEY, courseCategories)
}

/* ------------------------------------------------------------------ */
/* Live cross-module connections                                       */
/* ------------------------------------------------------------------ */

export const coursesForUniversity = (name: string) => courses.filter((c) => c.university === name)

/** Courses under a category — a top-level area matches studyArea, a child
 *  (discipline) matches disciplineArea. */
export function coursesForCategory(cat: CourseCategory): ManagedCourse[] {
  return cat.parentId === null
    ? courses.filter((c) => c.studyArea === cat.name)
    : courses.filter((c) => c.disciplineArea === cat.name)
}

export const categoryCourseCount = (cat: CourseCategory) => coursesForCategory(cat).length

/** Study-area names for the course form's Category dropdown (from live tree). */
export const categoryNames = () => topCategories().map((c) => c.name)
export const universityNames = () => universities.map((u) => u.name).sort()
