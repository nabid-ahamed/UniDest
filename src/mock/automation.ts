// Mock data for the Automation module — Workflows + Campaigns (modeled on the
// EduCtrl demo). Audience matching reuses the live leads/students mocks so the
// "Matched Users" / "Matched Audience" counts always agree with those pages.
// Docs: docs/superpowers/mock-data/adminpage.md. Replace with real API in Phase 2.

import { leads, leadStatuses, allCountries } from './leads'
import { students, studentStatuses } from './students'

export { leadStatuses, studentStatuses, allCountries }

/* ------------------------------------------------------------------ */
/* Shared lookups                                                      */
/* ------------------------------------------------------------------ */

export const workflowModes = ['Email', 'SMS', 'Whatsapp'] as const
export type WorkflowMode = (typeof workflowModes)[number]

export const workflowTypes = [
  'Lead nurture sequence',
  'Specific event',
  'Message sequence',
] as const
export type WorkflowType = (typeof workflowTypes)[number]

export const audienceTargets = ['Leads', 'Students'] as const
export type AudienceTarget = (typeof audienceTargets)[number]

export const campaignStatuses = ['Queued', 'Sent', 'Draft', 'Failed'] as const
export type CampaignStatus = (typeof campaignStatuses)[number]

/** Audience filter shared by workflows and campaigns. Empty string = "any". */
export interface AudienceCriteria {
  target: AudienceTarget
  status?: string
  country?: string
}

/** Status options that apply to a given target group. */
export function statusOptionsFor(target: AudienceTarget): string[] {
  return (target === 'Leads' ? leadStatuses : studentStatuses).map((s) => s.label)
}

/** Resolve an audience filter to concrete {name, email} recipients from live mocks. */
export function resolveAudience(c: AudienceCriteria): { name: string; email: string }[] {
  const source =
    c.target === 'Leads'
      ? leads.map((l) => ({ name: l.name, email: l.email, status: l.status, country: l.countryInterested }))
      : students.map((s) => ({ name: s.name, email: s.email, status: s.status, country: s.countryInterested }))
  return source
    .filter((r) => !c.status || r.status === c.status)
    .filter((r) => !c.country || r.country === c.country)
    .map(({ name, email }) => ({ name, email }))
}

/** Count of users matched by an audience filter. */
export function matchedUsers(c: AudienceCriteria): number {
  return resolveAudience(c).length
}

/** Human summary of an audience filter, e.g. "Students · Enrolled · Australia". */
export function audienceSummary(c: AudienceCriteria): string {
  return [c.target, c.status, c.country].filter(Boolean).join(' · ')
}

/* ------------------------------------------------------------------ */
/* Workflows                                                           */
/* ------------------------------------------------------------------ */

export interface WorkflowStep {
  /** When the message fires, e.g. "On: 08-09-2025" or "After 3 Day(s)". */
  schedule: string
  message: string
}

export interface ExecutionRecord {
  date: string
  sequenceIndex: number
  messageSent: number
  message: string
}

export interface Workflow {
  id: number
  title: string
  type: WorkflowType
  mode: WorkflowMode
  at: string // "04:45 PM"
  created: string // "08 Sep 2025 16:41"
  status: 'Active' | 'Inactive'
  audience: AudienceCriteria
  steps: WorkflowStep[]
  history: ExecutionRecord[]
}

export const messageCount = (w: Workflow): number => w.steps.length

const WORKFLOW_KEY = 'unidest-workflows'

const seedWorkflows: Workflow[] = [
  {
    id: 8,
    title: 'gygyuhuhu',
    type: 'Lead nurture sequence',
    mode: 'Email',
    at: '10:00 AM',
    created: '12 Jul 2026 09:14',
    status: 'Active',
    audience: { target: 'Leads', status: 'New Lead', country: '' },
    steps: [{ schedule: 'On: 12-07-2026', message: 'Intro email to fresh leads' }],
    history: [{ date: '12 Jul 2026', sequenceIndex: 1, messageSent: 6, message: 'Intro email to fresh leads' }],
  },
  {
    id: 7,
    title: 'Testing 1234',
    type: 'Specific event',
    mode: 'Email',
    at: '09:30 AM',
    created: '02 Jun 2026 11:40',
    status: 'Active',
    audience: { target: 'Leads', status: 'Registered', country: '' },
    steps: [{ schedule: 'On: 02-06-2026', message: 'Registration confirmation' }],
    history: [],
  },
  {
    id: 6,
    title: 'Testing 1234',
    type: 'Specific event',
    mode: 'Email',
    at: '09:30 AM',
    created: '02 Jun 2026 11:22',
    status: 'Inactive',
    audience: { target: 'Leads', status: '', country: '' },
    steps: [{ schedule: 'On: 02-06-2026', message: 'Registration confirmation' }],
    history: [],
  },
  {
    id: 5,
    title: '7 days after lead generation',
    type: 'Lead nurture sequence',
    mode: 'Email',
    at: '11:00 AM',
    created: '20 May 2026 15:03',
    status: 'Active',
    audience: { target: 'Leads', status: 'Contacted', country: '' },
    steps: [{ schedule: 'After 7 Day(s)', message: 'Follow-up with counselling offer' }],
    history: [{ date: '27 May 2026', sequenceIndex: 1, messageSent: 12, message: 'Follow-up with counselling offer' }],
  },
  {
    id: 4,
    title: 'Whatsapp Testing',
    type: 'Message sequence',
    mode: 'Whatsapp',
    at: '04:45 PM',
    created: '08 Sep 2025 16:41',
    status: 'Active',
    audience: { target: 'Students', status: 'Offer Received', country: 'Australia' },
    steps: [
      { schedule: 'On: 08-09-2025', message: 'notification' },
      { schedule: 'After 3 Day(s)', message: 'notification' },
    ],
    history: [
      { date: '08 Sep 2025', sequenceIndex: 1, messageSent: 3, message: 'notification' },
      { date: '11 Sep 2025', sequenceIndex: 1, messageSent: 3, message: 'notification' },
    ],
  },
  {
    id: 3,
    title: 'Auto_1',
    type: 'Message sequence',
    mode: 'Whatsapp',
    at: '02:00 PM',
    created: '01 Sep 2025 10:12',
    status: 'Active',
    audience: { target: 'Students', status: 'Docs Pending', country: '' },
    steps: [
      { schedule: 'On: 01-09-2025', message: 'Document reminder' },
      { schedule: 'After 2 Day(s)', message: 'Final document reminder' },
    ],
    history: [{ date: '03 Sep 2025', sequenceIndex: 2, messageSent: 4, message: 'Final document reminder' }],
  },
  {
    id: 2,
    title: 'test',
    type: 'Lead nurture sequence',
    mode: 'Whatsapp',
    at: '12:00 PM',
    created: '18 Aug 2025 13:47',
    status: 'Active',
    audience: { target: 'Leads', status: 'Warm', country: '' },
    steps: [{ schedule: 'After 1 Day(s)', message: 'Warm lead nudge' }],
    history: [],
  },
  {
    id: 1,
    title: 'Testing',
    type: 'Lead nurture sequence',
    mode: 'Email',
    at: '10:30 AM',
    created: '10 Aug 2025 08:20',
    status: 'Active',
    audience: { target: 'Students', status: 'Enrolled', country: '' },
    steps: [
      { schedule: 'On: 10-08-2025', message: 'Welcome to GlobalEd' },
      { schedule: 'After 5 Day(s)', message: 'Onboarding checklist' },
    ],
    history: [{ date: '15 Aug 2025', sequenceIndex: 2, messageSent: 9, message: 'Onboarding checklist' }],
  },
]

export function loadWorkflows(): Workflow[] {
  try {
    const raw = localStorage.getItem(WORKFLOW_KEY)
    if (!raw) return seedWorkflows
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : seedWorkflows
  } catch {
    return seedWorkflows
  }
}

export const workflows: Workflow[] = loadWorkflows()

function persistWorkflows() {
  try {
    localStorage.setItem(WORKFLOW_KEY, JSON.stringify(workflows))
  } catch {
    // Storage blocked — changes stay in-memory for this session.
  }
}

export function getWorkflow(id: number): Workflow | undefined {
  return workflows.find((w) => w.id === id)
}

export function addWorkflow(data: Omit<Workflow, 'id'>): Workflow {
  const wf: Workflow = { ...data, id: Math.max(0, ...workflows.map((w) => w.id)) + 1 }
  workflows.unshift(wf)
  persistWorkflows()
  return wf
}

export function toggleWorkflowStatus(id: number) {
  const wf = workflows.find((w) => w.id === id)
  if (!wf) return
  wf.status = wf.status === 'Active' ? 'Inactive' : 'Active'
  persistWorkflows()
}

export function deleteWorkflow(id: number) {
  const i = workflows.findIndex((w) => w.id === id)
  if (i >= 0) workflows.splice(i, 1)
  persistWorkflows()
}

/* ------------------------------------------------------------------ */
/* Campaigns                                                           */
/* ------------------------------------------------------------------ */

export interface Campaign {
  id: number
  title: string
  status: CampaignStatus
  scheduledAt: string // "16-05-2026 07:52 PM"
  mode: 'Email' | 'SMS'
  sentTo: number
  audience: AudienceCriteria
  message: string
}

const CAMPAIGN_KEY = 'unidest-campaigns'

const seedCampaigns: Campaign[] = [
  {
    id: 5,
    title: 'Testing',
    status: 'Queued',
    scheduledAt: '16-05-2026 07:52 PM',
    mode: 'Email',
    sentTo: 0,
    audience: { target: 'Leads', status: 'New Lead', country: '' },
    message: 'Dear #first_name#,\n\nThank you for reaching out to GlobalEd. A counsellor will contact you shortly.',
  },
  {
    id: 4,
    title: 'Testing',
    status: 'Queued',
    scheduledAt: '04-03-2026 10:00 AM',
    mode: 'Email',
    sentTo: 0,
    audience: { target: 'Students', status: '', country: '' },
    message: 'Dear #first_name#,\n\nHere is your GlobalEd update.',
  },
  {
    id: 3,
    title: 'Lead',
    status: 'Queued',
    scheduledAt: '25-12-2025 10:00 AM',
    mode: 'Email',
    sentTo: 0,
    audience: { target: 'Leads', status: '', country: '' },
    message: 'Dear #first_name#,\n\nSeason greetings from GlobalEd.',
  },
  {
    id: 2,
    title: 'your course selection',
    status: 'Queued',
    scheduledAt: '18-11-2025 10:30 PM',
    mode: 'Email',
    sentTo: 0,
    audience: { target: 'Students', status: 'Offer Received', country: '' },
    message: 'Dear #first_name#,\n\nYour counsellor has shared new course suggestions. Log in to review.',
  },
  {
    id: 1,
    title: 'Offer letter',
    status: 'Sent',
    scheduledAt: '16-08-2025 07:54 AM',
    mode: 'SMS',
    sentTo: 42,
    audience: { target: 'Students', status: 'Enrolled', country: '' },
    message: 'GlobalEd: Congratulations! Your offer letter is ready. Log in to view.',
  },
]

export function loadCampaigns(): Campaign[] {
  try {
    const raw = localStorage.getItem(CAMPAIGN_KEY)
    if (!raw) return seedCampaigns
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : seedCampaigns
  } catch {
    return seedCampaigns
  }
}

export const campaigns: Campaign[] = loadCampaigns()

function persistCampaigns() {
  try {
    localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(campaigns))
  } catch {
    // Storage blocked — changes stay in-memory for this session.
  }
}

export function getCampaign(id: number): Campaign | undefined {
  return campaigns.find((c) => c.id === id)
}

export function addCampaign(data: Omit<Campaign, 'id'>): Campaign {
  const cp: Campaign = { ...data, id: Math.max(0, ...campaigns.map((c) => c.id)) + 1 }
  campaigns.unshift(cp)
  persistCampaigns()
  return cp
}

export function deleteCampaign(id: number) {
  const i = campaigns.findIndex((c) => c.id === id)
  if (i >= 0) campaigns.splice(i, 1)
  persistCampaigns()
}

/** Personalization variables usable in campaign / workflow message bodies. */
export const messageVariables = [
  { token: '#first_name#', desc: 'Replaces with User First name' },
  { token: '#full_name#', desc: 'Replaces with User Full name' },
  { token: '#sitename#', desc: 'Website Name' },
  { token: '#siteurl#', desc: 'Website URL' },
]
