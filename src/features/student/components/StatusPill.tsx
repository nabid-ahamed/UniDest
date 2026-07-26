import { pickTextColor } from '../../../lib/contrast'

/**
 * Solid status pill. Takes a hex colour (from a module's status lookup) and
 * auto-picks readable text via WCAG contrast, so any status colour is safe.
 */
export function StatusPill({ label, color }: { label: string; color: string }) {
  if (!label) return null
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: color, color: pickTextColor(color) }}
    >
      {label}
    </span>
  )
}
