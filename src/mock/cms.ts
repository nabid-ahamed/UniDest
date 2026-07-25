// Mock data for the CMS module, modeled on the EduCtrl demo (/admin/cms/*,
// /admin/blog-posts, /admin/articles, /admin/menu-manager). Six sub-modules:
// Home Page settings, Countries, Blog Posts, Pages, Menu Manager, Newsletter.
//
// Connected to existing modules — the CMS never invents data that another module
// already owns:
//   • Countries derive from the countries present in Course Management universities;
//     each country's "universities" count is read live from that module.
//   • Home Page section toggles reference live counts from Countries, Course
//     categories, Courses, Universities, Webinars, Blog Posts and the Media Library.
//   • Menu "link types" map to real routes/modules (Course Finder, Universities,
//     Webinars, Blog…).
//   • Blog authors come from Staff; newsletter subscribers are seeded from Students.
//
// Persists to localStorage like every other module. Docs live in
// docs/superpowers/mock-data/adminpage.md.

import { staff } from './staff'
import { students } from './students'
import { universities, courses, topCategories } from './courseManagement'
import { webinars } from './webinars'
import { media } from './mediaLibrary'

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

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

const author = (i: number) => staff[i % staff.length]?.name ?? 'Admin Admin'

/* ================================================================== */
/* 1. Home Page & theme settings                                       */
/* ================================================================== */

export const frontendThemes = ['Europa', 'Ganymede', 'Callisto'] as const
export type FrontendTheme = (typeof frontendThemes)[number]

/** Brand colour presets for the public site (primary + accent pair). */
export const brandColors: { id: string; name: string; primary: string; accent: string }[] = [
  { id: 'emerald', name: 'Emerald', primary: '#0d9488', accent: '#f59e0b' },
  { id: 'indigo', name: 'Indigo', primary: '#4f46e5', accent: '#facc15' },
  { id: 'sky', name: 'Sky', primary: '#2563eb', accent: '#f97316' },
  { id: 'rose', name: 'Rose', primary: '#e11d48', accent: '#38bdf8' },
  { id: 'forest', name: 'Forest', primary: '#15803d', accent: '#bbf7d0' },
  { id: 'navy', name: 'Navy', primary: '#1e3a8a', accent: '#f43f5e' },
  { id: 'sunset', name: 'Sunset', primary: '#ea580c', accent: '#0ea5e9' },
  { id: 'teal', name: 'Teal', primary: '#0f766e', accent: '#fde047' },
  { id: 'ink', name: 'Ink', primary: '#111827', accent: '#f59e0b' },
  { id: 'violet', name: 'Violet', primary: '#7c3aed', accent: '#22d3ee' },
  { id: 'crimson', name: 'Crimson', primary: '#be123c', accent: '#fbbf24' },
  { id: 'ocean', name: 'Ocean', primary: '#0369a1', accent: '#fcd34d' },
]

export type LayoutMode = 'minimal' | 'full'

/**
 * A home-page section. `count` (when present) reads a live number from a
 * connected module so the toggle shows what it actually controls.
 */
export interface HomeSection {
  key: string
  label: string
  desc: string
  configurable: boolean
  count?: () => number
}

export const homeSections: HomeSection[] = [
  { key: 'hero', label: 'Hero Banner', desc: 'Full-width headline, sub-text and CTA buttons.', configurable: true },
  { key: 'trustStats', label: 'Trust Stats Strip', desc: 'Students placed, universities, visa success rate.', configurable: true },
  { key: 'whoItsFor', label: "Who It's For", desc: 'Persona cards: students, professionals, parents.', configurable: true },
  { key: 'destinations', label: 'Destinations', desc: 'Study destination country cards — edit via CMS › Countries.', configurable: false, count: () => cmsCountries.filter((c) => c.status !== 'Hidden').length },
  { key: 'studyStreams', label: 'Study Streams', desc: 'Categories — edit via Course Management › Categories.', configurable: false, count: () => topCategories().length },
  { key: 'programs', label: 'Future-Ready Programs', desc: 'Featured courses — mark courses as featured via Course Management.', configurable: false, count: () => courses.length },
  { key: 'services', label: 'Services', desc: 'Admission, visa, scholarships, pre-departure support.', configurable: true },
  { key: 'howItWorks', label: 'How It Works', desc: 'Step-by-step study abroad process.', configurable: true },
  { key: 'successStories', label: 'Success Stories', desc: 'Student testimonials and case studies.', configurable: true },
  { key: 'freeCounselling', label: 'Free Counselling Form', desc: 'Lead capture form — select form and set heading.', configurable: true },
  { key: 'universityLogos', label: 'University Logos', desc: 'Partner logos — edit via Course Management › Universities.', configurable: false, count: () => universities.length },
  { key: 'blogResources', label: 'Blog / Resources', desc: 'Blog articles — edit via CMS › Blog Posts.', configurable: false, count: () => blogPosts.filter((p) => p.status === 'Published').length },
  { key: 'eventsWebinars', label: 'Events & Webinars', desc: 'Upcoming webinars — managed via Webinars module.', configurable: false, count: () => webinars.length },
  { key: 'faq', label: 'FAQ', desc: 'Frequently asked questions accordion.', configurable: true },
  { key: 'finalCta', label: 'Final CTA Banner', desc: 'Call-to-action banner before the footer.', configurable: true },
  { key: 'gallery', label: 'Gallery', desc: 'Office, events and consultancy photos — Media Library.', configurable: false, count: () => media.length },
  { key: 'authGateway', label: 'Auth Gateway', desc: 'Register / Login cards.', configurable: false },
]

export interface HomeSettings {
  theme: FrontendTheme
  brandColorId: string
  layoutMode: LayoutMode
  sections: Record<string, boolean>
  header: { topBar: boolean; menuBar: boolean; footer: boolean; copyright: boolean }
}

const HOME_KEY = 'unidest-cms-home'

const defaultHomeSettings: HomeSettings = {
  theme: 'Europa',
  brandColorId: 'emerald',
  layoutMode: 'full',
  sections: Object.fromEntries(homeSections.map((s) => [s.key, s.key !== 'authGateway'])),
  header: { topBar: true, menuBar: true, footer: true, copyright: true },
}

export const homeSettings: HomeSettings = (() => {
  try {
    const raw = localStorage.getItem(HOME_KEY)
    if (!raw) return { ...defaultHomeSettings }
    const parsed = JSON.parse(raw)
    // Merge so newly-added sections always have a value.
    return {
      ...defaultHomeSettings,
      ...parsed,
      sections: { ...defaultHomeSettings.sections, ...(parsed.sections ?? {}) },
      header: { ...defaultHomeSettings.header, ...(parsed.header ?? {}) },
    }
  } catch {
    return { ...defaultHomeSettings }
  }
})()

export function saveHomeSettings(patch: Partial<HomeSettings>) {
  Object.assign(homeSettings, patch)
  try {
    localStorage.setItem(HOME_KEY, JSON.stringify(homeSettings))
  } catch {
    // ignore
  }
}

/* ================================================================== */
/* 2. Countries — study destination landing pages                      */
/* ================================================================== */

export const countryStatuses = ['Published', 'Default Only', 'Hidden'] as const
export type CountryStatus = (typeof countryStatuses)[number]

export interface CmsCountry {
  id: number
  name: string
  slug: string // e.g. "study-in-usa"
  status: CountryStatus
  heading: string
  intro: string
}

const COUNTRIES_KEY = 'unidest-cms-countries'

// Countries that already host a partner university are "Published" (they have
// real content); a curated set of extra destinations ship as "Default Only".
const EXTRA_DESTINATIONS = [
  'Ireland', 'France', 'Netherlands', 'Singapore', 'Switzerland', 'Italy', 'Sweden', 'Spain',
]

const seedCountries: CmsCountry[] = (() => {
  const withUnis = Array.from(new Set(universities.map((u) => u.country)))
  const names = [...withUnis, ...EXTRA_DESTINATIONS.filter((c) => !withUnis.includes(c))]
  return names.map((name, i) => ({
    id: i + 1,
    name,
    slug: `study-in-${slugify(name)}`,
    status: withUnis.includes(name) ? 'Published' : 'Default Only',
    heading: `Study in ${name}`,
    intro: `Discover top universities, tuition costs, scholarships and student visa guidance for studying in ${name}.`,
  }))
})()

export const cmsCountries: CmsCountry[] = load(COUNTRIES_KEY, seedCountries)

const persistCountries = () => save(COUNTRIES_KEY, cmsCountries)

export const getCmsCountry = (id: number) => cmsCountries.find((c) => c.id === id)

/** Live number of partner universities in a country (Course Management). */
export const universitiesInCountry = (name: string) =>
  universities.filter((u) => u.country === name).length

export function updateCmsCountry(id: number, patch: Partial<Omit<CmsCountry, 'id'>>) {
  const c = cmsCountries.find((x) => x.id === id)
  if (!c) return
  Object.assign(c, patch)
  if (patch.name && !patch.slug) c.slug = `study-in-${slugify(patch.name)}`
  persistCountries()
}

export function cycleCountryStatus(id: number) {
  const c = cmsCountries.find((x) => x.id === id)
  if (!c) return
  const order = countryStatuses
  c.status = order[(order.indexOf(c.status) + 1) % order.length]
  persistCountries()
}

/* ================================================================== */
/* 3. Blog Posts                                                       */
/* ================================================================== */

export const postStatuses = ['Published', 'Draft'] as const
export type PostStatus = (typeof postStatuses)[number]

const POST_GRADIENTS = [
  'from-sky-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
]

export interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  gradient: string // fallback cover tile
  cover: string | null // uploaded data-URL, else null → gradient
  status: PostStatus
  featured: boolean
  author: string // staff name
  publishedAt: string // "02 Jun 2026"
}

const POSTS_KEY = 'unidest-cms-blog'

const seedPosts: BlogPost[] = [
  {
    id: 1,
    title: 'How to Choose the Right University Abroad for Your Career Goals',
    slug: 'how-to-choose-the-right-university-abroad-for-your-career-goals',
    excerpt: 'A practical framework for matching universities to your long-term career plans, budget and study destination.',
    content:
      'Choosing a university abroad is one of the biggest decisions in a study-abroad journey. Start with your career goal, then work backwards to the programs, countries and universities that support it. Consider rankings in your field, graduate employability, tuition and living costs, scholarship availability and post-study work rights.',
    gradient: POST_GRADIENTS[0],
    cover: null,
    status: 'Published',
    featured: true,
    author: author(0),
    publishedAt: '02 Jun 2026',
  },
  {
    id: 2,
    title: 'How to Network with Professors and Classmates as an International Student',
    slug: 'how-to-network-with-professors-and-classmates-as-an-international-student',
    excerpt: 'Build meaningful academic and professional relationships from your first week on campus.',
    content:
      'Networking as an international student can feel intimidating, but it is one of the highest-return activities of your degree. Attend office hours, join student societies, contribute in seminars and follow up after events. Strong relationships with professors lead to references, research opportunities and referrals.',
    gradient: POST_GRADIENTS[1],
    cover: null,
    status: 'Published',
    featured: true,
    author: author(1),
    publishedAt: '02 Jun 2026',
  },
  {
    id: 3,
    title: 'A Student Guide to Managing Finances While Studying Overseas',
    slug: 'a-student-guide-to-managing-finances-while-studying-overseas',
    excerpt: 'Budgeting, part-time work rules and money-saving tips for life abroad.',
    content:
      'Managing money abroad is about planning ahead. Build a monthly budget covering tuition, rent, food, transport and insurance. Understand your visa work-hour limits, open a local student bank account, and keep an emergency fund for the first month before any income arrives.',
    gradient: POST_GRADIENTS[2],
    cover: null,
    status: 'Draft',
    featured: false,
    author: author(2),
    publishedAt: '18 Jun 2026',
  },
]

export const blogPosts: BlogPost[] = load(POSTS_KEY, seedPosts)

const persistPosts = () => save(POSTS_KEY, blogPosts)
const nextPostId = () => Math.max(0, ...blogPosts.map((p) => p.id)) + 1

export const sortedPosts = () =>
  [...blogPosts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

export const getPost = (id: number) => blogPosts.find((p) => p.id === id)

export function addPost(data: Omit<BlogPost, 'id' | 'gradient'>): BlogPost {
  const id = nextPostId()
  const post: BlogPost = { ...data, id, gradient: POST_GRADIENTS[(id - 1) % POST_GRADIENTS.length] }
  blogPosts.unshift(post)
  persistPosts()
  return post
}

export function updatePost(id: number, patch: Partial<Omit<BlogPost, 'id'>>) {
  const p = blogPosts.find((x) => x.id === id)
  if (!p) return
  Object.assign(p, patch)
  persistPosts()
}

export function togglePostFeatured(id: number) {
  const p = blogPosts.find((x) => x.id === id)
  if (!p) return
  p.featured = !p.featured
  persistPosts()
}

export function deletePost(id: number) {
  const i = blogPosts.findIndex((p) => p.id === id)
  if (i >= 0) blogPosts.splice(i, 1)
  persistPosts()
}

/* ================================================================== */
/* 4. Pages (Articles) — content + module pages                        */
/* ================================================================== */

export const pageTypeLabels = ['Content Page', 'Module Page'] as const
export type PageType = (typeof pageTypeLabels)[number]

export interface CmsPage {
  id: number
  name: string
  slug: string
  type: PageType
  /** For module pages: which module the page renders (country, home, blog…). */
  module: string | null
  status: PostStatus
  content: string
  /** System (module) pages can be edited but never deleted. */
  system: boolean
}

const PAGES_KEY = 'unidest-cms-pages'

const seedPages: CmsPage[] = [
  { id: 1, name: 'Cookie Policy', slug: 'cookie-policy', type: 'Content Page', module: null, status: 'Published', system: false, content: 'This site uses cookies to improve your browsing experience and analyse traffic.' },
  { id: 2, name: 'Terms of Service', slug: 'terms-of-service', type: 'Content Page', module: null, status: 'Published', system: false, content: 'By using this website you agree to our terms of service.' },
  { id: 3, name: 'Privacy Policy', slug: 'privacy-policy', type: 'Content Page', module: null, status: 'Published', system: false, content: 'We respect your privacy and protect the personal data you share with us.' },
  { id: 4, name: 'About Us', slug: 'about-us', type: 'Content Page', module: null, status: 'Published', system: false, content: 'GlobalEd is a study-abroad consultancy helping students reach top universities worldwide.' },
  { id: 5, name: 'Countries', slug: 'study-in', type: 'Module Page', module: 'country', status: 'Published', system: true, content: 'Auto-generated study destination pages — content managed in CMS › Countries.' },
  { id: 6, name: 'The Premier Choice for Study Abroad Aspirants', slug: 'home', type: 'Module Page', module: 'home', status: 'Published', system: true, content: 'The public home page — layout managed in CMS › Home Page.' },
]

export const cmsPages: CmsPage[] = load(PAGES_KEY, seedPages)

const persistPages = () => save(PAGES_KEY, cmsPages)
const nextPageId = () => Math.max(0, ...cmsPages.map((p) => p.id)) + 1

export const getCmsPage = (id: number) => cmsPages.find((p) => p.id === id)

export function addCmsPage(data: Omit<CmsPage, 'id' | 'system' | 'type' | 'module'>): CmsPage {
  const page: CmsPage = { ...data, id: nextPageId(), type: 'Content Page', module: null, system: false }
  cmsPages.push(page)
  persistPages()
  return page
}

export function updateCmsPage(id: number, patch: Partial<Omit<CmsPage, 'id' | 'system'>>) {
  const p = cmsPages.find((x) => x.id === id)
  if (!p) return
  Object.assign(p, patch)
  persistPages()
}

/** Returns false for system/module pages, which can't be removed. */
export function deleteCmsPage(id: number): boolean {
  const p = cmsPages.find((x) => x.id === id)
  if (!p || p.system) return false
  cmsPages.splice(cmsPages.indexOf(p), 1)
  persistPages()
  return true
}

/* ================================================================== */
/* 5. Menu Manager                                                     */
/* ================================================================== */

export const menuGroups = ['main', 'footer'] as const
export type MenuGroup = (typeof menuGroups)[number]

/** Link types a menu item can point at — each maps to a real route/module. */
export const linkTypes: { id: string; label: string; hint: string; tint: string }[] = [
  { id: 'home', label: 'Home Page', hint: 'Site home page', tint: 'bg-sky-100 text-sky-700' },
  { id: 'page', label: 'CMS Page', hint: 'Any CMS page', tint: 'bg-emerald-100 text-emerald-700' },
  { id: 'static', label: 'Static URL', hint: 'Custom URL', tint: 'bg-amber-100 text-amber-700' },
  { id: 'blog', label: 'Blog Posts', hint: 'Blog listing', tint: 'bg-violet-100 text-violet-700' },
  { id: 'course_finder', label: 'Course Finder', hint: 'Course Finder', tint: 'bg-rose-100 text-rose-700' },
  { id: 'study_destinations', label: 'Study Destinations', hint: 'Countries', tint: 'bg-teal-100 text-teal-700' },
  { id: 'universities', label: 'Universities', hint: 'Universities', tint: 'bg-indigo-100 text-indigo-700' },
  { id: 'webinars', label: 'Webinars', hint: 'Webinars & Events', tint: 'bg-cyan-100 text-cyan-700' },
  { id: 'student_login', label: 'Student Login', hint: 'Student Login', tint: 'bg-lime-100 text-lime-700' },
  { id: 'student_signup', label: 'Student Register', hint: 'Student Register', tint: 'bg-fuchsia-100 text-fuchsia-700' },
]

export const linkTypeById = (id: string) => linkTypes.find((l) => l.id === id)

export interface MenuItem {
  id: number
  group: MenuGroup
  label: string
  linkType: string
  parentId: number | null
  newTab: boolean
  order: number
}

const MENU_KEY = 'unidest-cms-menu'

const seedMenu: MenuItem[] = [
  { id: 1, group: 'main', label: 'Home', linkType: 'home', parentId: null, newTab: false, order: 10 },
  { id: 2, group: 'main', label: 'Destinations', linkType: 'study_destinations', parentId: null, newTab: false, order: 20 },
  { id: 3, group: 'main', label: 'Course Finder', linkType: 'course_finder', parentId: null, newTab: false, order: 30 },
  { id: 4, group: 'main', label: 'Universities', linkType: 'universities', parentId: null, newTab: false, order: 40 },
  { id: 5, group: 'main', label: 'Blog', linkType: 'blog', parentId: null, newTab: false, order: 50 },
  { id: 6, group: 'footer', label: 'About Us', linkType: 'page', parentId: null, newTab: false, order: 10 },
  { id: 7, group: 'footer', label: 'Privacy Policy', linkType: 'page', parentId: null, newTab: false, order: 20 },
  { id: 8, group: 'footer', label: 'Student Login', linkType: 'student_login', parentId: null, newTab: false, order: 30 },
]

export const menuItems: MenuItem[] = load(MENU_KEY, seedMenu)

const persistMenu = () => save(MENU_KEY, menuItems)
const nextMenuId = () => Math.max(0, ...menuItems.map((m) => m.id)) + 1

/** Items in a group, ordered, with children nested under their parent. */
export const menuForGroup = (group: MenuGroup) =>
  menuItems.filter((m) => m.group === group).sort((a, b) => a.order - b.order)

export const topMenuItems = (group: MenuGroup) =>
  menuForGroup(group).filter((m) => m.parentId === null)

export const childMenuItems = (parentId: number) =>
  menuItems.filter((m) => m.parentId === parentId).sort((a, b) => a.order - b.order)

export function addMenuItem(data: Omit<MenuItem, 'id' | 'order'>): MenuItem {
  const siblings = menuItems.filter((m) => m.group === data.group && m.parentId === data.parentId)
  const order = Math.max(0, ...siblings.map((s) => s.order)) + 10
  const item: MenuItem = { ...data, id: nextMenuId(), order }
  menuItems.push(item)
  persistMenu()
  return item
}

export function updateMenuItem(id: number, patch: Partial<Omit<MenuItem, 'id'>>) {
  const m = menuItems.find((x) => x.id === id)
  if (!m) return
  Object.assign(m, patch)
  persistMenu()
}

export function deleteMenuItem(id: number) {
  // Remove the item and re-parent any children to top level.
  menuItems.filter((m) => m.parentId === id).forEach((child) => (child.parentId = null))
  const i = menuItems.findIndex((m) => m.id === id)
  if (i >= 0) menuItems.splice(i, 1)
  persistMenu()
}

/** Move an item up/down among its siblings by swapping order values. */
export function moveMenuItem(id: number, dir: -1 | 1) {
  const m = menuItems.find((x) => x.id === id)
  if (!m) return
  const siblings = menuItems
    .filter((x) => x.group === m.group && x.parentId === m.parentId)
    .sort((a, b) => a.order - b.order)
  const idx = siblings.indexOf(m)
  const swap = siblings[idx + dir]
  if (!swap) return
  ;[m.order, swap.order] = [swap.order, m.order]
  persistMenu()
}

/* ================================================================== */
/* 6. Newsletter subscribers                                           */
/* ================================================================== */

export interface NewsletterSubscriber {
  id: number
  email: string
  subscribedAt: string // ISO datetime
  ip: string
}

const NEWSLETTER_KEY = 'unidest-cms-newsletter'

// Seeded partly from real Student emails (connection) plus public sign-ups.
const seedSubscribers: NewsletterSubscriber[] = (() => {
  const fromStudents = students.slice(0, 6).map((s, i) => ({
    id: i + 1,
    email: s.email,
    subscribedAt: `2026-07-${String(4 + i).padStart(2, '0')}T09:${String(12 + i * 7).padStart(2, '0')}`,
    ip: `103.51.${20 + i}.${45 + i * 3}`,
  }))
  const publicSignups = [
    { email: 'ley.eq.a.l.a.79@gmail.com', subscribedAt: '2026-07-14T13:04', ip: '171.25.193.82' },
    { email: 'priya.newsletter@outlook.com', subscribedAt: '2026-07-18T20:31', ip: '45.118.99.140' },
    { email: 'daniel.abroad@yahoo.com', subscribedAt: '2026-07-22T07:56', ip: '182.160.114.7' },
  ].map((s, i) => ({ id: fromStudents.length + i + 1, ...s }))
  return [...fromStudents, ...publicSignups]
})()

export const newsletterSubscribers: NewsletterSubscriber[] = load(NEWSLETTER_KEY, seedSubscribers)

const persistSubscribers = () => save(NEWSLETTER_KEY, newsletterSubscribers)

export const sortedSubscribers = () =>
  [...newsletterSubscribers].sort(
    (a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime(),
  )

export function deleteSubscriber(id: number) {
  const i = newsletterSubscribers.findIndex((s) => s.id === id)
  if (i >= 0) newsletterSubscribers.splice(i, 1)
  persistSubscribers()
}

/** Format an ISO datetime like the demo: "14 Jul 2026, 01:04 PM". */
export function formatSubscribedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso || '—'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const pad = (n: number) => String(n).padStart(2, '0')
  const h = d.getHours()
  const h12 = h % 12 || 12
  return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}, ${pad(h12)}:${pad(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`
}
