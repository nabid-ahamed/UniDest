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
| [Course Finder](#course-finder-course-finder) | `src/mock/courseFinder.ts` | ✅ done |
| [University Invoices](#university-invoices-invoicesuniversity) | `src/mock/invoices.ts` | ✅ done |
| [Student Invoices](#student-invoices-invoicesstudent--new--idedit) | `src/mock/studentInvoices.ts` | ✅ done |
| [Analytics](#analytics-analytics) | `src/mock/analytics.ts` | ✅ done |
| [Referral Signups](#referral-signups-referralsignups) | `src/mock/referrals.ts` | ✅ done |
| [Referral Payout](#referral-payout-referralpayout) | `src/mock/referrals.ts` | ✅ done |
| [Additional Services](#additional-services-services--servicesid) | `src/mock/services.ts` | ✅ done |
| [Broadcast](#broadcast-broadcast--broadcasthistory) | `src/mock/broadcast.ts` | ✅ done |
| [Automation](#automation-automation) | `src/mock/automation.ts` | ✅ done |
| [Webinar & Events](#webinar--events) | `src/mock/webinars.ts` | ✅ done |
| [Staff](#staff-staff) | `src/mock/staff.ts` | ✅ done |
| [Course Management](#course-management-courses--course-categories--universities) | `src/mock/courseManagement.ts` | ✅ done |
| [Student Resources](#student-resources-student-resources--categories) | `src/mock/studentResources.ts` | ✅ done |
| [Media Library](#media-library-media-library) | `src/mock/mediaLibrary.ts` | ✅ done |
| [Announcements](#announcements-announcements--newidedit) | `src/mock/announcements.ts` | ✅ done |
| [User Management](#user-management-user-management--newidedit) | `src/mock/userManagement.ts` | ✅ done |
| [CMS](#cms-cms) | `src/mock/cms.ts` | ✅ done |
| [Message Templates](#message-templates-message-templates) | `src/mock/messageTemplates.ts` | ✅ done |
| [Import](#import-import) | `src/mock/importData.ts` | ✅ done |
| [Backups](#backups-backups) | `src/mock/backups.ts` | ✅ done |
| [Roles](#roles-roles) | `src/mock/roles.ts` | ✅ done |
| [Settings](#settings-settings) | `src/mock/settings.ts` | ✅ done |

---

## Dashboard

- **Mock file:** `src/mock/dashboard.ts`
- **Used by:** `src/features/dashboard/DashboardPage.tsx` (+ components under
  `src/features/dashboard/components/`)

### `dashboardStats: StatCardData[]`
Top KPI cards (5): Leads, Students, Applications, Support Tickets, Staff. Each
renders as a gradient-tint card with a left accent strip, gradient icon tile
(white icon + coloured glow), big accent number, uppercase sub-label and a faint
corner blob + a hover effect (card lifts, and an ash overlay wipes across
left→right) (`StatCard.tsx`). Grid: 2-up (sm) →
4-up (lg), so the 5th (Staff) wraps onto a second row. The Staff card's value is
the live `staff.length` from the Staff module.

| Field | Type | Notes |
|-------|------|-------|
| key | `'leads' \| 'students' \| 'applications' \| 'support' \| 'staff'` | drives icon |
| label | string | card title |
| sublabel | string | uppercase label shown under the number, e.g. "Open Leads" |
| value | number | the KPI number |
| color | `'blue' \| 'emerald' \| 'orange' \| 'purple' \| 'rose'` | accent (strip + icon + number) |

- Records: **5** (Leads 27, Students 1876, Applications 214, Support Tickets 96,
  Staff = live `staff.length`).
- **Maps to (future):** aggregate counts over `leads`, `students`, `applications`,
  `staff` tables + a future `support_tickets` table (not in current schema).

### `monthlyTrend: TrendPoint[]` + `applicationsDaily: DailyPoint[]`
Charts row (`ChartsRow`): a wide **smooth area chart** ("Students & Leads",
`TrendAreaCard`) beside the **Applications** bar chart (`ChartCard`).

- `TrendPoint` = `{ month, students, leads }` — **12** months (Aug→Jul).
  `TrendAreaCard` renders two `type="monotone"` recharts `<Area>`s with
  top-down gradient fills (Students `#14b8a6`, Leads `#f59e0b`) and a floating
  tooltip card (month title + coloured value rows) styled like the reference.
  Interactive: a **Timeframe** dropdown (Last 3 / 6 / 12 Months) slices the data,
  and the **Students / Leads** legend chips are clickable toggles — clicking
  crosses a series out and hides its area (kept to ≥ 1 visible; the Y-axis
  auto-rescales).
- `DailyPoint` = `{ date, count }` — `applicationsDaily` **7** (last 7 days),
  purple bars. (`studentsDaily` / `leadsDaily` are retained in the mock but the
  dashboard now shows the combined monthly trend instead of the old daily bars.)
- **Maps to (future):** `COUNT(*) ... GROUP BY month` over `students` / `leads`
  and `GROUP BY day` over `applications` (`created_at`).

### Statistics Overview donut (`OverviewDonut`)
Full-width section between the charts row and Follow-ups. A recharts donut
(`PieChart` + `Pie` innerRadius 72 / outerRadius 104) of the same five
`dashboardStats` values (one `<Cell>` per accent colour), a centred **Total**
(sum = 2,220), a hover tooltip, and a legend list (colour dot · label · value ·
percentage). Driven entirely by `dashboardStats`, so it stays in sync with the
KPI cards.

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

### Lead detail page (`/leads/:id`)
- **Component:** `src/features/leads/LeadViewPage.tsx` (View action / name
  click on a row navigates here; breadcrumb "Dashboard / Lead Management /
  View").
- Layout per the reference: identity header (initials avatar, email/phone with
  QR + chat icons, country, status badge, assignee top-right). The **QR icon
  opens a "Contact QR Code" modal** — a real QR (`qrcode.react`) encoding
  `tel:<phone>`, so scanning it dials the lead.
- **Course Suggestion tab** (`components/LeadCourseSuggestionTab.tsx`) per the
  reference: "Share course suggestions to student" (Title* + file input
  restricted to xls/xlsx/csv/doc/docx/pdf with inline errors; Upload prepends a
  row and persists per lead in localStorage `unidest-lead-suggestions`) ·
  "Previous Course Suggestions" table (Date/File/Accepted?, "Record Not Found!"
  when empty) · "Course Finder Suggestions/ Student Bookmarked" ("Open Course
  Finder" toast link; empty table "No suggestions yet!").
- **Course Preferences tab** (`components/LeadCoursePreferencesTab.tsx`) per the
  reference: heading + "Student Study Level: <lead.studyLevel>" · blue "Add New
  Program" bar · collapsible **"Search a Course and Select Program"** (open by
  default) with Search Course / Search by Course ID radios — Search Course is a
  cascading Country* → University* → Course* picker (small in-file `COURSE_DB`
  demo catalogue) + Intake* + Priority*; Search by Course ID looks the ID up in
  the same catalogue ("No course found with ID …" on miss) · collapsible
  **"Manually Add a Program"** (closed by default; free-text Country*/
  University*/Course* + Intake* + Priority*) · blue **"Selected Programs"** bar
  with pink "No programs found!" alert, or a table
  (Priority/Course/University/Country/Intake/Course ID/delete Action) —
  duplicate program adds are rejected with a toast; the list persists per lead
  in localStorage `unidest-lead-programs`.
- **Profile tab** (`components/LeadProfileTab.tsx`) mirrors the reference:
  "Student Profile Incomplete" banner · blue "Student Profile" bar ·
  **Download Profile** (generates a real per-section PDF via jsPDF/autoTable) +
  **Edit Profile** (`EditLeadProfilePage.tsx`, route `/leads/:id/edit`,
  breadcrumb "… / Edit Profile" — a full page headed by the shared
  `components/LeadIdentityHeader.tsx` (same avatar/contact/QR header as the
  detail page; the QR dialog lives inside it), then the form:
  name/gender/email/mobile/study level/country interested/qualification/
  residence/source with required-field errors; Save runs `updateLead()` →
  `SuccessDialog` → back to the detail page. The Actions-panel "Edit Lead
  Details" navigates here too) ·
  filled sections (Basic Information, Additional
  Information, Current/Permanent Address, Passport, Nationality + Background
  questions defaulting "No", Emergency Contacts — known lead fields filled,
  rest "--") · ten "No Data Available" sections (Academic → Family Details,
  Tests shows an "English" sub-link) · Created/Updated footer · tab bar
  (all four tabs — Overview / Profile / Course Suggestion / Course
  Preferences — are built) · Basic Details grid (3 groups with dividers; missing fields
  show "-") · Invoices + Support Tickets empty tables with Create buttons ·
  User Activity Log · Created/Updated footer.
- Right rail: **Actions** panel (Reset Password → Convert To Student are toast
  placeholders; Delete opens `ConfirmDialog`) and **Confidential Notes** —
  notes persist per lead in localStorage (`unidest-lead-notes`), newest first,
  "No Notes Found!" when empty.
- New optional `Lead` fields for this page: `gender`, `studyLevel`,
  `qualification`, `source`, `countryOfResidence` (seeded on ids 2379, 2370).

The Settings row action is still a UI-only placeholder.

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
- Submit **saves via `addLead()`**: named form fields are read with `FormData`,
  a `Lead` is built (next id, status "New Lead", `created`/`emailDate` stamped,
  first Country-Interested chip, gender/studyLevel/qualification/residence
  captured) and prepended, then the toast redirects to `/leads` where the new
  row shows on top. **Leads persist like webinars** — localStorage working copy
  (key `unidest-leads`) loaded in `src/mock/leads.ts`; clearing the key resets
  to the seed. **Maps to (future):** `POST /leads` creating a `leads` row +
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
which now takes any `{ id, name }` record plus optional title/label), and the
**View action / name click → `/students/:id`** detail page (below).
Status-edit (list row) / settings / delete actions are UI-only placeholders.

Row actions match the reference: the **Assigned to** cell shows the name (or
red "Unassigned") plus a blue `UserRoundPen` icon that opens the assign
dialog; the **Actions** cell has just two controls — a blue-bordered **View**
eye and a rose-bordered **3-dot dropdown** (⋮ + red caret) with Assign Staff /
Edit Status / Settings / Delete.

### Student View page (`/students/:id`)
- **Component:** `src/features/students/StudentViewPage.tsx`; breadcrumb
  "Dashboard / Student Management / View".
- A `studentAsLead()` adapter maps the Student to the Lead shape so it reuses
  the lead detail building blocks as-is: `LeadIdentityHeader` (avatar, contact
  row, working QR dialog, chat icon → Chat tab), `LeadProfileTab`,
  `LeadCourseSuggestionTab`, `LeadCoursePreferencesTab`.
- **8 tabs** per the reference: Overview / Profile / Course Suggestion /
  Course Preferences / Documents / Applications / Services / Chat (last four
  are placeholders).
- **Overview:** status row — badge + pencil opens a "Change Status to"
  dropdown of the 8 student statuses; a change updates the badge, prepends a
  "STUDENT STATUS CHANGED TO: X, Previous Status: Y" activity entry and
  persists per student in localStorage `unidest-student-status` — plus
  "Next Follow-up: --" and a "New Follow-up Record" button (toast). Then Basic
  Details (3 divided groups incl. Course Interested to Study + Intake from the
  student record), Invoices + Support Tickets empty tables, multi-entry User
  Activity Log (LEAD CONVERTED / LEAD CREATED & ASSIGNED TO), Created/Updated
  footer.
- Right rail: **Actions** panel (View Support Tickets, Reset Password, Login as
  User, Send email/sms/Whatsapp, Edit Basic Info, Edit Profile, Student
  Agreement, Link to Agent, Country Info Permissions, Convert Back To Lead —
  all toasts; Delete opens `ConfirmDialog`) and **Confidential Notes**
  (persisted under `unidest-student-notes`).
- The lead detail helpers (`Detail`, `DetailGrid`, `RecordsSection`,
  `ConfidentialNotes` with a `storageKey` prop) were extracted to
  `src/components/DetailSections.tsx` and are shared by both view pages.

### Shared table components
Extracted while building this page so both data tables stay in sync:
- `src/components/ExportButtons.tsx` — Copy/Excel/CSV/PDF/Print cluster; the
  caller passes header + rows and gets a toast message back.
- `src/components/DataTableUI.tsx` — `DotsLoader`, `Field`, `PageBtn`,
  `SingleSelect`.

---

## Course Finder (`/course-finder`)

- **Mock file:** `src/mock/courseFinder.ts` (`FinderCourse`, 22 courses;
  `totalFinderCourseCount = 1190`); **page:**
  `src/features/courseFinder/CourseFinderPage.tsx`. Modeled 1:1 on
  demo.eductrl.com/cn4/admin/course-finder (inspected live via browser-use).
- **Top card** "University Course Finder": Study Level select (11 levels,
  default Undergraduate) · Country `MultiSelect` (derived from course data) ·
  keyword input (course/university, Enter submits) · **Search** (applies the
  three top fields with a loading pass) / **Clear** (resets everything).
- **Filter sidebar** (live): Select Student (optgrouped Students + Leads —
  prefills the modals) · Study Area → dependent Discipline Area · Intake month
  `MultiSelect` · Duration buckets (Any/0-1/…/4+) · Sort (IELTS low/high,
  Course Name, Fee low/high) · score accordions IELTS / TOEFL / PTE / GRE-GMAT
  (each "score" + "no band less than"; courses requiring **at most** the
  entered score match; blank = no filter).
- **Results:** Show 25/50/100/200 + `ExportButtons` · **Select All** bar
  (amber "Suggest Selected (N)" appears when N > 0) · course cards: gradient
  initials logo + city/country left; title, Id/University/Country, Study
  Level/Duration/Intakes, Tuition/Application fees, **Commission → "Show"**
  (modal "Your Commission") · card footer: Select checkbox + amber **Suggest
  to Student** + blue **Add to Student Course Preference** · "Showing X to Y
  of Z entries" + pagination.
- **Modals:** Suggest Course to Student (student* + Intake Month/Year) ·
  Suggest Selected Courses to Student (student* only) · Add to Student Course
  Preference (student* + intake* + priority). Student options span both
  `students` and `leads` mocks (ids don't collide).
- **Persistence / integration:** suggestions append to localStorage
  `unidest-cf-suggestions[personId]` and show up in the **Course Suggestion
  tab** ("Course Finder Suggestions/ Student Bookmarked" table — Date /
  Course·University·Intake / Accepted? / Remove) on both the lead and student
  view pages; that tab's "Open Course Finder" link now navigates to
  `/course-finder`. Preferences append to `unidest-lead-programs[personId]`
  (same shape as the Course Preferences tab, so they appear in its Selected
  Programs table).
- Wired: route in `router.tsx`, sidebar item link, breadcrumb title.

---

## University Invoices (`/invoices/university`)

- **Mock file:** `src/mock/invoices.ts` (`UniversityInvoice`, 5 seeded rows
  persisted under localStorage `unidest-uni-invoices`); **page:**
  `src/features/invoices/UniversityInvoicesPage.tsx`. Modeled on
  demo.eductrl.com/cn4/admin/university-invoices (+ /applications), browser-use
  reference. **Connected to the Applications module:** every invoice carries an
  `applicationId` and reuses that application's student / university / country /
  agent / channel; `invoiceableStatuses` = Offer Letter Received + Payment
  Received drives which applications can be invoiced.
- **Tab 1 – Invoices:** filter bar (Search by invoice-no/university,
  University `SingleSelect`, Status All/Due/Paid, Clear) · Show 25/50/100 +
  table search + `ExportButtons` · table Date / Invoice # (opens View modal) /
  Invoice To (university+country, "(Master Agent)", payment label, Appl ID,
  University, Student, Agent, Next Payment) / Amount (currency + value) /
  Status (Paid green, Due red) / **Actions** (View, Record Payment [Due only],
  Download PDF via jsPDF/autoTable, Send Email toast, Delete → `ConfirmDialog`)
  + "Agent Invoice Requested" green badge on agent invoices.
- **Tab 2 – University Applications:** lists applications with an
  invoiceable status; filters Intake / University / Applied Through +
  "Applications with no invoices" checkbox · table checkbox-less ID / Date /
  Student / Country / Details (university, course, intake, applied-through,
  "Invoices Created: N") / Status (reuses `applicationStatuses` colour badge) /
  **Create Invoice** → modal (payment label, currency, amount, next payment,
  "apply through agent" toggle) → `addInvoice()`, jumps to the Invoices tab.
- **Modals:** View (detail grid + payment-history table + Download PDF),
  Record Payment (amount/date/note → marks Paid, appends a payment, persists),
  Create Invoice (from an application). All reuse the shared `Field`,
  `SingleSelect`, `PageBtn`, `ExportButtons`, `ConfirmDialog`, `pickTextColor`.
- Sidebar **Invoices ▸ University Invoices** now links here; the flyout/submenu
  in the collapsed rail navigates too.

## Student Invoices (`/invoices/student` + `/new` + `/:id/edit`)

- **Mock file:** `src/mock/studentInvoices.ts` (`Business` ×2 with currency +
  `StudentInvoice` ×6 seeded, persisted under localStorage
  `unidest-student-invoices`); **pages:**
  `src/features/invoices/StudentInvoicesPage.tsx` (list + modals) and
  `StudentInvoiceFormPage.tsx` (one form reused for create + edit). Modeled on
  demo.eductrl.com/cn4/admin/student-invoices (+ /student-invoice-generate),
  browser-use reference. **Connected to the Students module:** each invoice is
  billed to a student (studentNo) and reuses its name / email / phone; the form
  "Select Student" reads straight from the `students` mock.
- **Totals are always derived** (`invoiceSubTotal` / `invoiceGrandTotal` /
  `invoicePaid` / `invoiceDue` / `invoiceStatus`) so list, view, form and PDF
  never disagree. Status = Paid when due ≤ 0, else Due (list shows the
  remaining amount under the Due badge).
- **List:** "Create" button (→ /new) · filter bar (Search by invoice-no /
  student, Status All/Due/Paid, Clear) · Show 25/50/100 + table search +
  `ExportButtons` · table Invoice # / Date / Student / Amount / Status (badge +
  due amount) / **Actions** (View, Record Payment [Due only], Email toast,
  Download PDF, Edit → /:id/edit, Delete → `ConfirmDialog`).
- **Form** (breadcrumb New Invoice / Edit Invoice + back button): Select
  Business (fills the right-hand Options card + currency) · Select Student
  (fills the Bill To card) · Due Date · line-items table (Sl.No / Item &
  Description / Amount) with **Add More** + per-row remove · Terms &
  Conditions · live **Sub Total / Discount (-) / Grand Total** · "Email invoice
  to client" checkbox · Create / Save Changes / Cancel. Saving
  `addStudentInvoice` / `updateStudentInvoice` then returns to the list.
- **Modals:** View (Bill To + business header + line-item table + totals +
  Download PDF) and Record Payment (amount/date/note → appends a payment,
  recomputes status). PDF via shared jsPDF/autoTable.

## Analytics (`/analytics`)

- **Compute layer:** `src/mock/analytics.ts`; **page:**
  `src/features/analytics/AnalyticsPage.tsx`. Modeled on
  demo.eductrl.com/cn4/admin/analytics, browser-use reference. **No separate
  dataset — every report is computed live from the existing module mocks**
  (leads, students, applications, invoices, studentInvoices, referrals) so the
  numbers always match those pages.
- **View form:** report-type select (Leads / Students / Applications / Student
  Referral / University Invoices / Sales), Date Range (From–To), Branch → Show
  Report / Clear. Show Report without a type toasts a prompt.
- **Report output** (`ReportView`, one reusable renderer): 4 summary tiles, a
  recharts colored bar chart (reuses each module's status colours), and a
  breakdown table with `ExportButtons`. Filters applied: branch (records with a
  `branch` field) + date range (tolerant parser handles the mocks' mixed
  "dd-mm-yyyy" / "dd Mon yyyy" formats). Empty results show a "No data" card.
- Report specifics: Leads → by status + by country interested; Students → by
  status + by residence country; Applications → by status + by channel;
  Student Referral → by referrer (+ total reward in BDT `৳`); University
  Invoices → Paid vs Due + amount by currency; Sales → Paid vs Due + collected/
  outstanding from student invoices.
- Sidebar **Analytics** links here.

## Referral Signups (`/referral/signups`)

- **Mock file:** `src/mock/referrals.ts` (`ReferralSignup` ×9 seeded, persisted
  under localStorage `unidest-referral-signups`); **page:**
  `src/features/referral/ReferralSignupsPage.tsx`. Modeled on
  demo.eductrl.com/cn4/admin/referral-signups, browser-use reference.
  **Connected to the Students module:** a signup = a student who joined through
  another student's referral link, so both the Name and Refered By columns are
  real `students` records; both names link to `/students/:id`.
- **List** (heading "Student Referral Signups", breadcrumb same): Show
  10/25/50/100 + search + `ExportButtons` · table SI No. / Date / Name (student
  link + ID) / Refered By (referrer link + ID, or just ID when the name is
  unknown) / Commission (`৳ n` BDT or "--") / **Action** = "Set/Update
  Commission" · Showing/pagination footer.
- **Set/Update Referral Amount modal:** single Amount* field → Submit sets the
  commission via `setReferralCommission`, persists, toasts, and the row's
  Commission cell updates from "--" to the amount.
- Sidebar **Referral ▸ Referral Signups** links here.

## Referral Payout (`/referral/payout`)

- **Page:** `src/features/referral/ReferralPayoutPage.tsx`; data helpers added to
  `src/mock/referrals.ts` (`payPreferences` per referrer, `payoutMonths()`,
  `computePayouts(monthKey)`). Modeled on
  demo.eductrl.com/cn4/admin/referral-payout, browser-use reference.
  **Aggregates the Referral Signups data:** picks a month, groups that month's
  signups by referrer, counts referrals and sums their commissions into a
  payout — no separate dataset, so it always stays in sync with the signups.
- **Flow:** "Select Month" dropdown (only months that actually have signups,
  newest first) + **Continue** → payout table. Continue without a month toasts
  "Please select a month".
- **Table:** Referer (referrer student link + ID) / Pay Pref. Mode (bKash /
  Bank Transfer / Nagad / Rocket / Cash badge) / Pay Pref. Details / No. of
  Referrals / Reward (BDT `৳`). A summary strip shows the month, total
  referrals and total reward, plus `ExportButtons`. Referer links to
  `/students/:id`.
- Sidebar **Referral ▸ Referral Payout** links here; both referral submenu
  items are now built.

---

## Additional Services (`/services` + `/services/:id`)

- **Mock file:** `src/mock/services.ts` (`ServiceRequest`, 12 seeded rows;
  whole list persisted under localStorage `unidest-services` via
  `updateService`/`deleteService`); **pages:**
  `src/features/services/AdditionalServicesPage.tsx` and
  `ServiceViewPage.tsx`. Modeled on
  demo.eductrl.com/cn4/admin/service-and-visa/list (+ /view/:id).
- **List page:** header filter icon → "Filter Services" modal (Select Service
  (7 types) / Select Status (New File, Processing, Decision - Completed,
  Decision - Rejected) / Country / Assigned To (+Unassigned) / Created Date) ·
  Show 10/25/50/100 + search + `ExportButtons` · table ID / Date Created /
  Status (coloured badge, blank allowed) / Student (person icon, bold) /
  Service / Country (globe icon) / Description (truncated "…..") / Assigned to
  / **Actions** (blue assign icon → shared `AssignStaffDialog` "Service -
  Assign Staff"; blue **View** → detail; red **Delete** → `ConfirmDialog`,
  actually removes + persists) · Showing/pagination footer.
- **View page** (breadcrumb Dashboard / Additional Services / Visa & Services
  Detail): "Service Request #id" + back button · tabs Application / Profile /
  Documents / Reminders (0) / Chat (Application built, rest placeholders) ·
  Application tab: service + country + description + student contact +
  Current Status; **Notes** textarea + Save (persists) · **Send Message to
  Student/Agent** (textarea + staff-to-notify select + attach file + Send →
  prepends to **Message History**, persists) · **Update Service Status**
  (Change Status to → Update → status + **Service Activity** entry
  "STATUS CHANGED TO: X, Previous Status: Y", persists, reflected in the list
  badge) · Message History / Service Activity lists with demo empty states.

---

## Broadcast (`/broadcast` + `/broadcast/history`)

- **Mock file:** `src/mock/broadcast.ts`; **pages:**
  `src/features/broadcast/BroadcastPage.tsx` and `BroadcastHistoryPage.tsx`.
  Modeled on demo.eductrl.com/cn4/admin/broadcast (+ broadcast-history).
- **Broadcast page:** "Broadcast History" button top-right · Target Group
  select (Leads / Students / Agents\/Partners / Staff Members) · conditional
  filters — Leads → Country Interested (+-ANY-) + Lead Status `MultiSelect`;
  Students → Student Status `MultiSelect` + "Exclude agent students" checkbox
  (drops `source === 'Agent'`) · live "Matching recipients: N" counter
  (`resolveRecipients()` over the leads/students mocks; Agents/Partners and
  Staff use small email lists) · **Email | SMS** radios — Email shows template
  select (6 templates fill subject + body) + Subject + execCommand rich-text
  editor; SMS shows template select (5) + textarea with a 160-char counter
  (over-limit shows SMS parts) · **Continue** validates
  (target/type/subject/message) then opens a **Confirm Broadcast** modal
  (type, target + filters, subject, recipient count + scrollable email list) ·
  Send appends to localStorage `unidest-broadcasts`, toasts and resets the
  form.
- **History page** (breadcrumb Dashboard / Broadcast / Broadcast History):
  "Back to Broadcast page" button · Show 25/50/100 + search + `ExportButtons`
  · table Date & Time / Type (email-blue, sms-amber badge) / Subject / Message
  (line-clamped) / Sent To / Staff · seeded with 3 records (`seedHistory`),
  new sends appear on top · "Showing X to Y of Z" + pagination.

---

## Automation (`/automation`)

- **Mock file:** `src/mock/automation.ts`; **pages:**
  `src/features/automation/AutomationPage.tsx` (list, both tabs),
  `WorkflowFormPage.tsx`, `WorkflowDetailPage.tsx`, `CampaignFormPage.tsx`,
  `CampaignDetailPage.tsx`. Modeled on demo.eductrl.com/cn4/admin/automation
  (+ /campaigns, /create/workflow, /create/campaign, /workflow/:id/details).
- **Two tabs** rendered by one page, routed by URL: `Workflows` (`/automation`)
  and `Campaigns` (`/automation/campaigns`). Breadcrumb reads "Automation -
  Workflows" / "Automation - Campaigns". Sidebar "Automation" (Zap) → `/automation`.
- **Audience matching is live.** `AudienceCriteria { target: 'Leads' |
  'Students', status?, country? }` is resolved by `resolveAudience()` over the
  real `leads` / `students` mocks; `matchedUsers()` returns the count.
  `statusOptionsFor(target)` returns `leadStatuses` / `studentStatuses` labels;
  country uses `allCountries` matched against `countryInterested`. So the
  "Matched Users" / "Matched Audience" figures always agree with those pages.

### `workflows: Workflow[]`
Rows for the Workflows table.

| Field | Type | Notes |
|-------|------|-------|
| id | number | |
| title | string | bold link → `/automation/workflow/:id` |
| type | `WorkflowType` | Lead nurture sequence / Specific event / Message sequence |
| mode | `WorkflowMode` | Email / SMS / Whatsapp (coloured pill) |
| at | string | send time, e.g. `04:45 PM` |
| created | string | e.g. `08 Sep 2025 16:41` |
| status | `'Active' \| 'Inactive'` | green / rose badge |
| audience | `AudienceCriteria` | drives Matched Users on the detail page |
| steps | `WorkflowStep[]` | `{ schedule, message }`; count shown in "No. of Messages" |
| history | `ExecutionRecord[]` | `{ date, sequenceIndex, messageSent, message }` |

- Records: **8** seeded (`seedWorkflows`, ids 1–8), persisted to localStorage
  `unidest-workflows`. Table columns: Title / Mode / Type / No. of Messages
  (`messageCount`) / Status / Actions. Actions = sky **eye** (→ detail) + slate
  **3-dot** dropdown (Activate/Deactivate via `toggleWorkflowStatus`, Delete via
  `deleteWorkflow` + `ConfirmDialog`). Toolbar: Show 50/100/200 + search.
- **New Workflow** (`/automation/create/workflow`): Title\* · Workflow Type\* ·
  Send (mode) + At (HH:00 + AM/PM) · Target Audience block (Target / Status /
  Country) with live "Matched Users: N" · repeatable Messages\* rows
  (schedule + content, Add/remove) · Create → `addWorkflow` (status Active),
  redirects to the new detail page.
- **Workflow Detail** (`/automation/workflow/:id`): header (Type / Mode pill /
  At / status / Created) · Target Audience with "Matched Users: N"
  (`matchedUsers`, incl. "Other Criteria → Country Interested") · Messages list
  (`On:` / `After N Day(s)` + Send Message) · Execution History table.

### `campaigns: Campaign[]`
Rows for the Campaigns table.

| Field | Type | Notes |
|-------|------|-------|
| id | number | |
| title | string | bold link → `/automation/campaign/:id`, audience summary beneath |
| status | `CampaignStatus` | Queued / Sent / Draft / Failed (coloured badge) |
| scheduledAt | string | e.g. `16-05-2026 07:52 PM` |
| mode | `'Email' \| 'SMS'` | coloured pill |
| sentTo | number | recipients count |
| audience | `AudienceCriteria` | same resolver as workflows |
| message | string | body (with `#first_name#`-style variables) |

- Records: **5** seeded (`seedCampaigns`), persisted to localStorage
  `unidest-campaigns`. Header: **Status** filter select (`campaignStatuses`) +
  Filter / Clear + **New Campaign**. Table columns: Title / Status /
  Scheduled/Sent At / Mode / Sent To / Actions (eye + 3-dot Delete). Toolbar:
  Show + search.
- **New Campaign** (`/automation/create/campaign`): Title\* · Target Audience\* /
  Status / Country · **Matched Audience** with **Calculate** (reveals
  `matchedUsers`) · Email/SMS radios (Email = execCommand RTE, SMS = textarea +
  160-char counter) · variables note (`messageVariables`) · Test campaign
  message (Send To + toast) · **Run at** datetime **OR Send Now** · Create →
  `addCampaign` (Queued if scheduled, Sent + `sentTo = matched` if Send Now),
  redirects to the Campaigns tab.
- **Campaign Detail** (`/automation/campaign/:id`): title + status, Mode /
  Scheduled-Sent At / Sent To, Target Audience with Matched Audience, message body.

---

## Staff (`/staff`)

- **Mock file:** `src/mock/staff.ts`; **pages:**
  `src/features/staff/StaffPage.tsx` (list), `StaffFormPage.tsx` (add/edit),
  `StaffViewPage.tsx` (detail). Sidebar "Staff" (User icon) → `/staff` (the old
  All Staff / Add Staff submenu was removed).
- **Workload is computed live, not stored.** Staff are the people assigned across
  the CRM, so `workload(name)` counts `leads` / `students` / `applications`
  where `assignedTo === name`. The first four seed records intentionally match
  `leadStaff` (Sarah Ali / Mohammed Saleh / Moses Otieno / Admin Two Test), so
  their counts are non-zero and always agree with those pages (a DEV-only warning
  fires if a `leadStaff` name has no seed record).

### `staff: StaffMember[]`

| Field | Type | Notes |
|-------|------|-------|
| id | number | |
| name | string | bold link → `/staff/:id`; avatar uses `initials()` + `avatarColor()` (WCAG via `pickTextColor`) |
| email / phone | string | Contact column (mailto + tel-style) |
| role | `StaffRole` | Super Admin / Branch Manager / Counsellor / Admission Officer / Front Desk / Accountant (slate pill) |
| branch | string | `staffBranches` (leadBranches minus "All Branch") |
| status | `'Active' \| 'Inactive'` | emerald / rose badge |
| joined | string | e.g. `12 Jan 2025` |

- Records: **7** seeded, persisted to localStorage `unidest-staff`
  (`addStaff` / `updateStaff` / `toggleStaffStatus` / `deleteStaff`).
- **List:** Role / Branch / Status filter row + Clear · Show 10/25/50/100 +
  search + `ExportButtons` · table Name (avatar) / Contact / Role / Branch /
  **Assigned** (live Leads·Students·Apps pills) / Status / Actions (sky **eye**
  → detail + slate **3-dot** portal dropdown: Edit / Activate-Deactivate /
  Delete via `ConfirmDialog`) · "Showing X to Y of Z" + pagination.
- **Add/Edit** (`/staff/new`, `/staff/:id/edit`): Full Name\* · Email\* (regex) ·
  Phone · Role\* · Branch\* · Status radios · Password (add only, optional min-6)
  · Create/Save → `addStaff` / `updateStaff`, redirects to the detail page.
- **Detail** (`/staff/:id`): identity header (avatar, name, status, role·branch,
  email / phone / joined) + Edit / Back · three workload cards (`workload`) ·
  three linked tables — Assigned Leads / Students / Applications
  (`assignedLeads` / `assignedStudents` / `assignedApplications`), names link
  through to those records.

---

## Course Management (Courses / Course Categories / Universities)

- **Mock file:** `src/mock/courseManagement.ts`; **pages** under
  `src/features/courseManagement/`: `CoursesPage` (list), `CourseFormPage`
  (add/edit), `CourseViewPage` (detail), `UniversitiesPage` / `UniversityFormPage`
  / `UniversityViewPage`, `CourseCategoriesPage` (tree + modal add/edit).
  Sidebar **Course Management** (System group) submenu → `/courses`,
  `/course-categories`, `/universities`. Modeled on EduCtrl
  `/admin/coursemanagement`, `/…/categories`, `/…/universities`.
- **One source of truth, three connected sub-modules.** The module reuses the
  Course Finder catalogue (`finderCourses`) as the course seed, then **derives**
  Universities (unique institutions, enriched via `UNI_META`) and Categories
  (top-level `studyAreas` + child `disciplineAreas`) from it — no duplicated data.
  A course points at one university + one study area; each university/category
  reports its **live** course count.
- Persisted to localStorage: `unidest-courses`, `unidest-universities`,
  `unidest-course-categories` (seed → load/save/add/update/delete, same pattern
  as Staff).

### `courses: ManagedCourse[]`

`ManagedCourse extends FinderCourse` + `status` (`Enabled`/`Disabled`),
`concentration`, `durationMonths`, `description`, `entryRequirements`,
`websiteUrl`. 22 seeded. CRUD: `addCourse` / `updateCourse` /
`toggleCourseStatus` / `deleteCourse`.

- **List** (`/courses`): "University Course Management" · filters University /
  Study Area / Study Level / Status + Clear · Show + search + `ExportButtons` ·
  table Course (gradient logo tile + discipline) / University / Country / Study
  Level / Study Area / Status / Actions (sky **eye** → detail + slate **3-dot**:
  Edit / Enable-Disable / Delete via `ConfirmDialog`) · compact windowed
  pagination (`pageWindow`, 1 … n … last).
- **Add/Edit** (`/courses/new`, `/courses/:id/edit`): grouped sections — Course
  Details (Title\* · University\* · Study Level\* · **Category → dependent Sub
  Category** · Concentration · Campus/City · Duration months · **Intake\*** via
  `MultiSelect` · Description · Entry Requirements) · Admission Requirements
  (IELTS / IELTS-no-band / TOEFL / PTE / GRE / GMAT) · Fees & Commission
  (Currency + Application/Tuition amounts composed into `"USD 32000"` strings) ·
  Additional (Website URL · Status radios). **Selecting a university auto-fills
  its country + city.**
- **Detail** (`/courses/:id`): gradient header (title, status, university link →
  `/universities/:id`) · facts grid (level / area / discipline / campus /
  duration / intakes) · Overview · Entry Requirements · Fees & Commission ·
  Test Scores chips.

### `universities: University[]`

`id · name · country · city · website · type` (`Public`/`Private`) `·
established · ranking · showToAgent · logoClass · status` (`Active`/`Inactive`).
14 derived from the catalogue. CRUD: `addUniversity` / `updateUniversity` /
`deleteUniversity`; lookups `universityByName`, `universityNames`,
`coursesForUniversity`.

- **List** (`/universities`): "Universities (Institutions)" · Country / Type /
  Status filters · table University (logo tile + city) / Country / Type /
  **Courses** (live count) / Show To Agent (Yes/No) / Status / Actions.
- **Add/Edit**: Name\* · Country\* · City · Type · Website · Established · Ranking ·
  **logo-colour swatch picker** · Show To Agent checkbox · Status radios.
- **Detail** (`/universities/:id`): header + facts + course-count card · linked
  table of that university's courses.

### `courseCategories: CourseCategory[]`

Flat tree node: `id · name · parentId` (null = top-level study area) `·
description · displayOrder · status`. Seeded from `studyAreas` (8 parents) +
`disciplineAreas` (children). Helpers `topCategories`, `childCategories`,
`coursesForCategory` / `categoryCourseCount`, `categoryNames`. CRUD:
`addCategory` / `updateCategory` / `deleteCategory` (deleting a parent removes
its children).

- **Page** (`/course-categories`): "Course Management — Categories" · table
  Category (parent bold, child indented with `CornerDownRight`) / **Courses**
  (live count — parent matches `studyArea`, child matches `disciplineArea`) /
  Status / Display Order / Edit·Delete · **Create** opens a `createPortal` modal
  (Name\* · Parent Study Area select · Display Order · Status · Description); a
  top-level area can't be reparented.

---

## Student Resources (`/student-resources` + `/categories`)

- **Mock file:** `src/mock/studentResources.ts`; **pages** under
  `src/features/studentResources/`: `StudentResourcesPage` (upload form + list),
  `ResourceCategoriesPage` (flat categories + modal add/edit). Sidebar **Student
  Resources** (System group, UploadCloud icon) → `/student-resources`. Modeled on
  EduCtrl `/admin/upload` + `/admin/show/category`.
- **Connected to existing modules:** each resource records `uploadedBy` (a
  `staff` name) and an optional `relatedCourseId` (a Course Management course,
  rendered as a link → `/courses/:id`); every category reports its **live**
  resource count.
- **Files aren't really stored** in a frontend build — an upload captures the
  chosen file's name/size/type and mints a mock storage URL via `mockFileUrl()`
  (Phase 2 swaps in real storage). Helpers: `allowedExtensions` (pdf/doc/docx/
  txt/jpg/jpeg/png/zip/mp4), `maxFileMb` (49), `fileTypeOf` → `pdf`/`doc`/
  `image`/`video`/`zip`/`other`, `formatFileSize`.

### `studentResources: StudentResource[]` + `resourceCategories: ResourceCategory[]`

`StudentResource`: `id · title · categoryId · fileName · fileType · fileSize ·
fileUrl · relatedCourseId · uploadedBy · uploadedAt`. `ResourceCategory`:
`id · name · description`. 9 + 7 seeded, persisted to `unidest-student-resources`
/ `unidest-resource-categories`. CRUD: `addResource` / `deleteResource`;
`addResourceCategory` / `updateResourceCategory` / `deleteResourceCategory`
(**deletion blocked while resources still use the category** — returns `false`).

- **Resources page** (`/student-resources`): header + Categories / Create
  Category buttons · **Add New Resource** card (Title\* · Category\* · Related
  Course optional · Document\* file input validating extension + 49 MB size ·
  Upload) · **All Student Resources** table (file-type icon + Title/filename/size
  · Category badge · Related Course link · Uploaded By + date · File URL +
  **Copy Link** · **Download** anchor + **Delete** via `ConfirmDialog`) · category
  filter + search + `ExportButtons`.
- **Categories page** (`/student-resources/categories`): "Student Resources
  Category" table (Category + description · live Resources count · Edit / Delete)
  · **Create Category** opens a `createPortal` modal (Name\* · Description); the
  main page's "Create Category" button deep-links here with `?create=1` to open
  the modal immediately.

---

## Media Library (`/media-library` + `/:id`)

- **Mock file:** `src/mock/mediaLibrary.ts`; **pages** under
  `src/features/mediaLibrary/`: `MediaLibraryPage` (dropzone + gallery grid, also
  exports the `MediaTile`), `MediaDetailPage` (preview + meta + URL + delete).
  Sidebar **Media Library** (System group, Image icon) → `/media-library`.
  Modeled on EduCtrl `/admin/gallery`.
- **Connected to existing modules:** each item records `uploadedBy` (a `staff`
  name). **Files aren't really stored** — a dropped/selected image is previewed
  in-browser (`readImageMeta` reads natural width/height + a data-URL preview for
  images ≤ `maxPreviewBytes`); seeded items and videos render as gradient tiles.
  Helpers: `allowedMediaExtensions` (jpeg/jpg/png/gif/webp/mp4/mov/wmv/webm),
  `maxMediaMb` (16), `mediaTypeOf` → `image`/`video`, `formatFileSize`,
  `mockMediaUrl`, `mediaCounts`.

### `media: MediaItem[]`

`id · name · type` (`image`/`video`) `· url · thumb` (data-URL preview or null)
`· gradient · width · height · size · uploadedBy · uploadedAt`. 8 seeded,
persisted to `unidest-media-library` (`addMedia` / `deleteMedia`; a large
data-URL preview that overflows the quota just stays in-memory).

- **Library** (`/media-library`): drag-and-drop dropzone (also click → hidden
  multi-file input) validating extension + 16 MB size · All / Images / Videos
  filter with live counts + search · responsive **Available Media** grid of
  `MediaTile`s (real `<img>` preview when `thumb` set, else gradient tile with a
  type icon; a "Video" badge for videos) → each links to the detail page.
- **Detail** (`/media-library/:id`): "Media Details" · large preview · meta cards
  (Type · Dimensions · Size · Uploaded By · Uploaded date) · read-only URL +
  **Copy** · **Delete** via `ConfirmDialog` → back to the library.

---

## Announcements (`/announcements` + `/new` + `/:id` + `/:id/edit`)

- **Mock file:** `src/mock/announcements.ts`; **pages** under
  `src/features/announcements/`: `AnnouncementsPage` (list, also exports the
  `AREA_BADGE` map), `AnnouncementFormPage` (create/edit), `AnnouncementViewPage`
  (read). Sidebar **Announcements** (System group, Megaphone icon) →
  `/announcements`. Modeled on EduCtrl `/admin/announcements`.
- **Connected to existing modules:** the **Area** is the audience segment and its
  **live recipient count** comes straight from the existing mocks —
  `audienceCount('Students'|'Leads'|'Staff'|'All')` reads `students.length` /
  `leads.length` / `staff.length` (All = the sum); each announcement records its
  `createdBy` (`staff` name). `formatDateTime`/`toInputValue` bridge the stored
  ISO datetime and the `datetime-local` input.

### `announcements: Announcement[]`

`id · title · area` (`All`/`Students`/`Leads`/`Staff`) `· message · createdBy ·
publishedAt` (ISO). 4 seeded, persisted to `unidest-announcements`
(`addAnnouncement` / `updateAnnouncement` / `deleteAnnouncement`;
`sortedAnnouncements` = newest-first by `publishedAt`).

- **List** (`/announcements`): Show entries + search (title/area) · table Title
  (link → view) / **Area** (colour badge + live audience count) / Created By /
  Published At (`formatDateTime`) / inline **Edit** + **Delete** (`ConfirmDialog`)
  · "Showing X to Y of Z" + pagination.
- **Create/Edit** (`/announcements/new`, `/announcements/:id/edit`): Area\* select
  (shows "Reaches N recipient(s)") · Title\* · Message\* (textarea) · Published At\*
  (`datetime-local`, defaults to now) → `add`/`update`, redirects to the view.
- **View** (`/announcements/:id`): area badge + count · title · Created By +
  Published At · message body (`whitespace-pre-wrap`) · Edit / Back.

---

## User Management (`/user-management` + `/new` + `/:id` + `/:id/edit`)

- **Mock file:** `src/mock/userManagement.ts`; **pages** under
  `src/features/userManagement/`: `UserManagementPage` (list), `UserFormPage`
  (create/edit), `UserViewPage` (detail). Sidebar **User Management** (System
  group, UserCog icon) → `/user-management`. Modeled on EduCtrl
  `/admin/auth/staff`.
- **This is the account & access view of the Staff people** (Staff = workload).
  It's **seeded from `staff`** via an `OVERLAY` map (extra roles, all-branch
  access, reporting line, blocked status) so names/emails/branches agree, reuses
  the shared `staffRoles` / `staffBranches` / `avatarColor` / `initials`, and each
  seeded user keeps a `staffId` → the view links "View workload in Staff"
  (`/staff/:staffId`).

### `users: UserAccount[]`

`id · name · email · mobile · roles[] · branches[] · reportingToId ·
status` (`Active`/`Inactive`/`Blocked`) `· createdOn · isSuperAdmin · staffId`.
7 seeded, persisted to `unidest-users` (`addUser` / `updateUser` /
`setUserStatus` / `deleteUser` — delete also clears anyone's `reportingToId`
pointing at the removed user). Live relations: `reportingToName`,
`directReports`, `reportingOptions`.

- **List** (`/user-management`): "User Management · Staff Accounts" · Role /
  Status filters + Clear · Show + search + `ExportButtons` · table Name (avatar +
  **Super Admin** badge) / Contact (email + mobile) / **Details** (role badges ·
  Branch · Reports to) / Created On / Status badge / Actions (sky **eye** + slate
  **3-dot**: Edit / Activate-Deactivate / Block / Delete). **Super Admin can't be
  blocked or deleted.** Footer note mirrors the reference.
- **Create/Edit** (`/user-management/new`, `/user-management/:id/edit`): Full
  Name\* · Email\* (regex) · Mobile · **Role(s)\*** + **Branch(es)\*** via
  `MultiSelect` · Reporting To select (other users) · Status radios · Password
  (create only).
- **View** (`/user-management/:id`): identity header (avatar, status, Super Admin)
  · Roles & Access (role + branch badges) · Reporting Line (reports-to · direct
  reports list · "View workload in Staff" when `staffId` is set).

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

## Webinar & Events

- **Mock file:** `src/mock/webinars.ts`
- **Used by:** `src/features/webinars/WebinarsPage.tsx` (route `/webinars`,
  wired to the "Webinar & Events" sidebar item; breadcrumb "Dashboard / Webinar")

### `webinars: Webinar[]`

| Field | Type | Notes |
|-------|------|-------|
| id | number | |
| topic | string | webinar/event title |
| date | string | `11-06-2026 02:31 PM` |
| venue | string | "Online" or a branch/hall name |
| audienceType | `'Student' \| 'Agent' \| 'Student / Agent'` | `webinarAudienceTypes` |
| enrolledUsers | number \| null | null → shown as `--` |

- Records: **18**. **Maps to (future):** a `webinars` table + a
  `webinar_enrolments` count.

Simple bordered list table (zebra rows, no search/pagination — matches the
reference). **Create** opens a modal (Topic / Date & Time via the shared
`DateTimePicker` / Venue / Audience Type, required-field errors) that prepends
a row; **Delete** confirms via `ConfirmDialog` then removes the row; both
confirm with `SuccessDialog`. Rows live in page state.

**View** (`WebinarViewPage.tsx`, route `/webinars/:id`, breadcrumb
"Dashboard / Webinar / View Webinar") shows the detail card from the reference:
Topic / Image (generated gradient banner until uploads exist) / Date / Venue /
Copy Webinar Link (readonly input + Copy with clipboard fallback,
`webinarShareLink()` builds the mock URL) / Audience Type / Webinar Link /
Description / Notified Email / Enrolled Users, plus a back button. Extra
optional `Webinar` fields: `webinarLink`, `description`, `notifiedEmail`
(null → "--").

**Edit** (`EditWebinarPage.tsx`, route `/webinars/:id/edit`, breadcrumb
"Dashboard / Webinar / Edit Webinar") mirrors the reference form: Basic
Information (Topic* / Audience Type* / Short Description) · Schedule & Venue
(Date & Time* via the shared `DateTimePicker`, prefilled by parsing the mock
date string / Mode-Venue* / Webinar Link) · Banner Image (current banner + file
upload with live object-URL preview) · Full Description (minimal
contentEditable editor: bold/italic/underline/lists/undo/redo via
`execCommand`). Update validates, **saves via `updateWebinar()`**, then shows
`SuccessDialog` and returns to the list.

**Persistence:** webinars survive full page reloads via a localStorage working
copy (key `unidest-webinars`) in `src/mock/webinars.ts` — `loadWebinars()` on
module load (seed = first-run default), `saveWebinars()` / `updateWebinar()`
called by create, delete and edit. Clearing the key resets to the seed.

**Enrolled Users** (`WebinarEnrolledPage.tsx`, route `/webinars/:id/enrolled`,
breadcrumb "Dashboard / Webinar / Enrolled Users") lists who enrolled: header
with topic + date/venue + count badge, zebra table (# / Name / Email / Phone /
User Type badge / Enrolled On), empty state when 0, back button. Data comes
from `webinarEnrollments(w)` in the mock — generated **deterministically** from
the webinar id (count = `enrolledUsers`; agent-audience webinars yield Agent
rows). `parseWebinarDate()` also moved into the mock and is shared with the
edit page. All four webinar row actions are now fully wired.

---

## CMS (`/cms/*`)

Reference: EduCtrl `/admin/cms/home-page`, `/admin/cms/countries`,
`/admin/blog-posts`, `/admin/articles`, `/admin/menu-manager`,
`/admin/cms/newsletter-subscribers`. One consolidated mock (`src/mock/cms.ts`)
backs six sub-modules, all persisted to their own `unidest-cms-*` localStorage
keys. **The CMS never invents data another module owns** — it derives from and
links back to existing modules everywhere.

### 1. Home Page & Theme (`/cms/home-page`, `HomePageSettingsPage.tsx`)

Settings screen (no list). `homeSettings: HomeSettings` (single object, key
`unidest-cms-home`, merged with defaults on load) + `saveHomeSettings(patch)`.
Sections:
- **Public Website Theme** — `frontendThemes` (Europa/Ganymede/Callisto) select +
  `brandColors[]` swatch grid (primary+accent pairs, click to select).
- **Homepage Layout** — `LayoutMode` cards (minimal/full) + `homeSections[]`
  toggle grid. Each section is a `HomeSection` with an optional `count()` reading
  a **live number from a connected module**: Destinations→`cmsCountries`,
  Study Streams→`topCategories()`, Programs→`courses`, University Logos→
  `universities`, Blog→published `blogPosts`, Events→`webinars`, Gallery→`media`.
- **Header/Footer Display** — Top Bar / Menu Bar / Footer / Copyright toggles.

Reusable `Toggle` switch lives in `src/features/cms/components/Toggle.tsx`.

### 2. Countries (`/cms/countries` + `/:id/edit`)

`cmsCountries: CmsCountry[]` (key `unidest-cms-countries`) **seeded from the
unique countries in Course Management `universities`** — those get status
`Published`, a curated `EXTRA_DESTINATIONS` set ships as `Default Only`.
`universitiesInCountry(name)` reads the live partner-university count from
Course Management. List: Country / Slug (`study-in/<slug>`) / Universities /
Status (click cycles `countryStatuses`) / Edit + Preview (→ Course Finder).
Edit page shows the connected university count with a link to `/universities`.

### 3. Blog Posts (`/cms/blog` + `/new` + `/:id/edit`)

`blogPosts: BlogPost[]` (key `unidest-cms-blog`). CRUD: `addPost` / `updatePost`
/ `togglePostFeatured` / `deletePost`, `sortedPosts()`. Authors come from
`staff`. List = image tile (uploaded data-URL or gradient) / title+slug+author /
status / featured star (toggle) / published / Edit+Delete, with Show/status/
search/`ExportButtons`. Form: title (auto-slug), slug, excerpt, content, cover
upload (FileReader data-URL preview), status, author (Staff select), featured.

### 4. Pages (`/cms/pages` + `/new` + `/:id/edit`)

`cmsPages: CmsPage[]` (key `unidest-cms-pages`). Content pages (About Us,
policies) are fully CRUD; **module pages** (`system: true` — Countries, Home)
render live data and can be edited but **`deleteCmsPage` returns false** for
them (shown as a locked "System" chip). Form disables name/slug for system pages.

### 5. Menu Manager (`/cms/menu`, `MenuManagerPage.tsx`)

`menuItems: MenuItem[]` (key `unidest-cms-menu`) across `menuGroups`
(main/footer). `linkTypes[]` **map to real routes/modules** (home, page, static,
blog, course_finder, study_destinations, universities, webinars, student_login,
student_signup). Tabs, ordered items with parent nesting, move up/down
(`moveMenuItem`), inline edit modal (`createPortal`), add-item form
(label/link type/parent/new tab), delete (`deleteMenuItem` re-parents children),
and a Link Types reference panel. Save Menu = toast (already persisted per-change).

### 6. Newsletter (`/cms/newsletter`, `NewsletterPage.tsx`)

`newsletterSubscribers: NewsletterSubscriber[]` (key `unidest-cms-newsletter`)
**seeded partly from real Student emails** + public sign-ups. List: # / Email /
Subscribed At (`formatSubscribedAt`) / IP / delete, with search + `ExportButtons`
(Export CSV). `sortedSubscribers()` newest-first, `deleteSubscriber(id)`.

Wiring: routes in `router.tsx`, sidebar CMS children carry `to` values,
breadcrumb TITLES/TRAILS/dynamicTrail cover every CMS route.

---

## Message Templates (`/message-templates/*`)

Reference: EduCtrl `/admin/mailtemplates`, `/admin/smstemplates`,
`/admin/whatsapptemplates`, `/admin/cannedresponsetemplates`. One mock
(`src/mock/messageTemplates.ts`) powers all four; the three channel screens
share **one** reusable list component and **one** form (no duplicate logic).

### Template engine (Email / SMS / WhatsApp)

`channels = ['email','sms','whatsapp']`; `channelMeta` captures the only real
differences — Email has a **Subject**, WhatsApp uses `{{token}}` merge tags
while Email/SMS use `#token#` (`formatTag(channel, token)`). `messageTemplates:
MessageTemplate[]` (key `unidest-message-templates`), filtered via
`templatesFor(channel)`.

**Connection to existing modules** — every event template is bound to a
`TemplateEvent` (`templateEvents[]`) that already fires elsewhere:
`STUDENT_CREATE_WELCOME`/`BIRTHDAY_WISHES`→Students, `LEAD_WELCOME`→Leads,
`WEBINAR_REMINDER`→Webinars, `UNIVERSITY_APPLICATION_UPDATE`→Applications,
`COURSE_SUGGESTION`→Course Finder, `AGENT_COMMISSION_PAYOUT`→Referral,
`STAFF_LEAD_ASSIGNED`→Staff. The list's Details column links straight to that
module's route. `mergeTags[]` resolve to real record fields (name, email,
course, university, intake, webinar, application…) and are click-to-insert in
the form (caret-aware). Event templates are `system: true` — editable/toggleable
but **`deleteTemplate` returns false** for them (locked in the UI); custom
templates are deletable. Bodies are authored channel-neutral (`{token}`) and
`renderBody()` swaps in the channel's delimiter, so one source serves all three.

Pages: `TemplatesPage.tsx` takes a `channel` prop (routes pass
`<TemplatesPage channel="email" />`); `TemplateFormPage.tsx` reads `:channel`
+ `:id` from the route (`/message-templates/:channel/new` + `/:id/edit`).

### Canned Responses (`/message-templates/canned` + `/new` + `/:id/edit`)

`cannedResponses: CannedResponse[]` (key `unidest-canned-responses`) — grouped
quick replies for the live-chat widget. Each has a `type`, `details`, `enabled`
flag and a `responses[]` array. List: Type / Details / Replies count / Status
(toggle) / Edit + Delete. Form manages the dynamic `responses[]` (add/remove
rows) + enabled toggle. Full CRUD (`addCanned`/`updateCanned`/`toggleCanned`/
`deleteCanned`).

Wiring: routes in `router.tsx` (canned routes precede the `:channel` dynamic
ones), sidebar Message Templates children carry `to`, breadcrumb covers every
channel + canned route including channel-aware new/edit trails.

---

## Import (`/import`)

Reference: EduCtrl `/admin/import-export/students` — a tabbed CSV importer.
`src/mock/importData.ts` is a small **config-driven engine**; the reference's
Agents tab (no agents module here) is replaced with **Staff** so every tab maps
to a real module: **Leads, Students, Staff, Course Data**.

**Connected to existing modules — this is the only place the app bulk-creates
records**, and each tab writes straight into its module: Leads→`addLead`,
Students→pushes onto `students`, Staff→`addStaff`, Course Data→`addCourse`.
`importEntities[]` declares each entity's `columns` (header/field/required/
`enumValues`), whether it shows an "Assign to Branch" select or an
"Auto-generate password" checkbox, a live `count()` from the module, and an
`importRecord()` that builds a valid record with sensible defaults. Column
enums are sourced from the real modules (`staffBranches`, `studyLevels`,
`staffRoles`, `studentSources`, `studyAreas`…) so the on-screen rules and the
validation always agree with what those modules accept.

Engine helpers: `parseCsv()` (RFC-4180-ish, handles quotes/commas/newlines),
`buildPreview()` (maps rows to fields, checks required + enum values, returns
per-row errors + valid/error counts), `buildSampleCsv()` (real headers + one
example row, downloaded client-side), `runImport()` (appends every valid row
via `importRecord`, returns how many landed).

Pages: `ImportPage.tsx` renders the entity tabs (with live count badges) +
active-tab live count and syncs the tab to `?tab=`; the reusable
`ImportPanel.tsx` runs the workflow for whichever entity is active — format
rules, Download Sample, file picker, **in-browser preview table** (valid rows
vs. per-row errors, first 8 shown), branch/password options, Import button, and
a success banner linking to the module (e.g. "View in Students →"). One panel,
four entities — no duplicated per-tab logic.

Wiring: route `/import` in `router.tsx`, sidebar Import leaf carries `to`,
breadcrumb TITLES has `/import`.

Note: file-upload → append was verified by build + logic and manual use; the
headless browser-use runner can't drive the OS file picker, so that final step
isn't part of the automated smoke test.

---

## Backups (`/backups`)

Reference: EduCtrl `/admin/backups` — a server-ops page (download a DB dump +
shell/cron guidance). Adapted for a frontend build where the app's real state
lives in the mock modules (seeded, persisted to `unidest-*` localStorage on
change): here a **backup is a live JSON snapshot of every module's data**,
downloadable and restorable. `src/mock/backups.ts` owns the engine.

**Connected to existing modules**: `REGISTRY` maps each `unidest-*` storage key
to the module's **live exported array** (`leads`, `students`, `staff`, `users`,
`courses`, `universities`, `courseCategories`, `studentResources`, `media`,
`announcements`, `webinars`, `serviceRequests`, invoices, all `cms.*`,
`messageTemplates`, `cannedResponses`…). So counts are always accurate — seed or
edited, **including rows added by the Import tool** — and the snapshot holds real
data. `listSources()` also sweeps any extra `unidest-*` key found in localStorage
that isn't curated, so nothing is missed. `sourceValue(key)` returns live data
for registry keys, else the stored JSON.

Engine: `buildBackup()` → a signed `BackupManifest` ({signature, version, app,
generatedAt, keys}); `downloadBackup()` serializes + triggers a browser download
and stamps `unidest-last-backup`; `parseBackup()` validates an uploaded file;
`restoreBackup(manifest, 'replace'|'merge')` writes keys back to localStorage
(a reload rehydrates each persistent module); `summarizeManifest()` powers the
restore preview; `formatBytes`/`formatDateTime` are shared formatters.

Page (`BackupsPage.tsx`): (1) **Generate & download** — stat tiles (data sets /
total records / snapshot size) + Download button + last-backup time; (2)
**What's included** — a live table (Module link · Records · Size · Storage key)
with a totals row; (3) **Restore from backup** — file picker → validated preview
of the manifest's data sets → `ConfirmDialog` → restore + reload; (4)
**Scheduled backups** — guidance card (browser data is on-demand; cron/mysqldump
notes for a hosted DB). Reuses `ConfirmDialog`.

Wiring: route `/backups`, sidebar Backups leaf carries `to`, breadcrumb TITLES.

Note: download-file-landing and restore-upload use the browser's file layer,
which the headless browser-use runner can't inspect/drive; both flows are
build-verified and the download was confirmed live (the last-backup timestamp
updates on click).

---

## Roles (`/roles` + `/new` + `/:id/edit`)

Reference: EduCtrl `/admin/auth/role` — Role Management (list + grouped
permission editor). `src/mock/roles.ts` owns the RBAC data.

**Connected to existing modules**: roles ARE the roles used across Staff and User
Management — seeded from `staffRoles` (Super Admin, Branch Manager, Counsellor,
Admission Officer, Front Desk, Accountant), each with a permission `PRESETS`
entry. `userCountForRole(name)` reads the **live** count of User Management
accounts holding that role (`users[].roles`), and the list's Users cell links to
`/user-management?role=<name>`. `permissionGroups` is the grouped catalog (~47
permissions across 17 groups — Lead/Student/Application/Staff/Agent/Course/
Invoice/Support/CMS/Upload/Message-Template/Referral/Report/Advanced/Chat +
General), mirroring the reference. `Role` = {id, name, managerial, permissions[],
system}. CRUD: `addRole`/`updateRole`/`deleteRole` (Super Admin is `system` —
`deleteRole` returns false, always shows "All permissions", no edit/delete in the
list). `hasAllPermissions()` decides the "All" pill; `permissionLabel()` renders
chips. Persists to `unidest-roles` (so it also shows up in the Backups snapshot).

Pages: `RolesPage.tsx` — table Role · Permissions (chips with "+N more", "All"
for system) · Managerial (Yes/—) · Users (live, linked) · Actions (edit/delete;
system = N/A) + a Note card linking to User Management. `RoleFormPage.tsx` —
Name, "managerial role" `Toggle` (reused from CMS), and the grouped permission
checkbox editor with a running "N of 47 selected" counter, per-group and global
Select-all/Clear, selected-card highlight, and the "grant View with Edit"
reminder. Reuses `ConfirmDialog`, `Toggle`.

Wiring: routes `/roles`, `/roles/new`, `/roles/:id/edit`; sidebar Roles leaf
carries `to`; breadcrumb TITLES + create/edit trails.

---

## Settings (`/settings`)

Reference: EduCtrl `/admin/settings` — a huge tabbed config screen. Rather than
stub ~35 tabs, this builds a focused **settings-nav + panel** layout where every
tab is real and wired (no dead ends). `src/mock/settings.ts` holds one
`AppSettings` object persisted to `unidest-settings` (so it also shows in the
Backups snapshot), loaded with a deep-merge over `defaults`.

**Connected to existing modules**: the Public Website Theme reuses CMS
`frontendThemes` and links to CMS › Home Page; **Branches** and **Study Levels**
are seeded from the real `staffBranches` / `studyLevels` those modules already use
(Staff, Users, Leads, Students, Courses, Import) and the panels link back to them;
**Modules** toggles the app's real modules via `moduleRegistry` (label + route,
mirrors the sidebar); **Localization** currency options come from Invoices
(`invoiceCurrencies`); **Notifications** links to Message Templates. Helpers:
`saveSettings(slice, value)`, `toggleModule`, `add/removeBranch`,
`add/removeStudyLevel`, `setMaintenance`, `enabledModuleCount`, and
`pendingSetupSteps()` (empty required fields → the amber "Master Setup" banner).

Pages: `SettingsPage.tsx` — Master Setup banner (dynamic pending count), a
sticky left settings-nav synced to `?tab=`, and the active panel. Panels live in
`features/settings/panels/`:
- `ListEditorPanel.tsx` — **one reusable** chip-list editor powering both Branches
  and Study Levels (add/remove + connected note); also exports the shared `Panel`
  card wrapper used by every panel.
- `GeneralPanel.tsx` — org profile, theme, social links, footer + Save.
- `LocalizationPanel.tsx` — currency/date/timezone/week-start + Save.
- `ModulesPanel.tsx` — per-module `Toggle` with live enabled count + route links.
- `NotificationsPanel.tsx` — channel + event `Toggle`s + Save.
- `AdvancedPanel.tsx` — maintenance `Toggle`, Backups link, and a "reset settings"
  danger action (`ConfirmDialog` → clears `unidest-settings` → reload).

Reuses the CMS `Toggle` and `ConfirmDialog`; no per-tab duplicated logic. Wiring:
route `/settings`, sidebar Settings leaf carries `to`, breadcrumb TITLES.

---

<!--
FUTURE PAGES — append a new "## <Page>" section here using the Dashboard block
above as the template. Then flip its row in the Index table to ✅ done.
-->
