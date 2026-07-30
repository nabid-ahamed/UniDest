// Editable reminder messages, keyed by application status.
//
// The dashboard "University/Visa Application Reminders" list shows a next-action
// line for each application. That line is looked up here by the application's
// status. Admins can customise / add / remove these messages from the
// Application view (the pencil next to Status → "Reminder Messages"). Persisted
// to localStorage (prototype); replaced by an API in Phase 2.

const KEY = 'unidest-reminder-messages'

/**
 * First-run defaults. Any status not listed here simply produces no reminder
 * (e.g. Withdrawn — nothing to chase). Admins can add rules for more statuses.
 */
export const DEFAULT_REMINDER_MESSAGES: Record<string, string> = {
  Pending: 'Complete & submit application documents',
  'Funds Under Assessment': 'Provide proof of funds',
  'Admission Criteria Met': 'Follow up for the offer letter',
  'Payment Received': 'Confirm enrolment & next steps',
  'Offer Letter Received': 'Accept offer & pay the deposit',
}

/** The working map — seeded from defaults on first run, then whatever was saved. */
function load(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed as Record<string, string>
    }
  } catch {
    // Corrupt / blocked storage → fall back to the defaults.
  }
  return { ...DEFAULT_REMINDER_MESSAGES }
}

function persist(map: Record<string, string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    // Storage full / blocked — the session still works, it just won't persist.
  }
}

/** All status→message rules (a fresh copy), for the editor UI. */
export function getReminderMessages(): Record<string, string> {
  return { ...load() }
}

/** The reminder message for a status, or '' when none is configured. */
export function reminderMessageFor(status: string): string {
  return load()[status] ?? ''
}

/**
 * Add or update the message for a status. Empty/blank message removes the rule
 * (same as delete). Status is trimmed; a blank status is ignored.
 */
export function setReminderMessage(status: string, message: string): Record<string, string> {
  const key = status.trim()
  if (!key) return load()
  const map = load()
  const msg = message.trim()
  if (msg) map[key] = msg
  else delete map[key]
  persist(map)
  return { ...map }
}

/** Remove the rule for a status. */
export function deleteReminderMessage(status: string): Record<string, string> {
  const map = load()
  delete map[status]
  persist(map)
  return { ...map }
}

/** Restore the first-run defaults (discards customisations). */
export function resetReminderMessages(): Record<string, string> {
  const map = { ...DEFAULT_REMINDER_MESSAGES }
  persist(map)
  return map
}
