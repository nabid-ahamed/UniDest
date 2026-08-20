import { UserPlus, GraduationCap, FileText, Megaphone, CalendarClock, Headset } from 'lucide-react'
import type { NotificationCategory } from '../../lib/api'

/** Icon + colour per category — shared by the bell dropdown and the full page. */
export const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; icon: typeof UserPlus; iconBg: string; iconColor: string }
> = {
  lead: { label: 'Lead', icon: UserPlus, iconBg: 'bg-brand-50', iconColor: 'text-brand-600' },
  student: { label: 'Student', icon: GraduationCap, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  application: { label: 'Application', icon: FileText, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  announcement: { label: 'Announcement', icon: Megaphone, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  webinar: { label: 'Webinar', icon: CalendarClock, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
  // The API notifies on support tickets too; the mock feed never did.
  ticket: { label: 'Ticket', icon: Headset, iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
}
