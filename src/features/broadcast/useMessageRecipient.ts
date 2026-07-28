import { useLocation, useParams } from 'react-router-dom'
import { leads } from '../../mock/leads'
import { getApplication } from '../../mock/applications'
import { students } from '../../mock/students'

export interface MessageRecipient {
  name: string
  email: string
  phone: string
  /** Where Cancel / after-send returns to (the originating detail page). */
  backTo: string
}

/**
 * Resolves the recipient for the shared Send Email / Send SMS pages from the
 * current route, so leads and applications reuse the same page:
 *   /leads/:id/(email|sms)         → the lead
 *   /applications/:id/(email|sms)  → the application's linked student
 * Returns null when the record (or the linked student) can't be found.
 */
export function useMessageRecipient(): MessageRecipient | null {
  const { id } = useParams()
  const { pathname } = useLocation()
  const numId = Number(id)

  if (pathname.startsWith('/applications/')) {
    const app = getApplication(numId)
    if (!app) return null
    const student = students.find((s) => s.studentNo === app.studentNo)
    return {
      name: app.student,
      email: student?.email ?? '',
      phone: student?.phone ?? '',
      backTo: `/applications/${numId}`,
    }
  }

  const lead = leads.find((l) => l.id === numId)
  if (!lead) return null
  return {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    backTo: `/leads/${numId}`,
  }
}
