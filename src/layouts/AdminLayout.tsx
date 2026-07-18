import { Outlet } from 'react-router-dom'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { useUI } from '../store/ui'
import { cn } from '../lib/cn'

export default function AdminLayout() {
  const open = useUI((s) => s.sidebarOpen)

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Sidebar />
      <main
        className={cn(
          'py-6 transition-[padding] duration-300',
          // Full width, left-hugging. When open on desktop, clear the w-60 (15rem) sidebar.
          open ? 'px-4 sm:px-6 lg:pl-64 lg:pr-8' : 'px-4 sm:px-6 lg:px-8',
        )}
      >
        <Outlet />
      </main>
    </div>
  )
}
