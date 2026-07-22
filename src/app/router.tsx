import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import LoginPage from '../features/auth/LoginPage'
import AdminLayout from '../layouts/AdminLayout'
import DashboardPage from '../features/dashboard/DashboardPage'
import LeadsPage from '../features/leads/LeadsPage'
import AddLeadPage from '../features/leads/AddLeadPage'
import LeadViewPage from '../features/leads/LeadViewPage'
import EditLeadProfilePage from '../features/leads/EditLeadProfilePage'
import StudentsPage from '../features/students/StudentsPage'
import StudentViewPage from '../features/students/StudentViewPage'
import ApplicationsPage from '../features/applications/ApplicationsPage'
import CourseFinderPage from '../features/courseFinder/CourseFinderPage'
import BroadcastPage from '../features/broadcast/BroadcastPage'
import BroadcastHistoryPage from '../features/broadcast/BroadcastHistoryPage'
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
          { path: '/leads/:id', element: <LeadViewPage /> },
          { path: '/leads/:id/edit', element: <EditLeadProfilePage /> },
          { path: '/students', element: <StudentsPage /> },
          { path: '/students/:id', element: <StudentViewPage /> },
          { path: '/applications', element: <ApplicationsPage /> },
          { path: '/course-finder', element: <CourseFinderPage /> },
          { path: '/broadcast', element: <BroadcastPage /> },
          { path: '/broadcast/history', element: <BroadcastHistoryPage /> },
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
