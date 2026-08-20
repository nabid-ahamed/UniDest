import type { AnnouncementArea } from '../../mock/announcements'

/** Area badge tint per audience segment. */
export const AREA_BADGE: Record<AnnouncementArea, string> = {
  All: 'bg-brand-50 text-brand-600',
  Students: 'bg-violet-50 text-violet-700',
  Leads: 'bg-sky-50 text-sky-700',
  Staff: 'bg-amber-50 text-amber-700',
}
