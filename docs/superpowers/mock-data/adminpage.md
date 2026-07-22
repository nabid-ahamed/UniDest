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
| [Webinar & Events](#webinar--events) | `src/mock/webinars.ts` | ✅ done |
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

<!--
FUTURE PAGES — append a new "## <Page>" section here using the Dashboard block
above as the template. Then flip its row in the Index table to ✅ done.
-->
