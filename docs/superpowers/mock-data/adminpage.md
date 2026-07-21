# UniDest — Admin Pages Mock Data

Single reference for **all admin-page mock data** while we build frontend-first.
Each page has a section below documenting: **where the data lives**, its **shape
(fields + types)**, record counts, and which **DB table** (from the design spec)
it maps to when the real backend arrives.

**Update this file whenever mock data is added or changed** for any admin page,
so building later pages (Students, Staff, …) stays consistent and the eventual
API swap is easy.

**Convention:** all mock data lives in `src/mock/*.ts` (one file per page/domain),
never inline in components. Types are exported alongside the data.

**Related:** DB schema in
[../specs/2026-07-18-unidest-crm-design.md](../specs/2026-07-18-unidest-crm-design.md) (§5).

---

## Index

| Page | Mock file | Status |
|------|-----------|--------|
| [Dashboard](#dashboard) | `src/mock/dashboard.ts` | ✅ done |
| [Leads](#leads) | `src/mock/leads.ts` | ✅ done |
| [Students](#students) | `src/mock/students.ts` | ✅ done |
| [Applications](#applications) | `src/mock/applications.ts` | ✅ done |
| Staff | `src/mock/staff.ts` | ⬜ not started |

---

## Dashboard

- **Mock file:** `src/mock/dashboard.ts`
- **Used by:** `src/features/dashboard/DashboardPage.tsx` (+ components under
  `src/features/dashboard/components/`)

### `dashboardStats: StatCardData[]`
Top KPI cards.

| Field | Type | Notes |
|-------|------|-------|
| key | `'leads' \| 'students' \| 'applications' \| 'support'` | drives icon |
| label | string | card title |
| sublabel | string | e.g. "Open Leads" |
| value | number | the KPI number |
| color | `'amber' \| 'blue' \| 'sky' \| 'purple'` | icon tint |

- Records: **4** (Leads 27, Students 1876, Applications 214, Support Tickets 96).
- **Maps to (future):** aggregate counts over `leads`, `students`, `applications`
  tables + a future `support_tickets` table (not in current schema).

### `studentsDaily`, `leadsDaily`, `applicationsDaily: DailyPoint[]`
Bar-chart series.

| Field | Type | Notes |
|-------|------|-------|
| date | string | axis label (`"06 Jul"` for 14-day, `"13"` for 7-day) |
| count | number | value for that day |

- Records: studentsDaily **14** (last 14 days), leadsDaily **7**, applicationsDaily **7**.
- **Maps to (future):** `COUNT(*) ... GROUP BY day` over `students` / `leads` /
  `applications` (`created_at`).

### `leadFollowups`, `studentFollowups: FollowUpBuckets`
Follow-ups grouped into `today` / `due` / `upcoming` (each a `FollowUp[]`).

| FollowUp field | Type | Notes |
|-------|------|-------|
| id | number | |
| name | string | lead/student name |
| detail | string | short context |
| when | string | relative time label |

- `today` is empty by design (shows the "No follow-ups for today!" empty state).
- **Maps to (future):** `tasks` table filtered by `assigned_to` + `due_date`
  buckets, joined to `leads` / `students`.

### `applicationReminders: Reminder[]` (+ `reminderCount: number`)
University/Visa application reminder list.

| Field | Type | Notes |
|-------|------|-------|
| id | number | |
| name | string | applicant |
| applicationNo | string | shown as `#354134` |
| deadline | string | display date |
| owner | string | staff/"You" |
| activity | string | reminder text |

- Records: **23** (`reminderCount = applicationReminders.length`, so count always
  matches the list). Card scrolls to show all.
- **Maps to (future):** `applications` + `application_status_history` / `tasks`
  with a deadline, joined to `students` and `users`.

### `branches: string[]`
Options for the "All Branch" filter dropdown.

- Records: **5** (`All Branch`, Dhaka, Chattogram, Sylhet, Khulna).
- **Maps to (future):** `branches` table (`name`), plus an "All" sentinel.

### Status-tile grids (`AppStatusStat`) — Study Abroad Stats / Students / Leads
Colored tiles: each = one status with a count + background color, rendered by
`StatusTileGrid` (2/3/4-col grid, pie icon per tile, auto dark text on light
backgrounds like the white "Total" tile).

`AppStatusStat = { label: string; count: number; color: string }`

| Export | Records | Section | Maps to (future) |
|--------|---------|---------|------------------|
| applicationStatusStats | 22 | Study Abroad Stats | `applications` grouped by `status_id` → `application_statuses` (label+color from that lookup, §5.3) |
| studentStatusStats | 7 | Students | `students` grouped by a student pipeline status |
| leadStatusStats | 14 | Leads | `leads` grouped by `status_id` → `lead_statuses` (label+color from lookup) |

### Tickets / Your Stats (`SimpleStat` / `Breakdown`)
`SimpleStat = { label: string; value: number }` → number tile.
`Breakdown = { label: string; count: number; color: string }` → horizontal bar list.

| Export | Type | Records | Section | Maps to (future) |
|--------|------|---------|---------|------------------|
| ticketSummary | SimpleStat[] | 4 | Tickets | future `support_tickets.status` counts |
| ticketsByPriority | Breakdown[] | 3 | Tickets | future `support_tickets.priority` |
| yourStats | SimpleStat[] | 4 | Your Stats | per-user counts scoped to `assigned_to = current user` |

---

## Leads

- **Mock file:** `src/mock/leads.ts`
- **Used by:** `src/features/leads/LeadsPage.tsx` (+ `components/LeadRow.tsx`)

### `leads: Lead[]`
Rows for the leads data table.

| Field | Type | Notes |
|-------|------|-------|
| id | number | shown in ID column |
| name | string | lead name (bold) |
| email / emailDate | string | contact email + short date |
| phone / phoneNote | string | mobile + short label |
| whatsapp | boolean | shows the green WhatsApp action |
| leadAgeDays | number | "Lead Age: N Days" badge |
| branch | string | branch badge (e.g. "Abc HQ") |
| status / statusColor | string | status badge label + hex |
| assignedTo | string \| null | null → "Unassigned" |
| created | string | created date |
| nextFollowup | string \| null | next follow-up date |
| countryInterested | string | destination country (drives the "Country Interested In" filter) |
| tags | string[] \| undefined | removable chips on the row, max 5 (seeded on 3 leads) |

- Records: **15** (one filtered page; `totalLeadCount = 190` shown as the full count).
- **Maps to (future):** `leads` table joined to `lead_statuses` (status+color),
  `users` (assignedTo), `branches`; contact fields inline; `tasks` for followups.

### Filter option lists
Basic: `leadStatuses` (7, label+color) · `leadStaff` (4) · `leadCountries` (5) ·
`leadBranches` (5: "All Branch" sentinel + Dhaka, Chattogram, Sylhet, Khulna).
Advanced ("More" panel): `allCountries` (~165, full world list — drives the
multi-select "Country Interested In" filter, wired to `leads.countryInterested`) ·
`studyLevels` (5) · `coursesInterested` (6) ·
`intakes` (**generated at runtime** — current month + next 24 months, formatted
"September 2026") · `followupDateOptions` (5) · `leadSources` (6). Drive the
Filter dropdowns.
- **Maps to (future):** `lead_statuses`, `users` (role=staff), countries,
  `branches`, `courses.level`, `courses`, `intakes`, `tasks`, `leads.source`.

Working now (frontend): search, **multi-select** Lead Status filter (chips with ×
removal), staff/branch filters, page size, pagination, row selection +
select-all, sticky table header, loading preloader.

### Row dialogs
- **Add Tags** (`components/AddTagDialog.tsx`) — combobox over `recentTags`
  (last 10 used, MRU-reordered); suggestions open on click or typing, and a
  `Create "…"` row adds a brand-new tag. Applied tags render as removable chips
  on the row, capped at **5 per lead**; exceeding it shows an `AlertDialog`
  warning instead of opening the dialog.
- **Lead - Assign Staff** (`components/AssignStaffDialog.tsx`) — select from
  `leadStaff`, pre-selects the current owner so it doubles as re-assignment.
  Assignees live in page state, so the staff filter and exports follow changes.
  Save confirms with the shared `SuccessDialog` ("Lead Assigned Successfully"),
  and the assigned cell keeps a 👤+ re-assign icon next to the name (same
  affordance as the Unassigned state).
- **Change Status to** (`StatusMenu` in `components/LeadRow.tsx`) — edit icon
  beside the status badge opens a dropdown of `leadStatuses` (colour dot per
  option, current one highlighted). Row statuses live in page state, so the
  badge colour, status filter, and exports all follow changes. Every applied
  change (direct or via the counselling dialog) confirms with the shared
  `SuccessDialog` ("Lead Status Changed Successfully" + animated check + OK);
  re-picking the same non-Counseling status is a silent no-op.
- **Convert Lead to Counselling** (`components/ConvertCounselingDialog.tsx`) —
  picking "Counseling" in the status menu opens this instead of switching
  directly: required counsellor (`leadStaff`) + a custom
  **`src/components/DateTimePicker.tsx`** popover (calendar with month/year
  dropdowns, prev/next + home-to-today, 6-week grid, today ringed; hourly time
  list 8 AM–10 PM with scroll arrows). Update applies the status, **writes the
  slot into the row's Next Followup column**, and **sets the counsellor as the
  row's Assigned To** (all three live in page state). Closing without Update
  changes nothing.

View / settings actions are still UI-only placeholders.

### Add New Lead form (`/leads/new`)
- **Component:** `src/features/leads/AddLeadPage.tsx` (reached via the "New Lead"
  button; full-page route under `AdminLayout`).
- Sections: **Personal Details** (name, gender, email, DOB, mobile/WhatsApp with
  country code + "Same as Mobile", alternate contact, country/state/city) ·
  **Study Interest** (study level, country interested, course, intake, service,
  other services textarea) · **Account & Academic** (login password + Generate,
  qualification, passout year, score, currently studying, work experience,
  English test scores).
- Extra option lists in `src/mock/leads.ts`: `qualifications` (7) ·
  `phoneCountryCodes` (7, `{code,label}`) · `englishTests` (5: IELTS/TOEFL/PTE/
  GRE/DUOLINGO).
- Frontend-only: submit shows a success toast then redirects to `/leads` (no
  persistence yet). **Maps to (future):** `POST /leads` creating a `leads` row +
  related `student_preferences` / `student_test_scores`.

---

## Students

- **Mock file:** `src/mock/students.ts`
- **Used by:** `src/features/students/StudentsPage.tsx` (+ `components/StudentRow.tsx`)

### `students: Student[]`
Rows for the students data table.

| Field | Type | Notes |
|-------|------|-------|
| id | number | shown in ID column |
| studentNo | string | display reference, e.g. `STU-2026-1902` |
| name | string | student name (bold) |
| email / emailDate | string | contact email + short date |
| phone / phoneNote | string | mobile + relation/label |
| branch | string | branch badge |
| status / statusColor | string | status badge label + hex |
| assignedTo | string \| null | null → "Unassigned" |
| created | string | created date |
| countryOfResidence | string | drives the "Country Of Residence" filter |
| countryInterested | string | study destination (multi-select filter) |
| studyLevel / course / intake | string | shown in the "Study Interest" column |
| university | string \| null | null → no university row yet |
| applications | number | count badge in the "Apps" column |
| source | string | how the student arrived |

- Records: **15** (one filtered page; `totalStudentCount = 1876` is the full count).
- **Maps to (future):** `students` joined to a student status lookup, `users`
  (assignedTo), `branches`, `student_preferences` (country/level/course/intake),
  and a `COUNT(*)` over `applications`.

### Filter option lists
`studentStatuses` (8, label+color) · `residenceCountries` (5) ·
`universities` (6) · `studentSources` (6) · `studentBulkActions` (5).
Re-exported from `leads.ts` so both pages share one lookup: `allCountries`,
`studentBranches`, `studentStaff`, `intakes`, `studyLevels`.

Filtering matches the Leads pattern: a **Filter** button in the header row
(count badge when active) opens a portal'd **"Filter Students" modal** covering
the header — basic row (Student Status / Assigned To Staff / Country Of
Residence / Branch) plus advanced (Country Interested In / Study Level / Intake
/ University / Source / Created Date) with Clear / Apply Filter. Filtering is
live; Apply closes the modal.

Working now (frontend): search, all filters above, page size, pagination, row
selection + select-all, sticky header, loading preloader, export cluster,
**Student - Assign Staff** dialog (reuses `leads/components/AssignStaffDialog`,
which now takes any `{ id, name }` record plus optional title/label).
Status-edit / view / settings / applications actions are UI-only placeholders.

### Shared table components
Extracted while building this page so both data tables stay in sync:
- `src/components/ExportButtons.tsx` — Copy/Excel/CSV/PDF/Print cluster; the
  caller passes header + rows and gets a toast message back.
- `src/components/DataTableUI.tsx` — `DotsLoader`, `Field`, `PageBtn`,
  `SingleSelect`.

---

## Applications

- **Mock file:** `src/mock/applications.ts`
- **Used by:** `src/features/applications/ApplicationsPage.tsx`
  (+ `components/ApplicationRow.tsx`)

### `applications: Application[]`
Rows for the "University Applications" data table.

| Field | Type | Notes |
|-------|------|-------|
| id | number | 6-digit application id |
| dateCreated | string | e.g. `27-04-2026` |
| student / studentNo | string | applicant name + `STU-…` reference |
| country | string | study destination (Study Country filter) |
| university / course / intake | string | Details column; intake uses the shared "May 2026" format so the Intake filter matches |
| agent | string \| null | counsellor shown with the 👤 icon (null = none) |
| appliedThrough | string | channel, bold in Details (`applicationChannels`) |
| status / statusColor | string | badge label + hex |
| assignedTo | string \| null | null → "Unassigned" |
| branch | string | drives the Branch filter |

- Records: **14** (one filtered page; `totalApplicationCount = 193`).
- **Maps to (future):** `applications` joined to `application_statuses`,
  `students`, `universities`, `courses`, `intakes`, `users` (assignedTo),
  `branches`; `applied_through` inline.

### Filter option lists
`applicationStatuses` (6, label+color: Pending / Funds Under Assessment /
Admission Criteria Met / Payment Received / Offer Letter Received / Withdrawn) ·
`applicationChannels` (4: DIRECT, Applyboard, Adventus, INTO Global) ·
`applicationBulkActions` (4). Re-exported shared lookups: `allCountries`,
`applicationBranches`, `applicationStaff`, `intakes`.

Filtering matches the Leads/Students pattern: a **Filter** button in the header
row (count badge when active) opens a portal'd **"Filter Applications" modal**
covering the header — Study Country (multi) / Intake / Applications Status
(multi) / Created Date / Assigned To / Branch / Applied Through Agent, with
Clear / Apply Filter. Filtering is live; Apply closes the modal.
Table columns: ID · Date Created · Student · Country · Details (University,
Course, Intake, agent 👤, Applied Through) · Status · Assigned To · Actions
(assign icon + labelled **View** button).

Working now (frontend): search, all filters above, page size, pagination,
selection, sticky header, preloader, export cluster, **Application - Assign
Staff** dialog (shared `AssignStaffDialog`). View / status-edit / Created Date
are UI-only placeholders.

---

<!--
FUTURE PAGES — append a new "## <Page>" section here using the Dashboard block
above as the template. Then flip its row in the Index table to ✅ done.
-->
