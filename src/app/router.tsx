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
import CoursesPage from '../features/courseManagement/CoursesPage'
import CourseFormPage from '../features/courseManagement/CourseFormPage'
import CourseViewPage from '../features/courseManagement/CourseViewPage'
import UniversitiesPage from '../features/courseManagement/UniversitiesPage'
import UniversityFormPage from '../features/courseManagement/UniversityFormPage'
import UniversityViewPage from '../features/courseManagement/UniversityViewPage'
import CourseCategoriesPage from '../features/courseManagement/CourseCategoriesPage'
import StudentResourcesPage from '../features/studentResources/StudentResourcesPage'
import ResourceCategoriesPage from '../features/studentResources/ResourceCategoriesPage'
import MediaLibraryPage from '../features/mediaLibrary/MediaLibraryPage'
import MediaDetailPage from '../features/mediaLibrary/MediaDetailPage'
import AnnouncementsPage from '../features/announcements/AnnouncementsPage'
import AnnouncementFormPage from '../features/announcements/AnnouncementFormPage'
import AnnouncementViewPage from '../features/announcements/AnnouncementViewPage'
import UserManagementPage from '../features/userManagement/UserManagementPage'
import UserFormPage from '../features/userManagement/UserFormPage'
import UserViewPage from '../features/userManagement/UserViewPage'
import HomePageSettingsPage from '../features/cms/HomePageSettingsPage'
import CountriesPage from '../features/cms/CountriesPage'
import CountryFormPage from '../features/cms/CountryFormPage'
import BlogPostsPage from '../features/cms/BlogPostsPage'
import BlogPostFormPage from '../features/cms/BlogPostFormPage'
import PagesPage from '../features/cms/PagesPage'
import PageFormPage from '../features/cms/PageFormPage'
import MenuManagerPage from '../features/cms/MenuManagerPage'
import NewsletterPage from '../features/cms/NewsletterPage'
import TemplatesPage from '../features/messageTemplates/TemplatesPage'
import TemplateFormPage from '../features/messageTemplates/TemplateFormPage'
import CannedResponsesPage from '../features/messageTemplates/CannedResponsesPage'
import CannedResponseFormPage from '../features/messageTemplates/CannedResponseFormPage'
import ImportPage from '../features/import/ImportPage'
import BackupsPage from '../features/backups/BackupsPage'
import RolesPage from '../features/roles/RolesPage'
import RoleFormPage from '../features/roles/RoleFormPage'
import SettingsPage from '../features/settings/SettingsPage'
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
          { path: '/courses', element: <CoursesPage /> },
          { path: '/courses/new', element: <CourseFormPage /> },
          { path: '/courses/:id', element: <CourseViewPage /> },
          { path: '/courses/:id/edit', element: <CourseFormPage /> },
          { path: '/course-categories', element: <CourseCategoriesPage /> },
          { path: '/universities', element: <UniversitiesPage /> },
          { path: '/universities/new', element: <UniversityFormPage /> },
          { path: '/universities/:id', element: <UniversityViewPage /> },
          { path: '/universities/:id/edit', element: <UniversityFormPage /> },
          { path: '/student-resources', element: <StudentResourcesPage /> },
          { path: '/student-resources/categories', element: <ResourceCategoriesPage /> },
          { path: '/media-library', element: <MediaLibraryPage /> },
          { path: '/media-library/:id', element: <MediaDetailPage /> },
          { path: '/announcements', element: <AnnouncementsPage /> },
          { path: '/announcements/new', element: <AnnouncementFormPage /> },
          { path: '/announcements/:id', element: <AnnouncementViewPage /> },
          { path: '/announcements/:id/edit', element: <AnnouncementFormPage /> },
          { path: '/user-management', element: <UserManagementPage /> },
          { path: '/user-management/new', element: <UserFormPage /> },
          { path: '/user-management/:id', element: <UserViewPage /> },
          { path: '/user-management/:id/edit', element: <UserFormPage /> },
          { path: '/cms/home-page', element: <HomePageSettingsPage /> },
          { path: '/cms/countries', element: <CountriesPage /> },
          { path: '/cms/countries/:id/edit', element: <CountryFormPage /> },
          { path: '/cms/blog', element: <BlogPostsPage /> },
          { path: '/cms/blog/new', element: <BlogPostFormPage /> },
          { path: '/cms/blog/:id/edit', element: <BlogPostFormPage /> },
          { path: '/cms/pages', element: <PagesPage /> },
          { path: '/cms/pages/new', element: <PageFormPage /> },
          { path: '/cms/pages/:id/edit', element: <PageFormPage /> },
          { path: '/cms/menu', element: <MenuManagerPage /> },
          { path: '/cms/newsletter', element: <NewsletterPage /> },
          { path: '/message-templates/email', element: <TemplatesPage channel="email" /> },
          { path: '/message-templates/sms', element: <TemplatesPage channel="sms" /> },
          { path: '/message-templates/whatsapp', element: <TemplatesPage channel="whatsapp" /> },
          { path: '/message-templates/canned', element: <CannedResponsesPage /> },
          { path: '/message-templates/canned/new', element: <CannedResponseFormPage /> },
          { path: '/message-templates/canned/:id/edit', element: <CannedResponseFormPage /> },
          { path: '/message-templates/:channel/new', element: <TemplateFormPage /> },
          { path: '/message-templates/:channel/:id/edit', element: <TemplateFormPage /> },
          { path: '/import', element: <ImportPage /> },
          { path: '/backups', element: <BackupsPage /> },
          { path: '/roles', element: <RolesPage /> },
          { path: '/roles/new', element: <RoleFormPage /> },
          { path: '/roles/:id/edit', element: <RoleFormPage /> },
          { path: '/settings', element: <SettingsPage /> },
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
