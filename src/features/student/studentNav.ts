import {
  Home,
  BookOpen,
  Send,
  FileText,
  ClipboardList,
  Search,
  Globe,
  ReceiptText,
  Layers,
  CalendarDays,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

export interface StudentNavItem {
  to: string
  label: string
  icon: LucideIcon
  /** react-router NavLink `end` — only Home needs an exact match. */
  end?: boolean
}

/**
 * Student portal menu. Mirrors the EduCtrl cn4 "STUDENT MENU" (reference only)
 * but wired to our own /portal routes. Kept in one place so the sidebar (and any
 * future mobile drawer) share a single source of truth.
 */
export const studentNav: StudentNavItem[] = [
  { to: '/portal', label: 'Home', icon: Home, end: true },
  { to: '/portal/course-suggestions', label: 'Course Suggestions', icon: BookOpen },
  { to: '/portal/apply', label: 'Study Abroad Apply', icon: Send },
  { to: '/portal/applications', label: 'My Applications', icon: FileText },
  { to: '/portal/services', label: 'Additional Services', icon: ClipboardList },
  { to: '/portal/course-finder', label: 'Course Finder', icon: Search },
  { to: '/portal/country-info', label: 'Country Information', icon: Globe },
  { to: '/portal/fees', label: 'Fees', icon: ReceiptText },
  { to: '/portal/resources', label: 'Resources', icon: Layers },
  { to: '/portal/webinars', label: 'Webinar & Events', icon: CalendarDays },
  { to: '/portal/account', label: 'My Account', icon: UserRound },
]
