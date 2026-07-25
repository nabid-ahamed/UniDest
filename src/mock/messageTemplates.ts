// Mock data for the Message Templates module, modeled on the EduCtrl demo
// (/admin/mailtemplates, /admin/smstemplates, /admin/whatsapptemplates,
// /admin/cannedresponsetemplates). Four sub-modules share one template engine:
// Email, SMS and WhatsApp are the same shape (only the merge-tag delimiters and
// a Subject field differ), plus Canned Responses for the live-chat widget.
//
// Connected to existing modules: every template fires from an event that already
// exists elsewhere in the portal (a Student is created, a Lead is added, a
// Webinar reminder is due, an Application status changes, a Referral payout is
// processed…), and each event links back to the module that raises it. Merge
// tags resolve to real record fields (name, email, course, university, intake…).
//
// Persists to localStorage. Docs: docs/superpowers/mock-data/adminpage.md.

/* ------------------------------------------------------------------ */
/* Channels + merge tags                                               */
/* ------------------------------------------------------------------ */

export const channels = ['email', 'sms', 'whatsapp'] as const
export type TemplateChannel = (typeof channels)[number]

export const channelMeta: Record<
  TemplateChannel,
  { label: string; nameLabel: string; messageLabel: string; hasSubject: boolean; brace: boolean }
> = {
  email: { label: 'Email Templates', nameLabel: 'Email', messageLabel: 'Body', hasSubject: true, brace: false },
  sms: { label: 'SMS Templates', nameLabel: 'Event', messageLabel: 'Message', hasSubject: false, brace: false },
  whatsapp: { label: 'Whatsapp Templates', nameLabel: 'Template Name', messageLabel: 'Message', hasSubject: false, brace: true },
}

/** Merge tags — each resolves to a real field on the recipient's record. */
export const mergeTags: { token: string; desc: string }[] = [
  { token: 'first_name', desc: "Recipient's first name" },
  { token: 'full_name', desc: 'Full name' },
  { token: 'email', desc: 'Email address' },
  { token: 'password', desc: 'Auto-generated password' },
  { token: 'sitename', desc: 'Site name (GlobalEd)' },
  { token: 'siteurl', desc: 'Portal URL' },
  { token: 'course', desc: 'Course name (Course Finder)' },
  { token: 'university', desc: 'University (Course Management)' },
  { token: 'intake', desc: 'Intake term' },
  { token: 'branch', desc: 'Branch' },
  { token: 'webinar', desc: 'Webinar topic (Webinars)' },
  { token: 'application', desc: 'Application no. (Applications)' },
  { token: 'details', desc: 'Status details' },
]

/** Wrap a token in the channel's delimiter: `#token#` or `{{token}}`. */
export const formatTag = (channel: TemplateChannel, token: string) =>
  channelMeta[channel].brace ? `{{${token}}}` : `#${token}#`

/* ------------------------------------------------------------------ */
/* Trigger events — the bridge to existing modules                     */
/* ------------------------------------------------------------------ */

export interface TemplateEvent {
  key: string
  label: string
  details: string
  module: string
  route: string
}

export const templateEvents: TemplateEvent[] = [
  { key: 'STUDENT_CREATE_WELCOME', label: 'Student Create Welcome', details: 'Sent to a Student when staff creates a student', module: 'Students', route: '/students' },
  { key: 'STUDENT_PASSWORD', label: 'Student Password', details: 'Auto-generated password sent when a lead is converted to a student', module: 'Students', route: '/students' },
  { key: 'LEAD_WELCOME', label: 'Lead Welcome', details: 'Sent to a Lead when the lead is manually added by staff', module: 'Leads', route: '/leads' },
  { key: 'WEBINAR_REMINDER', label: 'Webinar Reminder', details: 'Sent to registrants for an upcoming webinar', module: 'Webinars', route: '/webinars' },
  { key: 'UNIVERSITY_APPLICATION_UPDATE', label: 'Application Status Update', details: "Sent to a Student when their application status is updated", module: 'Applications', route: '/applications' },
  { key: 'COURSE_SUGGESTION', label: 'Course Suggestion', details: 'Sent to a Student when staff sends a course suggestion', module: 'Course Finder', route: '/course-finder' },
  { key: 'AGENT_COMMISSION_PAYOUT', label: 'Commission Payout', details: 'Sent when a referral/agent payout is processed', module: 'Referral', route: '/referral/payout' },
  { key: 'TICKET_REPLY', label: 'Ticket Reply', details: 'Sent to a Student when staff replies to a support ticket', module: 'Students', route: '/students' },
  { key: 'BIRTHDAY_WISHES', label: 'Birthday Wishes', details: 'Sent to a Student on their birthday', module: 'Students', route: '/students' },
  { key: 'STAFF_LEAD_ASSIGNED', label: 'Lead Assigned', details: 'Sent to a Staff member when a lead is assigned to them', module: 'Staff', route: '/staff' },
]

export const getEvent = (key: string | null) => templateEvents.find((e) => e.key === key)

/** Channel-neutral body per event; `{token}` becomes the channel's merge tag. */
const EVENT_BODY: Record<string, string> = {
  STUDENT_CREATE_WELCOME: 'Dear {first_name}, welcome to {sitename}! Your student account is ready. Log in at {siteurl} using {email}.',
  STUDENT_PASSWORD: 'Dear {first_name}, welcome to {sitename}! Email: {email} Password: {password}. Please change it after your first login: {siteurl}',
  LEAD_WELCOME: 'Dear {first_name}, welcome to {sitename}! A counsellor will reach out shortly to guide you. Email: {email}',
  WEBINAR_REMINDER: 'Dear {first_name}, reminder: the webinar "{webinar}" is coming up. We look forward to seeing you! — {sitename}',
  UNIVERSITY_APPLICATION_UPDATE: 'Dear {first_name}, your application {application} has a status update: {details}. Log in to view more.',
  COURSE_SUGGESTION: 'Dear {first_name}, we have a new course suggestion for you: {course} at {university} ({intake}). Log in to review it.',
  AGENT_COMMISSION_PAYOUT: 'Dear {first_name}, your commission payout has been processed by {sitename}. Check your dashboard for details.',
  TICKET_REPLY: 'Dear {first_name}, your support ticket has a new reply from our team. Log in to {sitename} to read it.',
  BIRTHDAY_WISHES: 'Happy Birthday, {full_name}! Wishing you a wonderful year ahead from all of us at {sitename}.',
  STAFF_LEAD_ASSIGNED: 'Dear {first_name}, a new lead has been assigned to you at the {branch} branch. Please follow up soon.',
}

const DEFAULT_SUBJECT: Record<string, string> = {
  STUDENT_CREATE_WELCOME: 'Welcome!',
  STUDENT_PASSWORD: 'Welcome!',
  LEAD_WELCOME: 'Welcome!',
  WEBINAR_REMINDER: 'Webinar Reminder',
  UNIVERSITY_APPLICATION_UPDATE: 'Application Status Update',
  COURSE_SUGGESTION: 'New Course Suggestion',
  AGENT_COMMISSION_PAYOUT: 'Commission Payout',
  TICKET_REPLY: 'Ticket Reply',
  BIRTHDAY_WISHES: 'Happy Birthday!',
  STAFF_LEAD_ASSIGNED: 'New Lead Assigned',
}

// A few events ship disabled, for realistic variety.
const DISABLED_EVENTS = ['TICKET_REPLY', 'STAFF_LEAD_ASSIGNED', 'AGENT_COMMISSION_PAYOUT']

/** Replace `{token}` placeholders with the channel's merge tag. */
function renderBody(channel: TemplateChannel, template: string): string {
  return template.replace(/\{(\w+)\}/g, (_, t) => formatTag(channel, t))
}

/* ------------------------------------------------------------------ */
/* Template type + seeds                                               */
/* ------------------------------------------------------------------ */

export interface MessageTemplate {
  id: number
  channel: TemplateChannel
  name: string
  subject: string // email only
  body: string
  eventKey: string | null // null → custom template
  details: string
  enabled: boolean
  /** Event-bound templates can be edited/toggled but not deleted. */
  system: boolean
}

const KEY = 'unidest-message-templates'

// Custom (non-event) templates per channel — these ARE deletable.
const CUSTOM_SEED: Record<TemplateChannel, { name: string; subject: string; body: string }[]> = {
  email: [
    { name: 'Intro email to fresh leads', subject: 'Introduction to studying abroad', body: 'Hi #first_name#, thanks for your interest in #sitename#. Here is how we can help you study abroad.' },
    { name: 'Lead nurture msg 1', subject: 'Overseas Education: Tip of the day', body: 'Hi #first_name#, today’s tip: start your application early to maximise scholarship chances.' },
  ],
  sms: [{ name: 'Last minute offer', subject: '', body: 'Hello #first_name#, limited-time counselling slots open this week. Reply to book yours!' }],
  whatsapp: [{ name: 'invoice_raised', subject: '', body: 'Hi {{first_name}}, an invoice has been generated for your services. Log in to view and pay.' }],
}

function seedForChannel(channel: TemplateChannel, startId: number): MessageTemplate[] {
  const sys = templateEvents.map((e, i) => ({
    id: startId + i,
    channel,
    name: channel === 'email' ? e.key : e.label,
    subject: channel === 'email' ? DEFAULT_SUBJECT[e.key] ?? e.label : '',
    body: renderBody(channel, EVENT_BODY[e.key] ?? ''),
    eventKey: e.key,
    details: e.details,
    enabled: !DISABLED_EVENTS.includes(e.key),
    system: true,
  }))
  const custom = CUSTOM_SEED[channel].map((c, i) => ({
    id: startId + templateEvents.length + i,
    channel,
    name: c.name,
    subject: c.subject,
    body: c.body,
    eventKey: null,
    details: '',
    enabled: true,
    system: false,
  }))
  return [...sys, ...custom]
}

const seedTemplates: MessageTemplate[] = (() => {
  const out: MessageTemplate[] = []
  channels.forEach((ch) => {
    out.push(...seedForChannel(ch, out.length + 1))
  })
  return out
})()

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

export const messageTemplates: MessageTemplate[] = load(KEY, seedTemplates)

const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(messageTemplates))
  } catch {
    // Storage blocked — changes stay in-memory for this session.
  }
}

const nextId = () => Math.max(0, ...messageTemplates.map((t) => t.id)) + 1

export const templatesFor = (channel: TemplateChannel) =>
  messageTemplates.filter((t) => t.channel === channel)

export const getTemplate = (id: number) => messageTemplates.find((t) => t.id === id)

export function addTemplate(data: Omit<MessageTemplate, 'id' | 'eventKey' | 'system' | 'details'>): MessageTemplate {
  const item: MessageTemplate = { ...data, id: nextId(), eventKey: null, details: '', system: false }
  messageTemplates.push(item)
  persist()
  return item
}

export function updateTemplate(id: number, patch: Partial<Omit<MessageTemplate, 'id' | 'channel' | 'system'>>) {
  const t = messageTemplates.find((x) => x.id === id)
  if (!t) return
  Object.assign(t, patch)
  persist()
}

export function toggleTemplate(id: number) {
  const t = messageTemplates.find((x) => x.id === id)
  if (!t) return
  t.enabled = !t.enabled
  persist()
}

/** Returns false for system (event-bound) templates, which can't be deleted. */
export function deleteTemplate(id: number): boolean {
  const t = messageTemplates.find((x) => x.id === id)
  if (!t || t.system) return false
  messageTemplates.splice(messageTemplates.indexOf(t), 1)
  persist()
  return true
}

/* ------------------------------------------------------------------ */
/* Canned responses (live-chat quick replies)                          */
/* ------------------------------------------------------------------ */

export interface CannedResponse {
  id: number
  type: string
  details: string
  enabled: boolean
  responses: string[]
}

const CANNED_KEY = 'unidest-canned-responses'

const seedCanned: CannedResponse[] = [
  {
    id: 1,
    type: 'Live Chat Greetings',
    details: 'Opening lines agents can insert when a chat starts',
    enabled: true,
    responses: [
      'Hi there! 👋 Welcome to GlobalEd. How can I help with your study-abroad plans today?',
      'Thanks for reaching out! Are you looking for a specific course or country?',
      'Hello! I can help you shortlist universities and understand admission requirements.',
    ],
  },
  {
    id: 2,
    type: 'Application Follow-up',
    details: 'Quick replies for application-status questions',
    enabled: true,
    responses: [
      'Your application is under review — we’ll update you as soon as the university responds.',
      'Could you please share your application number so I can check the latest status?',
    ],
  },
  {
    id: 3,
    type: 'Visa & Documents',
    details: 'Common answers about visa and document requirements',
    enabled: false,
    responses: [
      'For the student visa you’ll typically need your offer letter, financial proof and passport.',
      'Our team can guide you through the visa process step by step — would you like to book a call?',
    ],
  },
]

export const cannedResponses: CannedResponse[] = load(CANNED_KEY, seedCanned)

const persistCanned = () => {
  try {
    localStorage.setItem(CANNED_KEY, JSON.stringify(cannedResponses))
  } catch {
    // ignore
  }
}

const nextCannedId = () => Math.max(0, ...cannedResponses.map((c) => c.id)) + 1

export const getCanned = (id: number) => cannedResponses.find((c) => c.id === id)

export function addCanned(data: Omit<CannedResponse, 'id'>): CannedResponse {
  const item: CannedResponse = { ...data, id: nextCannedId() }
  cannedResponses.push(item)
  persistCanned()
  return item
}

export function updateCanned(id: number, patch: Partial<Omit<CannedResponse, 'id'>>) {
  const c = cannedResponses.find((x) => x.id === id)
  if (!c) return
  Object.assign(c, patch)
  persistCanned()
}

export function toggleCanned(id: number) {
  const c = cannedResponses.find((x) => x.id === id)
  if (!c) return
  c.enabled = !c.enabled
  persistCanned()
}

export function deleteCanned(id: number) {
  const i = cannedResponses.findIndex((c) => c.id === id)
  if (i >= 0) cannedResponses.splice(i, 1)
  persistCanned()
}
