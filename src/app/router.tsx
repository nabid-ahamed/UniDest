import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import LoginPage from '../features/auth/LoginPage'
import AdminLayout from '../layouts/AdminLayout'
import DashboardPage from '../features/dashboard/DashboardPage'
import StudentsPage from '../features/students/StudentsPage'
import ApplicationsPage from '../features/applications/ApplicationsPage'
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
          { path: '/students', element: <StudentsPage /> },
          { path: '/applications', element: <ApplicationsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
