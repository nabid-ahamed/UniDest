// Per-application message thread for the student "My Applications" detail page
// (the "Message History" + "Send Message to Staff" panel). Persisted to
// localStorage keyed by application id. Docs: docs/superpowers/mock-data/student.md.

export interface AppMessage {
  id: number
  sender: string
  at: string // display string, e.g. "26 Jul 2026 11:45 AM"
  text: string
  fromStaff: boolean // false = the student (right-aligned bubble)
}

const KEY = 'unidest-application-messages'

/** Demo seed so a couple of threads aren't empty on first view. */
const SEED: Record<number, AppMessage[]> = {
  302122: [
    { id: 1, sender: 'Moses Otieno', at: '16 Apr 2026 09:10 AM', text: 'We have received your payment. Your application is now being processed.', fromStaff: true },
    { id: 2, sender: 'Rohan Das', at: '16 Apr 2026 10:02 AM', text: 'Thank you! Please let me know if anything else is needed.', fromStaff: false },
  ],
}

/** Two-line-ish timestamp, e.g. "26 Jul 2026 11:45 AM". */
function stamp(): string {
  const d = new Date()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  let h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()} ${h}:${m} ${ampm}`
}

export function loadMessages(appId: number): AppMessage[] {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return all[appId] ?? SEED[appId] ?? []
  } catch {
    return SEED[appId] ?? []
  }
}

function persist(appId: number, list: AppMessage[]) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    all[appId] = list
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // Storage blocked — messages stay in-memory for this session.
  }
}

/** Append a student message to the thread and return the new list. */
export function sendMessage(appId: number, sender: string, text: string): AppMessage[] {
  const list = loadMessages(appId)
  const next = [...list, { id: (list.at(-1)?.id ?? 0) + 1, sender, at: stamp(), text, fromStaff: false }]
  persist(appId, next)
  return next
}
