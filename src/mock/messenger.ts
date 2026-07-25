// Messenger contacts — the people an admin can start a conversation with,
// pulled live from the existing modules so the lists always stay in sync:
//   Team    → Staff members
//   Student → Students
//   Agent   → agents referenced on Applications
// Message threads themselves live in the messenger store (localStorage).

import { staff } from './staff'
import { students } from './students'
import { leads } from './leads'

export type ContactKind = 'Team' | 'Student' | 'Lead'

export interface Contact {
  /** Stable, unique key used as the conversation id. */
  key: string
  name: string
  email: string
}

function teamContacts(): Contact[] {
  return staff.map((s) => ({ key: `team:${s.id}`, name: s.name, email: s.email }))
}

function studentContacts(): Contact[] {
  return students.map((s) => ({ key: `student:${s.id}`, name: s.name, email: s.email }))
}

function leadContacts(): Contact[] {
  return leads.map((l) => ({ key: `lead:${l.id}`, name: l.name, email: l.email }))
}

export function contactsFor(kind: ContactKind): Contact[] {
  const list =
    kind === 'Team' ? teamContacts() : kind === 'Student' ? studentContacts() : leadContacts()
  return list.sort((a, b) => a.name.localeCompare(b.name))
}
