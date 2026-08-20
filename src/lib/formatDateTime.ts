/**
 * "18 Jan 2026, 2:30 PM" — the date+time label used across announcements,
 * backups, leads and webinars.
 *
 * Lives in its own module rather than beside DateTimePicker: eight files import
 * it, and a file that exports both a component and a helper breaks Fast Refresh
 * for the component.
 */
export function formatDateTime(d: Date): string {
  const date = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(d)
  return `${date}, ${time}`
}
