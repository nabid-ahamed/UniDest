import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom'
import LoginPage from '../features/auth/LoginPage'
import AdminLayout from '../layouts/AdminLayout'
import DashboardPage from '../features/dashboard/DashboardPage'
import LeadsPage from '../features/leads/LeadsPage'
import AddLeadPage from '../features/leads/AddLeadPage'
import LeadViewPage from '../features/leads/LeadViewPage'
import EditLeadProfilePage from '../features/leads/EditLeadProfilePage'
import StudentsPage from '../features/students/StudentsPage'
import StudentFormPage from '../features/students/StudentFormPage'
import StudentViewPage from '../features/students/StudentViewPage'
import ApplicationsPage from '../features/applications/ApplicationsPage'
import ApplicationViewPage from '../features/applications/ApplicationViewPage'
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
import NotificationsPage from '../features/notifications/NotificationsPage'
import WebinarsPage from '../features/webinars/WebinarsPage'
import WebinarViewPage from '../features/webinars/WebinarViewPage'
import EditWebinarPage from '../features/webinars/EditWebinarPage'
import WebinarEnrolledPage from '../features/webinars/WebinarEnrolledPage'
import StudentLayout from '../layouts/StudentLayout'
import StudentDashboardPage from '../features/student/StudentDashboardPage'
import StudentCourseSuggestionsPage from '../features/student/StudentCourseSuggestionsPage'
import StudentApplyPage from '../features/student/StudentApplyPage'
import StudentApplicationsPage from '../features/student/StudentApplicationsPage'
import StudentApplicationDetailPage from '../features/student/StudentApplicationDetailPage'
import StudentServicesPage from '../features/student/StudentServicesPage'
import StudentServiceDetailPage from '../features/student/StudentServiceDetailPage'
import StudentCourseFinderPage from '../features/student/StudentCourseFinderPage'
import StudentCountryInfoPage from '../features/student/StudentCountryInfoPage'
import StudentCountryInfoDetailPage from '../features/student/StudentCountryInfoDetailPage'
import StudentFeesPage from '../features/student/StudentFeesPage'
import StudentInvoiceDetailPage from '../features/student/StudentInvoiceDetailPage'
import StudentPortalResourcesPage from '../features/student/StudentResourcesPage'
import StudentResourceCategoryPage from '../features/student/StudentResourceCategoryPage'
import StudentWebinarsPage from '../features/student/StudentWebinarsPage'
import StudentAccountPage from '../features/student/StudentAccountPage'
import NotFoundPage from '../features/misc/NotFoundPage'
import BasicInfoPage from '../features/profile/BasicInfoPage'
import { useAuth } from '../store/auth'

const isStudent = (role?: string) => role === 'Student'
const isStaff = (role?: string) => role === 'Staff'

/**
 * Admin backoffice paths a Staff user is allowed to open. Staff share the admin
 * shell (Header + Sidebar), but only these modules are enabled for them — any
 * other admin path bounces them to the "not built yet" Staff Portal placeholder.
 * Enable a module for staff by adding its path here (prefix match covers nested
 * routes, e.g. '/leads' → '/leads/:id').
 */
const STAFF_ALLOWED = ['/dashboard', '/leads', '/students', '/applications', '/services', '/course-finder', '/broadcast', '/webinars', '/invoices', '/analytics', '/automation', '/student-resources', '/media-library', '/cms/blog', '/cms/pages', '/cms/newsletter', '/announcements', '/message-templates', '/user-management', '/import', '/profile']
const staffCanAccess = (pathname: string) =>
  STAFF_ALLOWED.some((p) => pathname === p || pathname.startsWith(p + '/'))

/** Where a signed-in user's home lives, based on their role. */
const homeFor = (role?: string) =>
  isStudent(role) ? '/portal' : '/dashboard'

/**
 * Admin backoffice: authenticated non-students. Admins get everything; Staff are
 * limited to `STAFF_ALLOWED` and bounced to the Staff Portal placeholder elsewhere.
 */
function RequireBackoffice() {
  const { isAuthenticated, user } = useAuth()
  const { pathname } = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isStudent(user?.role)) return <Navigate to="/portal" replace />
  // Staff hitting a module they don't have access to → 404 (those links are hidden
  // from their nav, so a direct URL is effectively a broken link for them).
  if (isStaff(user?.role) && !staffCanAccess(pathname)) return <NotFoundPage />
  return <Outlet />
}

/** Student area: must be authenticated AND a student (everyone else → their home). */
function RequireStudent() {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isStudent(user?.role)) return <Navigate to={homeFor(user?.role)} replace />
  return <Outlet />
}

/** Sends each user to their role's home (or the login page). */
function RootRedirect() {
  const { isAuthenticated, user } = useAuth()
  return <Navigate to={isAuthenticated ? homeFor(user?.role) : '/login'} replace />
}

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireStudent />,
    children: [
      {
        element: <StudentLayout />,
        children: [
          { path: '/portal', element: <StudentDashboardPage /> },
          { path: '/portal/course-suggestions', element: <StudentCourseSuggestionsPage /> },
          { path: '/portal/apply', element: <StudentApplyPage /> },
          { path: '/portal/applications', element: <StudentApplicationsPage /> },
          { path: '/portal/applications/:id', element: <StudentApplicationDetailPage /> },
          { path: '/portal/services', element: <StudentServicesPage /> },
          { path: '/portal/services/:id', element: <StudentServiceDetailPage /> },
          { path: '/portal/course-finder', element: <StudentCourseFinderPage /> },
          { path: '/portal/country-info', element: <StudentCountryInfoPage /> },
          { path: '/portal/country-info/:id', element: <StudentCountryInfoDetailPage /> },
          { path: '/portal/fees', element: <StudentFeesPage /> },
          { path: '/portal/fees/:id', element: <StudentInvoiceDetailPage /> },
          { path: '/portal/resources', element: <StudentPortalResourcesPage /> },
          { path: '/portal/resources/:id', element: <StudentResourceCategoryPage /> },
          { path: '/portal/webinars', element: <StudentWebinarsPage /> },
          { path: '/portal/account', element: <StudentAccountPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireBackoffice />,
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
          { path: '/students/new', element: <StudentFormPage /> },
          { path: '/students/:id', element: <StudentViewPage /> },
          { path: '/students/:id/edit', element: <StudentFormPage /> },
          { path: '/applications', element: <ApplicationsPage /> },
          { path: '/applications/:id', element: <ApplicationViewPage /> },
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
          { path: '/automation/workflow/:id/edit', element: <WorkflowFormPage /> },
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
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/profile', element: <BasicInfoPage /> },
          { path: '/webinars', element: <WebinarsPage /> },
          { path: '/webinars/:id', element: <WebinarViewPage /> },
          { path: '/webinars/:id/edit', element: <EditWebinarPage /> },
          { path: '/webinars/:id/enrolled', element: <WebinarEnrolledPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
