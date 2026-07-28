import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { StudentSidebar } from '../features/student/StudentSidebar'
import { StudentHeader } from '../features/student/StudentHeader'
import { ImpersonationBanner } from '../features/student/ImpersonationBanner'
import { GlobalSuccessDialog } from '../components/ui/GlobalSuccessDialog'

/**
 * Student portal shell — deliberately distinct from the admin `AdminLayout`.
 * A fixed white sidebar (lg+) with the brand-blue top header over the content;
 * students never see any admin chrome or routes. Mirrors AdminLayout's single
 * `flex min-h-screen flex-col` wrapper so the whole page scrolls with the window.
 */
export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 lg:pl-64">
      <StudentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ImpersonationBanner />
      <StudentHeader onMenuClick={() => setSidebarOpen(true)} />
      <main className="flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
      <GlobalSuccessDialog />
    </div>
  )
}
