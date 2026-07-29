import { pickTextColor } from '../lib/contrast'
import { avatarColor, initials } from '../mock/staff'
import { cn } from '../lib/cn'

/**
 * Circular avatar: shows the uploaded picture when present, otherwise coloured
 * initials (deterministic colour from the name). Shared by Staff and Student
 * lists/detail pages so an uploaded profile picture appears everywhere.
 */
export function Avatar({
  name,
  src,
  className,
  fontClassName = 'text-lg font-bold',
}: {
  name: string
  src?: string | null
  className?: string
  fontClassName?: string
}) {
  const base = cn('flex shrink-0 items-center justify-center overflow-hidden rounded-full', className)

  if (src) {
    return (
      <span className={base}>
        <img src={src} alt={name} className="h-full w-full object-cover" />
      </span>
    )
  }

  const bg = avatarColor(name)
  return (
    <span className={cn(base, fontClassName)} style={{ backgroundColor: bg, color: pickTextColor(bg) }} aria-hidden="true">
      {initials(name)}
    </span>
  )
}
