import { Outlet } from 'react-router-dom'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { Breadcrumb } from '../components/Breadcrumb'
import { useUI } from '../store/ui'
import { cn } from '../lib/cn'

export default function AdminLayout() {
  const open = useUI((s) => s.sidebarOpen)

  // Clear the sidebar on desktop: full w-60 when open, icon rail when collapsed.
  const pad = open
    ? 'px-4 sm:px-6 lg:pl-64 lg:pr-8'
    : 'px-4 sm:px-6 lg:pl-[92px] lg:pr-8'

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <Sidebar />

      <main className={cn('flex-1 py-6 transition-[padding] duration-300', pad)}>
        <Breadcrumb />
        <Outlet />
      </main>

      <footer
        className={cn(
          'border-t border-slate-200 py-4 text-center text-xs text-slate-400 transition-[padding] duration-300',
          pad,
        )}
      >
        © {new Date().getFullYear()} UniDest. All rights reserved.
      </footer>
    </div>
  )
}
