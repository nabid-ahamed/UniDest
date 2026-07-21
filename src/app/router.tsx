import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import LoginPage from '../features/auth/LoginPage'
import AdminLayout from '../layouts/AdminLayout'
import DashboardPage from '../features/dashboard/DashboardPage'
import LeadsPage from '../features/leads/LeadsPage'
import AddLeadPage from '../features/leads/AddLeadPage'
import StudentsPage from '../features/students/StudentsPage'
import ApplicationsPage from '../features/applications/ApplicationsPage'
import WebinarsPage from '../features/webinars/WebinarsPage'
import WebinarViewPage from '../features/webinars/WebinarViewPage'
import EditWebinarPage from '../features/webinars/EditWebinarPage'
import WebinarEnrolledPage from '../features/webinars/WebinarEnrolledPage'
import { useAuth } from '../store/auth'

/** Guards routes that require authentication. */
function ProtectedRoute() {
  const isAuthenticated = useAuth((s) => s.isAuthenticated)
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/leads', element: <LeadsPage /> },
          { path: '/leads/new', element: <AddLeadPage /> },
          { path: '/students', element: <StudentsPage /> },
          { path: '/applications', element: <ApplicationsPage /> },
          { path: '/webinars', element: <WebinarsPage /> },
          { path: '/webinars/:id', element: <WebinarViewPage /> },
          { path: '/webinars/:id/edit', element: <EditWebinarPage /> },
          { path: '/webinars/:id/enrolled', element: <WebinarEnrolledPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
