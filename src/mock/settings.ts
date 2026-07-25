// Settings module, modeled on the EduCtrl demo (/admin/settings). The reference
// is a huge tabbed config screen; here we build a focused set of panels that are
// each genuinely wired to the app — no dead tabs.
//
// Connected to existing modules: the Public Website Theme reuses the CMS theme
// list (and links to CMS › Home Page); the editable Branches and Study Levels
// lists are seeded from the values Staff / Users / Leads / Students / Courses /
// Import already use; the Modules panel toggles the app's real modules; the
// Localization currency options come from the Invoices module. A single object
// persists to `unidest-settings`. Docs: docs/superpowers/mock-data/adminpage.md.

import { frontendThemes } from './cms'
import { studyLevels as seedStudyLevels } from './leads'
import { staffBranches } from './staff'
import { invoiceCurrencies } from './invoices'

export { frontendThemes, invoiceCurrencies }

/* ------------------------------------------------------------------ */
/* Settings nav + module registry                                      */
/* ------------------------------------------------------------------ */

export const settingsSections = [
  { id: 'general', label: 'General' },
  { id: 'branches', label: 'Branches' },
  { id: 'study-levels', label: 'Study Levels' },
  { id: 'localization', label: 'Localization' },
  { id: 'modules', label: 'Modules' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'advanced', label: 'Advanced' },
] as const

export type SettingsSectionId = (typeof settingsSections)[number]['id']

/** The app's toggleable modules — mirrors the sidebar. */
export const moduleRegistry: { key: string; label: string; route: string }[] = [
  { key: 'leads', label: 'Leads', route: '/leads' },
  { key: 'students', label: 'Students', route: '/students' },
  { key: 'applications', label: 'Applications', route: '/applications' },
  { key: 'course-finder', label: 'Course Finder', route: '/course-finder' },
  { key: 'webinars', label: 'Webinars & Events', route: '/webinars' },
  { key: 'broadcast', label: 'Broadcast', route: '/broadcast' },
  { key: 'invoices', label: 'Invoices', route: '/invoices/student' },
  { key: 'referral', label: 'Referral', route: '/referral/signups' },
  { key: 'analytics', label: 'Analytics', route: '/analytics' },
  { key: 'automation', label: 'Automation', route: '/automation' },
  { key: 'course-management', label: 'Course Management', route: '/courses' },
  { key: 'cms', label: 'CMS', route: '/cms/home-page' },
  { key: 'announcements', label: 'Announcements', route: '/announcements' },
  { key: 'message-templates', label: 'Message Templates', route: '/message-templates/email' },
]

export const dateFormats = ['DD MMM YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD'] as const
export const timezones = ['Asia/Dhaka', 'Asia/Kolkata', 'Asia/Karachi', 'Asia/Dubai', 'Europe/London', 'America/New_York'] as const
export const weekStarts = ['Saturday', 'Sunday', 'Monday'] as const

/* ------------------------------------------------------------------ */
/* Settings shape + defaults                                           */
/* ------------------------------------------------------------------ */

export interface AppSettings {
  general: {
    appName: string
    tagline: string
    email: string
    phone: string
    address: string
    theme: string
    social: { facebook: string; instagram: string; linkedin: string; youtube: string; x: string; whatsapp: string }
    footerAbout: string
  }
  localization: { currency: string; dateFormat: string; timezone: string; weekStart: string }
  notifications: {
    emailEnabled: boolean
    smsEnabled: boolean
    whatsappEnabled: boolean
    newLead: boolean
    newStudent: boolean
    applicationUpdate: boolean
    invoicePaid: boolean
    webinarReminder: boolean
  }
  modules: Record<string, boolean>
  branches: string[]
  studyLevels: string[]
  maintenanceMode: boolean
}

const KEY = 'unidest-settings'

const defaults: AppSettings = {
  general: {
    appName: 'GlobalEd',
    tagline: 'IELTS & Study Abroad Consultancy',
    email: 'support@globaled.app',
    phone: '+880 1700 000000',
    address: 'House 12, Road 5, Dhaka 1205, Bangladesh',
    theme: 'Europa',
    social: {
      facebook: 'https://facebook.com/globaled',
      instagram: 'https://instagram.com/globaled',
      linkedin: '',
      youtube: 'https://youtube.com/@globaled',
      x: '',
      whatsapp: '8801700000000',
    },
    footerAbout: 'Your trusted partner for study-abroad guidance — from first enquiry to enrolment.',
  },
  localization: { currency: 'USD', dateFormat: 'DD MMM YYYY', timezone: 'Asia/Dhaka', weekStart: 'Sunday' },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    whatsappEnabled: true,
    newLead: true,
    newStudent: true,
    applicationUpdate: true,
    invoicePaid: true,
    webinarReminder: true,
  },
  modules: Object.fromEntries(moduleRegistry.map((m) => [m.key, true])),
  branches: [...staffBranches],
  studyLevels: [...seedStudyLevels],
  maintenanceMode: false,
}

/** Deep-ish merge so newly-added fields always have a value. */
export const settings: AppSettings = (() => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(defaults)
    const p = JSON.parse(raw)
    return {
      ...defaults,
      ...p,
      general: { ...defaults.general, ...(p.general ?? {}), social: { ...defaults.general.social, ...(p.general?.social ?? {}) } },
      localization: { ...defaults.localization, ...(p.localization ?? {}) },
      notifications: { ...defaults.notifications, ...(p.notifications ?? {}) },
      modules: { ...defaults.modules, ...(p.modules ?? {}) },
      branches: Array.isArray(p.branches) ? p.branches : defaults.branches,
      studyLevels: Array.isArray(p.studyLevels) ? p.studyLevels : defaults.studyLevels,
    }
  } catch {
    return structuredClone(defaults)
  }
})()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // Storage blocked — changes stay in-memory for this session.
  }
}

/** Replace a top-level settings slice (general, localization, notifications…). */
export function saveSettings<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
  settings[key] = value
  persist()
}

export function toggleModule(moduleKey: string) {
  settings.modules[moduleKey] = !settings.modules[moduleKey]
  persist()
}

export function addBranch(name: string): boolean {
  const v = name.trim()
  if (!v || settings.branches.some((b) => b.toLowerCase() === v.toLowerCase())) return false
  settings.branches.push(v)
  persist()
  return true
}

export function removeBranch(name: string) {
  settings.branches = settings.branches.filter((b) => b !== name)
  persist()
}

export function addStudyLevel(name: string): boolean {
  const v = name.trim()
  if (!v || settings.studyLevels.some((s) => s.toLowerCase() === v.toLowerCase())) return false
  settings.studyLevels.push(v)
  persist()
  return true
}

export function removeStudyLevel(name: string) {
  settings.studyLevels = settings.studyLevels.filter((s) => s !== name)
  persist()
}

export function setMaintenance(on: boolean) {
  settings.maintenanceMode = on
  persist()
}

export const enabledModuleCount = () => Object.values(settings.modules).filter(Boolean).length

/**
 * "Master Setup" pending steps — required fields still empty. Drives the banner.
 */
export function pendingSetupSteps(): string[] {
  const g = settings.general
  const steps: string[] = []
  if (!g.appName.trim()) steps.push('Set your app name')
  if (!g.email.trim()) steps.push('Add a contact email')
  if (!g.phone.trim()) steps.push('Add a contact phone number')
  const anySocial = Object.values(g.social).some((v) => v.trim())
  if (!anySocial) steps.push('Add at least one social link')
  if (!g.footerAbout.trim()) steps.push('Write the footer about text')
  return steps
}
