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
import AdditionalServicesPage from '../features/services/AdditionalServicesPage'
import ServiceViewPage from '../features/services/ServiceViewPage'
import BroadcastHistoryPage from '../features/broadcast/BroadcastHistoryPage'
import UniversityInvoicesPage from '../features/invoices/UniversityInvoicesPage'
import StudentInvoicesPage from '../features/invoices/StudentInvoicesPage'
import StudentInvoiceFormPage from '../features/invoices/StudentInvoiceFormPage'
import ReferralSignupsPage from '../features/referral/ReferralSignupsPage'
import ReferralPayoutPage from '../features/referral/ReferralPayoutPage'
import AnalyticsPage from '../features/analytics/AnalyticsPage'
import AutomationPage from '../features/automation/AutomationPage'
import WorkflowFormPage from '../features/automation/WorkflowFormPage'
import WorkflowDetailPage from '../features/automation/WorkflowDetailPage'
import CampaignFormPage from '../features/automation/CampaignFormPage'
import CampaignDetailPage from '../features/automation/CampaignDetailPage'
import StaffPage from '../features/staff/StaffPage'
import StaffFormPage from '../features/staff/StaffFormPage'
import StaffViewPage from '../features/staff/StaffViewPage'
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
          { path: '/services', element: <AdditionalServicesPage /> },
          { path: '/services/:id', element: <ServiceViewPage /> },
          { path: '/broadcast', element: <BroadcastPage /> },
          { path: '/broadcast/history', element: <BroadcastHistoryPage /> },
          { path: '/invoices/university', element: <UniversityInvoicesPage /> },
          { path: '/invoices/student', element: <StudentInvoicesPage /> },
          { path: '/invoices/student/new', element: <StudentInvoiceFormPage /> },
          { path: '/invoices/student/:id/edit', element: <StudentInvoiceFormPage /> },
          { path: '/referral/signups', element: <ReferralSignupsPage /> },
          { path: '/referral/payout', element: <ReferralPayoutPage /> },
          { path: '/analytics', element: <AnalyticsPage /> },
          { path: '/automation', element: <AutomationPage /> },
          { path: '/automation/campaigns', element: <AutomationPage /> },
          { path: '/automation/create/workflow', element: <WorkflowFormPage /> },
          { path: '/automation/workflow/:id', element: <WorkflowDetailPage /> },
          { path: '/automation/create/campaign', element: <CampaignFormPage /> },
          { path: '/automation/campaign/:id', element: <CampaignDetailPage /> },
          { path: '/staff', element: <StaffPage /> },
          { path: '/staff/new', element: <StaffFormPage /> },
          { path: '/staff/:id', element: <StaffViewPage /> },
          { path: '/staff/:id/edit', element: <StaffFormPage /> },
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
