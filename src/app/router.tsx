import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import LoginPage from '../features/auth/LoginPage'
import DashboardPage from '../features/dashboard/DashboardPage'
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
    children: [{ path: '/dashboard', element: <DashboardPage /> }],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
