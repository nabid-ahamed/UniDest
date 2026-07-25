import { Outlet } from 'react-router-dom'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { SidebarMessenger } from '../components/SidebarMessenger'
import { BackToTop } from '../components/BackToTop'
import { Breadcrumb } from '../components/Breadcrumb'
import { useUI } from '../store/ui'
import { cn } from '../lib/cn'

export default function AdminLayout() {
  const open = useUI((s) => s.sidebarOpen)

  // Clear the sidebar on desktop. When open its width is --sidebar-w (measured
  // from the header hamburger), so the content padding tracks the same value.
  const pad = open
    ? 'px-4 sm:px-6 lg:pl-[calc(var(--sidebar-w,15rem)+1rem)] lg:pr-8'
    : 'px-4 sm:px-6 lg:pl-[92px] lg:pr-8'

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <Sidebar />
      <SidebarMessenger />
      <BackToTop />

      <main className={cn('flex-1 py-6 transition-[padding] duration-300', pad)}>
        <Breadcrumb />
        <Outlet />
      </main>

      <footer
        className={cn(
          // Copyright type spec: Source Sans 3 Semibold · 14px / 21px · 0 tracking · #545454
          "border-t border-slate-200 bg-white py-2.5 text-center font-['Source_Sans_3',_'Open_Sans',_sans-serif] text-sm font-semibold leading-[21px] tracking-normal text-[#545454] transition-[padding] duration-300",
          pad,
        )}
      >
        Copyright © {new Date().getFullYear()} <span className="font-bold">GlobalEd</span> All Rights Reserved.
      </footer>
    </div>
  )
}
