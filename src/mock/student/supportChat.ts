// Support-chat messages between staff and a student, keyed by student id.
// Prototype persistence in localStorage; replaced by a realtime backend in
// Phase 2. Modeled on demo.eductrl.com's student "Chat" tab (1-on-1 support).

export interface ChatMessage {
  id: number
  /** 'staff' = sent from the admin side, 'student' = the student. */
  from: 'staff' | 'student'
  text: string
  /** Display time, e.g. "12:39 PM". */
  at: string
  /** Attached file names (prototype keeps names only). */
  files?: string[]
}

const KEY = 'unidest-student-support-chat'

function loadAll(): Record<number, ChatMessage[]> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

/** All messages for one student, oldest first. */
export function loadChat(studentId: number): ChatMessage[] {
  const all = loadAll()
  return Array.isArray(all[studentId]) ? all[studentId] : []
}

function persist(studentId: number, messages: ChatMessage[]) {
  try {
    const all = loadAll()
    all[studentId] = messages
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // Storage blocked — the message stays in-memory for this session.
  }
}

/** Append a message and return the updated thread. `nowLabel` avoids Date in the store. */
export function sendChat(
  studentId: number,
  msg: { from: 'staff' | 'student'; text: string; at: string; files?: string[] },
): ChatMessage[] {
  const messages = loadChat(studentId)
  const id = messages.length ? messages[messages.length - 1].id + 1 : 1
  const next = [...messages, { id, ...msg }]
  persist(studentId, next)
  return next
}
