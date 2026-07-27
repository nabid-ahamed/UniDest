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
  **`/applications`**, **`/services`** and **`/course-finder`** (+ `/staff-portal` itself).
  `staffCanAccess(pathname)` prefix-matches, so adding `'/leads'` would also cover
  `/leads/:id`. **To give staff another admin module, add its path here.**
- **Guard** — one unified `RequireBackoffice` wraps the whole admin tree:
  unauthenticated → `/login`; students → `/portal`; **staff on a path not in
  `STAFF_ALLOWED` → `/staff-portal`** (the "not built yet" placeholder); admins get
  everything. `RequireStudent` is unchanged. (The old separate `RequireAdmin` /
  `RequireStaff` guards were merged into `RequireBackoffice`.)
- Result: the Sidebar/Header are literally the admin ones (no role-gating in those
  components), so staff see the full admin nav; clicking a not-yet-enabled item
  lands on the Staff Portal placeholder, while **Dashboard** shows the real admin
  `DashboardPage`.

**Maps to (future):** `users` row with a staff role (see the admin Staff module
`src/mock/staff.ts` → `StaffRole`) authenticating via `POST /login`; per-module
access becomes a real permission check instead of the `STAFF_ALLOWED` allowlist.

---

## Index

| Module | Route | Reuses | Status |
|--------|-------|--------|--------|
| [Dashboard](#dashboard-dashboard) | `/dashboard` | admin `DashboardPage` (`src/mock/dashboard.ts`) | ✅ enabled |
| [Locked placeholder](#locked-placeholder-staff-portal) | `/staff-portal` | — (placeholder) | 🚧 fallback for not-yet-enabled modules |
| Leads | `/leads` (+ `/new`, `/:id`, `/:id/edit`) | admin `LeadsPage` / `AddLeadPage` / `LeadViewPage` / `EditLeadProfilePage` | ✅ enabled |
| Students | `/students` (+ `/new`, `/:id`, `/:id/edit`) | admin `StudentsPage` / `StudentFormPage` / `StudentViewPage` | ✅ enabled |
| Applications | `/applications` (+ `/:id`) | admin `ApplicationsPage` / `ApplicationViewPage` | ✅ enabled |
| Additional Services | `/services` (+ `/:id`) | admin `AdditionalServicesPage` / `ServiceViewPage` | ✅ enabled (View-only for staff — no Assign/Delete) |
| Course Finder | `/course-finder` | admin `CourseFinderPage` | ✅ enabled |
| …rest of admin nav | — | admin pages | ⬜ not enabled |

> Staff reuse the admin pages as-is; "enabling" a module = adding its path to
> `STAFF_ALLOWED` in `src/app/router.tsx`. Until then the sidebar item is visible
> but lands on the locked placeholder. If a module later needs a **staff-scoped**
> variant (e.g. leads filtered to `assignedTo === current staff`), document that
> mock/derivation here when it's built.

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

## Locked placeholder (`/staff-portal`)

- **Page:** `src/features/staffPortal/StaffPortalPage.tsx` (content-only; renders
  inside `AdminLayout`).
- Where staff land when they open an admin path **not** in `STAFF_ALLOWED`
  (`RequireBackoffice` redirects there). A centered card — `Construction` icon
  tile (brand tint) + "Staff Portal" heading + "This page hasn't been built yet"
  message. No mock data. As modules are enabled, staff hit this less and less.
