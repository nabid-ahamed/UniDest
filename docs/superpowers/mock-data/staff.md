# UniDest — Staff Portal Mock Data

Single reference for **all Staff-portal mock data** while we build the
staff-facing pages frontend-first. Each page gets a section below documenting:
**where the data lives**, its **shape (fields + types)**, record counts, and
which **DB table** (from the design spec) it maps to when the real backend
arrives.

> This is the staff-portal counterpart to
> [adminpage.md](adminpage.md) (the admin CRM pages) and
> [student.md](student.md) (the student portal). Where a screen reuses admin-side
> data (e.g. a staff member's assigned leads/students/applications), link across
> to the matching admin section instead of duplicating the shape here. The admin
> **Staff** module (staff records, roles, live workload) is already documented in
> [adminpage.md → Staff](adminpage.md#staff-staff) — reuse `src/mock/staff.ts`
> rather than re-seeding staff here.

**Update this file whenever mock data is added or changed** for any staff
page, so building later pages stays consistent and the eventual API swap is
easy.

**Convention:** all mock data lives in `src/mock/*.ts` (one file per
page/domain), never inline in components. Types are exported alongside the data.
Staff-portal-only mocks go in `src/mock/staff/*.ts` (or a clearly named file) so
they stay separate from admin and student mocks.

**Related:** DB schema in
[../specs/2026-07-18-unidest-crm-design.md](../specs/2026-07-18-unidest-crm-design.md) (§5).

---

## Auth, role & routing

Staff **share the admin backoffice shell** (`AdminLayout` — same Header row +
Sidebar as the admin CRM) and reuse the admin page components directly, one
module at a time. Access is gated by a per-path allowlist, so "make module X the
same as admin" is a one-line change.

- **Demo login** (`src/features/auth/LoginPage.tsx` → `DEMO_ACCOUNTS`):
  `staff@gmail.com` / `123456`, role `Staff`, redirect `/dashboard` (amber role
  badge). One-click **Copy** auto-fills the form like the other demo rows.
- **Role home** (`src/app/router.tsx` → `homeFor`): `Student → /portal`,
  everyone else (Admin **and** Staff) `→ /dashboard`. `isStaff(role)` =
  `role === 'Staff'`.
- **Enabled modules** (`STAFF_ALLOWED` in `src/app/router.tsx`): the admin paths
  a Staff user may open. Currently **`/dashboard`**, **`/leads`**, **`/students`**,
  **`/applications`**, **`/services`**, **`/course-finder`**, **`/broadcast`**,
  **`/webinars`**, **`/invoices`**, **`/analytics`**, **`/automation`** and
  **`/student-resources`**, **`/media-library`** and the CMS subset
  **`/cms/blog`** / **`/cms/pages`** / **`/cms/newsletter`**, **`/announcements`** and
  **`/message-templates`**, **`/user-management`** and **`/import`**.
  `staffCanAccess(pathname)` prefix-matches, so adding `'/leads'` would also cover
  `/leads/:id`. **To give staff another admin module, add its path here.**
- **Guard** — one unified `RequireBackoffice` wraps the whole admin tree:
  unauthenticated → `/login`; students → `/portal`; **staff on a path not in
  `STAFF_ALLOWED` → renders the 404 `NotFoundPage`** (those links are hidden from the
  staff nav, so a direct URL is effectively a broken link for them); admins get
  everything. `RequireStudent` is unchanged. (The old separate `RequireAdmin` /
  `RequireStaff` guards were merged into `RequireBackoffice`.)
- **Sidebar** is role-aware (`src/components/Sidebar.tsx`): `STAFF_HIDDEN_ITEMS`
  (Referral, Staff, Backups, Roles, Settings) and `STAFF_HIDDEN_CHILDREN` (CMS: Home
  Page, Countries, Menu Manager) are dropped for staff, so they only see items they
  can actually use. Dashboard shows the real admin `DashboardPage`.
- The old "Staff Portal — not built yet" placeholder page was **removed** (staff now
  have almost every module; disallowed paths 404 instead).

**Maps to (future):** `users` row with a staff role (see the admin Staff module
`src/mock/staff.ts` → `StaffRole`) authenticating via `POST /login`; per-module
access becomes a real permission check instead of the `STAFF_ALLOWED` allowlist.

---

## Index

| Module | Route | Reuses | Status |
|--------|-------|--------|--------|
| [Dashboard](#dashboard-dashboard) | `/dashboard` | admin `DashboardPage` (`src/mock/dashboard.ts`) | ✅ enabled |
| Leads | `/leads` (+ `/new`, `/:id`, `/:id/edit`) | admin `LeadsPage` / `AddLeadPage` / `LeadViewPage` / `EditLeadProfilePage` | ✅ enabled |
| Students | `/students` (+ `/new`, `/:id`, `/:id/edit`) | admin `StudentsPage` / `StudentFormPage` / `StudentViewPage` | ✅ enabled |
| Applications | `/applications` (+ `/:id`) | admin `ApplicationsPage` / `ApplicationViewPage` | ✅ enabled |
| Additional Services | `/services` (+ `/:id`) | admin `AdditionalServicesPage` / `ServiceViewPage` | ✅ enabled (View-only for staff — no Assign/Delete) |
| Course Finder | `/course-finder` | admin `CourseFinderPage` | ✅ enabled |
| Broadcast | `/broadcast` (+ `/history`) | admin `BroadcastPage` / `BroadcastHistoryPage` | ✅ enabled |
| Webinar & Events | `/webinars` (+ `/:id`, `/:id/edit`, `/:id/enrolled`) | admin `WebinarsPage` / `WebinarViewPage` / `EditWebinarPage` / `WebinarEnrolledPage` | ✅ enabled |
| Invoices | `/invoices/university`, `/invoices/student` (+ `/new`, `/:id/edit`) | admin `UniversityInvoicesPage` / `StudentInvoicesPage` / `StudentInvoiceFormPage` | ✅ enabled (staff cannot **Edit**/**Delete** — those actions hidden for `role === 'Staff'`) |
| Analytics | `/analytics` | admin `AnalyticsPage` | ✅ enabled |
| Automation | `/automation` (+ `/campaigns`, `/create/workflow`, `/workflow/:id`, `/workflow/:id/edit`, `/create/campaign`, `/campaign/:id`) | admin `AutomationPage` / `WorkflowFormPage` / `WorkflowDetailPage` / `CampaignFormPage` / `CampaignDetailPage` | ✅ enabled |
| Student Resources | `/student-resources` (+ `/categories`) | admin `StudentResourcesPage` / `ResourceCategoriesPage` | ✅ enabled |
| Media Library | `/media-library` (+ `/:id`) | admin `MediaLibraryPage` / `MediaDetailPage` | ✅ enabled |
| CMS (partial) | `/cms/blog` (+ `/new`, `/:id/edit`), `/cms/pages` (+ `/new`, `/:id/edit`), `/cms/newsletter` | admin `BlogPostsPage` / `BlogPostFormPage` / `PagesPage` / `PageFormPage` / `NewsletterPage` | ✅ enabled — **only Blog Posts, Pages, Newsletter** (Home Page / Countries / Menu Manager hidden via `STAFF_HIDDEN_CHILDREN`) |
| Announcements | `/announcements` (+ `/new`, `/:id`, `/:id/edit`) | admin `AnnouncementsPage` / `AnnouncementFormPage` / `AnnouncementViewPage` | ✅ enabled |
| Message Templates | `/message-templates/email`, `/sms`, `/whatsapp`, `/canned` (+ their `/new`, `/:id/edit`) | admin `TemplatesPage` / `TemplateFormPage` / `CannedResponsesPage` / `CannedResponseFormPage` | ✅ enabled |
| User Management | `/user-management` (+ `/new`, `/:id`, `/:id/edit`) | admin `UserManagementPage` / `UserFormPage` / `UserViewPage` | ✅ enabled |
| Import | `/import` | admin `ImportPage` | ✅ enabled |
| Course Management | `/courses`, `/course-categories`, `/universities` | admin pages | ⬜ not enabled (still visible in staff nav) |
| Backups / Roles / Settings | — | admin pages | ⛔ hidden from staff (`STAFF_HIDDEN_ITEMS`) → 404 on direct URL |

> Staff reuse the admin pages as-is; "enabling" a module = adding its path to
> `STAFF_ALLOWED` in `src/app/router.tsx`. A disallowed path renders the **404
> `NotFoundPage`** (`src/features/misc/NotFoundPage.tsx`). If a module later needs a
> **staff-scoped** variant (e.g. leads filtered to `assignedTo === current staff`),
> document that mock/derivation here when it's built.

---

## Dashboard (`/dashboard`)

- **Page:** the admin `src/features/dashboard/DashboardPage.tsx` — reused
  verbatim (no staff-specific copy). Documented in
  [adminpage.md → Dashboard](adminpage.md#dashboard).
- Enabled for staff via `STAFF_ALLOWED = ['/dashboard', …]`. A signed-in staff
  user lands here (`homeFor('Staff') → /dashboard`) and sees the same KPI cards,
  charts, follow-ups and status grids as an admin, inside the shared `AdminLayout`.
- **Future staff-scoping:** when staff should see only *their* numbers, swap in a
  version that scopes the dashboard mocks to `assignedTo === current staff`
  (mirrors the admin Staff detail page's live `workload()` in `src/mock/staff.ts`).

## Disallowed / broken paths → 404

- **Page:** `src/features/misc/NotFoundPage.tsx` (standalone, no layout chrome).
  Also wired to the router catch-all `{ path: '*' }`, so any unmatched URL shows it.
- A staff user opening an admin path **not** in `STAFF_ALLOWED` (e.g. `/roles`,
  `/settings`, `/courses`) gets the 404 from `RequireBackoffice` — the old "Staff
  Portal — not built yet" placeholder was removed once staff had almost every module.
- The 404's button reads **Back to home** (→ `homeFor(role)`) when signed in, or
  **Back to login** otherwise.
