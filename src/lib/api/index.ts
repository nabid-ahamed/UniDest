/**
 * Public surface of the data layer.
 *
 * Feature code imports from here (`../../lib/api`) and nowhere else — not from
 * `src/mock/` and not from the resource modules. That single rule is what makes
 * the Phase 2 backend swap a change to `client.ts` and the resource files only.
 */
export { API_BASE_URL, USING_REAL_API, ApiError } from './client'
export { qk } from './keys'

export type { Lead } from './resources/leads'
export type { Student } from './resources/students'
export type { Application } from './resources/applications'

export { useLeads, useLead, useCreateLead, useUpdateLead, useDeleteLead } from './hooks/useLeads'
export {
  useStudents,
  useStudent,
  useCreateStudent,
  useUpdateStudent,
  useSetStudentStatus,
  useDeleteStudent,
  useSetStudentState,
  usePurgeStudents,
  useSetStudentAssignee,
  useConvertLead,
} from './hooks/useStudents'
export type {
  ApiStaff,
  ApiRole,
  ApiBranch,
  AssignableUser,
  StaffWorkload,
} from './resources/staff'
export {
  useStaff,
  useStaffMember,
  useAssignableStaff,
  useRoles,
  useBranches,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
} from './hooks/useStaff'
export type {
  ApiCountry,
  ApiUniversity,
  ApiCourseCategory,
  CourseQuery,
  FinderCourse,
} from './resources/catalog'
export {
  useCountries,
  useUniversities,
  useCourseCategories,
  useCourses,
  useCourse,
} from './hooks/useCatalog'
export {
  useApplications,
  useApplication,
  useApplicationHistory,
  useCreateApplication,
  useUpdateApplication,
  useSetApplicationStatus,
  useSetApplicationAssignee,
  useDeleteApplication,
} from './hooks/useApplications'
export type { StatusHistoryEntry } from './resources/applications'
export type { BranchDashboard } from './resources/dashboard'
export { useDashboard, useDashboardBranches } from './hooks/useDashboard'
export type { ApplicationDocument } from './resources/documents'
export { documentsApi, ACCEPTED_FILE_TYPES, MAX_FILE_BYTES } from './resources/documents'
export { useApplicationDocuments, useUploadDocument, useDeleteDocument } from './hooks/useDocuments'
