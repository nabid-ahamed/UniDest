# UniDest — Student Portal Mock Data

Single reference for **all Student-portal mock data** while we build the
student-facing pages frontend-first. Each page gets a section below documenting:
**where the data lives**, its **shape (fields + types)**, record counts, and
which **DB table** (from the design spec) it maps to when the real backend
arrives.

> This is the student-portal counterpart to
> [adminpage.md](adminpage.md) (the admin CRM pages). Where a screen reuses
> admin-side data (e.g. a student's own applications/invoices), link across to
> the matching admin section instead of duplicating the shape here.

**Update this file whenever mock data is added or changed** for any student
page, so building later pages stays consistent and the eventual API swap is
easy.

**Convention:** all mock data lives in `src/mock/*.ts` (one file per
page/domain), never inline in components. Types are exported alongside the data.
Student-portal-only mocks go in `src/mock/student/*.ts` (or a clearly named
file) so they stay separate from admin mocks.

**Related:** DB schema in
[../specs/2026-07-18-unidest-crm-design.md](../specs/2026-07-18-unidest-crm-design.md) (§5).

---

## Index

| Page | Route | Mock file | Status |
|------|-------|-----------|--------|
| [Home / Dashboard](#home--dashboard-portal) | `/portal` | `src/mock/student/portal.ts` | ✅ done |
| [Course Suggestions](#course-suggestions-portalcourse-suggestions) | `/portal/course-suggestions` | `src/mock/courseSuggestions.ts` | ✅ done |
| [Study Abroad Apply](#study-abroad-apply-portalapply) | `/portal/apply` | reuses admin mocks (`students.ts` + programs + `portal.ts` docs) | ✅ done |
| [My Applications](#my-applications-portalapplications) | `/portal/applications` | `applications.ts` (via `myApplications()`) + `applicationMessages.ts` | ✅ done |
| [Additional Services](#additional-services-portalservices) | `/portal/services` | `services.ts` (via `myServices()`) — messages/activity live on the record | ✅ done |
| [Course Finder](#course-finder-portalcourse-finder) | `/portal/course-finder` | `courseFinder.ts` (`finderCourses` + helpers) + `finderActions.ts` | ✅ done |
| [Country Information](#country-information-portalcountry-info) | `/portal/country-info` | `cms.ts` (`cmsCountries`) + `countryDocs.ts` | ✅ done |
| [Fees](#fees-portalfees) | `/portal/fees` | `studentInvoices.ts` (via `myInvoices()`) | ✅ done |
| [Resources](#resources-portalresources) | `/portal/resources` | `studentResources.ts` (`resourceCategories` + `studentResources`) | ✅ done |

---

## Course Suggestions (`/portal/course-suggestions`)

- **Mock file:** `src/mock/courseSuggestions.ts` (shared with admin)
- **Page:** `src/features/student/StudentCourseSuggestionsPage.tsx`
- Modeled on demo.eductrl.com/cn4/course-suggestion (reference only).

**Shared store — the key connection.** `courseSuggestions.ts` centralises the
two localStorage stores both sides use:
`unidest-lead-suggestions` (file suggestions) and `unidest-cf-suggestions`
(Course Finder pushes). The admin `LeadCourseSuggestionTab` (also used by the
student detail page) was refactored to import its load/save from here — no
duplicate logic. So:

- a counsellor's shared file / Course Finder push shows up on the student portal;
- the student's **Approve / Reject** writes `accepted` back, which the admin
  "Accepted?" column reads.

| Export | Shape | Notes |
|--------|-------|-------|
| `FileSuggestion` | `{ date, file, accepted }` | `file` = "Title — filename"; card splits it into a heading + Download. |
| `CfSuggestion` | `{ date, course, university, intake, accepted }` | Course card; enriched with city/country/study level/duration via `finderCourseByTitle` (new helper in `mock/courseFinder.ts`). |
| `loadFileSuggestions` / `saveFileSuggestions` / `loadCfSuggestions` / `saveCfSuggestions` | `(personId, …)` | keyed by student/lead id. |
| `setFileSuggestionAccepted` / `setCfSuggestionAccepted` | `(personId, index, accepted)` | student Approve/Reject → persists. |
| `ensureCourseSuggestionsSeed` | `(personId)` | idempotent, non-destructive demo seed (only writes when empty). |

The **Home** "Course Suggestions" card reads the same `loadCfSuggestions`
store (seeded via `ensureCourseSuggestionsSeed`), so the dashboard and this page
never disagree.

- **Maps to (future):** a `course_suggestions` table (file + course rows) with a
  per-student `accepted` status.

---

## Home / Dashboard (`/portal`)

- **Mock file:** `src/mock/student/portal.ts`
- **Layout:** `src/layouts/StudentLayout.tsx` (fixed white `StudentSidebar` +
  brand-blue `StudentHeader`; distinct from admin `AdminLayout`).
- **Page:** `src/features/student/StudentDashboardPage.tsx` (+ reusable
  `components/PortalCard.tsx` — card shell / list head / empty state — and
  `components/StatusPill.tsx` — solid hex badge via `pickTextColor`).
- Modeled on demo.eductrl.com/cn4/home (reference only), built with our brand
  blue + design system.

### The signed-in student

`currentStudent()` maps the demo `student@gmail.com` login to one real
`students` record (`STU-2026-1893`, Rohan Das) so **every card connects to the
admin modules**. The sidebar "Welcome …" and header avatar/menu also read
`currentStudent()`, so the whole portal shows one coherent identity.

### Cards — all DERIVED from existing modules (no duplicated data)

| Card | Source | Derivation |
|------|--------|-----------|
| My Applications | `mock/applications.ts` | `myApplications()` = `applications` filtered by `studentNo`; status badge reuses `application.statusColor`. → View all `/portal/applications` |
| Fees (My Invoices) | `mock/studentInvoices.ts` | `myInvoices()` filtered by `studentNo`; amount = `invoiceAmountLabel` (`formatMoney`+`invoiceCurrency`+`invoiceGrandTotal`); status = `invoiceStatus`. → View all `/portal/fees` |
| Additional Services | `mock/services.ts` | `myServices()` = `serviceRequests` matched by student email/name. → View all `/portal/services` |

So these three always agree with the admin Applications / Student Invoices /
Additional Services pages.

### Portal-only mock (no admin equivalent yet)

| Export | Type | Records | Notes |
|--------|------|---------|-------|
| courseSuggestions | `CourseSuggestion[]` | 4 | Counsellor-shared course ideas (course · university · date). |
| documentRequests | `DocumentRequest[]` | 4 | Docs requested against the student's applications; status `Pending Upload` / `Uploaded`. |

Status colours: `serviceStatusColor` / `documentStatusColor` /
`invoiceStatusColor` return hex, rendered as solid pills by `StatusPill`.

- **Maps to (future):** student-scoped queries over `applications`,
  `student_invoices`, `service_requests`, plus a future `document_requests`
  table and the course-suggestion store.

---

## Study Abroad Apply (`/portal/apply`)

- **Page:** `src/features/student/StudentApplyPage.tsx`
- **Reuses (no duplicate logic):**
  - `studentAsLead(student)` (moved to `src/mock/students.ts`, shared with the
    admin `StudentViewPage`) → maps the signed-in `currentStudent()` to the
    `Lead` shape so the lead tabs render as-is.
  - `LeadIdentityHeader`, `LeadProfileTab`, `LeadCoursePreferencesTab` — the
    same components the admin lead/student detail pages use.
- Modeled on demo.eductrl.com/cn4/overseas/profile (reference only).

Three tabs:

| Tab | Component | Data source |
|-----|-----------|-------------|
| Profile | `StudentProfileForm` — full inline editable form | Core fields sync to the Student record via `updateStudent`; extended fields persist to the profile store (below). |
| Course Preferences | `LeadCoursePreferencesTab` | Programs stored in `unidest-lead-programs`, keyed by the student's id — the same store as the admin Course Preferences tab. |
| Documents | `StudentDocumentsTab` | Document requirements in `studentDocs.ts`; uploads persist per student (see below). |

**Profile form — faithful to the reference.** `StudentProfileForm`
(`src/features/student/StudentProfileForm.tsx`) reproduces
demo.eductrl.com/cn4/overseas/profile as an inline editable form:

- **Sections:** Personal Info · Study Preference (multi-tag Study Country
  Preference + Services Interested) · Current Address · Permanent Address
  (Same-as-Current toggle) · Passport Information · Nationality (2 Yes/No) ·
  Background Info (4 Yes/No) · Emergency Contacts, then a **Save**.
- **Seven collapsible accordions** below Save (Academic Details · Tests /
  Foreign Languages · Internships & Courses · Employment History · Visa
  Application History · International Travel History · Family Details) are all
  driven by ONE reusable `RepeaterSection` from a field schema — no duplicate
  per-section logic.
- **Store:** `src/mock/student/studentProfile.ts` — `StudentProfile` type +
  `loadStudentProfile(id)` / `saveStudentProfile(id, profile)`, persisted to
  `unidest-student-profile` keyed by student id. Option lists: `genders`,
  `maritalStatuses`, `educationLevels`, `servicesOptions` (plus `allCountries`
  / `studyLevels` reused from `students.ts`).
- **On Save:** core identity (name from First/Middle/Last, e-mail, mobile,
  study level, first country preference, current-address country) writes to the
  Student record via `updateStudent`; the rest goes to the profile store; then
  the global success dialog shows "Profile Updated Successfully".
- Field primitives live in `src/features/student/components/profileFields.tsx`
  (`Field`, `TextInput`, `DateInput`, `Select`, `YesNoField`, `MultiTagSelect`,
  `RepeaterSection`).

**Documents tab — faithful to the reference** (demo.eductrl.com/cn4/overseas/docs).
`StudentDocumentsTab` renders a set of named document requirements, grouped:

- **Academic Certificates & Document** (each file ≤ 2 MB) — Class 10th/SSC
  Certificate & Marks Sheet, Class 12th/HSC Certificate & Marks Sheet, Bachelor
  Degree Certificate & Transcript, Passport (required).
- **Tests/English Certificates** (pdf only, 2-col grid) — IELTS, TOEFL, PTE,
  Duolingo, GRE, GMAT.
- **SOP / LOR / CV** — SOP, LOR (required, multiple, max 3), CV (required),
  plus a **per-course CV table** (Course · University · Upload) whose rows come
  from the student's Course Preferences programs (`loadCourseRows` reads the
  shared `unidest-lead-programs` store) — so it's connected, not duplicated.

Each card: title bar + Choose File(s) + Allowed File Types + optional Notes +
Required flag + "Uploaded File(s)" list with Replace / delete (trash).

- **Store:** `src/mock/student/studentDocs.ts` — `DocRequirement` type, the
  three requirement lists (`ACADEMIC_DOCS` / `TEST_DOCS` / `OTHER_DOCS`),
  `loadDocUploads` / `setDocUpload` (uploaded **file names** persisted to
  `unidest-student-docs`, keyed by student id + requirement key), and
  `loadCourseRows`.

The separate **Home** dashboard "Document Requests" card still reads
`documentRequests` in `portal.ts` (a lightweight summary) — unrelated to this
requirements-based Documents tab.

- **Maps to (future):** a `document_requirements` table (office-defined) joined
  to per-student `document_uploads`, plus course-specific document rows.

---

## My Applications (`/portal/applications`)

- **List page:** `src/features/student/StudentApplicationsPage.tsx`
- **Detail page:** `src/features/student/StudentApplicationDetailPage.tsx`
  (route `/portal/applications/:id`)
- Modeled on demo.eductrl.com/cn4/applications (reference only).

**List** — a "University Applications" card with a table (ID · Country ·
Details [University/Course/Intake] · Status · Details button). Rows come from
`myApplications()` (in `portal.ts`) — the admin `applications` module filtered
to the signed-in student — so the portal always agrees with the admin
Applications page. Status uses the shared `StatusPill` with `a.statusColor`.

**Detail** — "University Application #{id}" with the course/university/country +
status pill, then three sections faithful to the reference:

| Section | Source |
|---------|--------|
| Document Requests (Date · Document Requested · Upload Date · File) | `documentRequests` from `portal.ts`, filtered by `applicationRef === "University Application #{id}"` — the same store the Home card and Apply→Documents home-card summary use. |
| Message History + Send Message to Staff | `src/mock/student/applicationMessages.ts` — `loadMessages(appId)` / `sendMessage(appId, sender, text)`, persisted to `unidest-application-messages` (seeded thread for app 302122). Student bubbles right-aligned, staff left. |
| University Application Activity (numbered timeline) | Derived from the application record (created + current status). |

The detail page guards on `app.studentNo === currentStudent().studentNo` so a
student can only open their own applications.

- **Maps to (future):** student-scoped `applications` query + a
  `document_requests` table + an `application_messages` thread + an activity
  log.

---

## Additional Services (`/portal/services`)

- **List page:** `src/features/student/StudentServicesPage.tsx`
- **Detail page:** `src/features/student/StudentServiceDetailPage.tsx`
  (route `/portal/services/:id`)
- Modeled on demo.eductrl.com/cn4/service-and-visa/applications (reference only).

**List** — an "Additional Services" card with a table (ID · Service · Country ·
Amount · Details · Status · Details button). Rows come from `myServices()` (in
`portal.ts`) — the admin `services` module filtered to the signed-in student by
email/name — so the portal agrees with the admin Additional Services page.
Amount shows `--` (services carry no amount field). Status uses `StatusPill`
with `serviceStatusColor` (hex).

**Detail** — "Service Application #{id}" with Service / Country / Status +
description, then:

| Section | Source |
|---------|--------|
| Message History + Send Message to Staff | `ServiceRequest.messages` (on the record itself). Sending appends `{ text, notify, files, at, by }` and calls `updateService` — the same store the admin `ServiceViewPage` reads. Student bubbles (by === current student) right-aligned. |
| Service Application Activity (numbered timeline) | A derived "Service request created" entry + `ServiceRequest.activity` (status-change log shared with admin). |

No new store was needed — messages and activity already live on
`ServiceRequest` in `mock/services.ts`, so this is a pure reuse. The detail page
guards on `studentEmail`/`studentName === currentStudent()` so a student only
sees their own requests. The grey `SectionHead` bar is shared with the
My-Applications detail page (`components/SectionHead.tsx`).

- **Maps to (future):** student-scoped `service_requests` query + its message
  thread + activity log.

---

## Course Finder (`/portal/course-finder`)

- **Page:** `src/features/student/StudentCourseFinderPage.tsx`
- Modeled on demo.eductrl.com/cn4/course-finder (reference only) — the
  student-facing search: a hero + search bar, a filter sidebar, and course
  cards with **Bookmark** + **Apply**.

**Reuses the admin catalogue (no duplicate data).** Cards come from
`finderCourses` in `mock/courseFinder.ts` — the same catalogue the admin Course
Finder and Course Suggestions (`finderCourseByTitle`) use. Filtering/sorting use
the shared helpers `feeAmount` and `inDurationBucket`, plus `finderCountries`,
`finderStudyLevels`, `studyAreas`, `disciplineAreas`, `durationBuckets`,
`sortOptions`.

Filters: Destination (country) · Study Level · Study Area · Discipline
(dependent on Study Area) · Duration, plus a keyword search in the hero. Header
shows the live "N courses found" count and a Sort dropdown. Selects reuse
`SingleSelect`.

**Actions — `src/mock/student/finderActions.ts`:**

| Action | Effect |
|--------|--------|
| Bookmark | Toggles + persists to `unidest-finder-bookmarks` (keyed by student id); the button shows a filled "Bookmarked" state. |
| Apply | `applyToCourse` adds the course to the student's **Course Preferences** (`unidest-lead-programs`) — the same store the Study Abroad Apply → Course Preferences tab and the Documents per-course CV table read — then the global success dialog confirms. Duplicates are rejected with a toast. |

So "Apply" on a finder course shows up as a Selected Program on the Apply page
and as a row in the per-course CV table — a real cross-module connection,
verified in the browser.

- **Maps to (future):** a `courses` catalogue query + a per-student
  `bookmarks` table + the `course_preferences` write.

---

## Country Information (`/portal/country-info`)

- **Grid page:** `src/features/student/StudentCountryInfoPage.tsx`
- **Detail page:** `src/features/student/StudentCountryInfoDetailPage.tsx`
  (route `/portal/country-info/:id`)
- Modeled on demo.eductrl.com/cn4/hostcountryinfo (reference only).

**Grid** — destination-country cards (yellow info icon + country name + "Browse
Documents"), driven live from the **CMS Countries** module
(`cmsCountries` in `mock/cms.ts`); `status === 'Hidden'` countries are excluded,
so the portal shows exactly what the office has published. No duplicate country
list.

**Detail** — breadcrumb "Documents › {COUNTRY}", a country intro card
(`heading` + `intro` from the CMS record) that also shows the **live partner-
university count** via `universitiesInCountry(name)` (reads the Course
Management `universities` module — a real cross-module connection), then the
country's documents **grouped by category** (General Information · Visa
Documents · Living & Costs · Scholarships). Each document row has a **Download**
button → the global success dialog ("… download has started").

**Documents mock:** `src/mock/student/countryDocs.ts` —
`countryDocuments(countryName)` generates the category/document set per country
(titles reference the country), so every CMS country gets a consistent,
dynamic document list without hardcoding one per country.

- **Maps to (future):** the CMS `countries` table joined to a
  `country_documents` table (office-uploaded files per country/category).

---

## Fees (`/portal/fees`)

- **List page:** `src/features/student/StudentFeesPage.tsx`
- **Detail page:** `src/features/student/StudentInvoiceDetailPage.tsx`
  (route `/portal/fees/:id`)
- Modeled on demo.eductrl.com/cn4/my-invoices (reference only).

**List** — "My Invoices" table (Date · Invoice # · Amount · Status · Actions).
Rows come from `myInvoices()` (in `portal.ts`) — the admin Student Invoices
module filtered to the signed-in student by `studentNo`, so the portal always
agrees with the admin invoices and the Home Fees card. Amount uses
`invoiceAmountLabel` (grand total), status uses `StatusPill` +
`invoiceStatusColor`. Actions: **Pay** (Due only) · **View** (opens the detail)
· **Download** (mock → success dialog).

**Detail** — full invoice: issuing business (`businessById`), Bill-To (student),
line items, and totals all derived from the shared helpers
(`invoiceSubTotal` / `invoiceGrandTotal` / `invoicePaid` / `invoiceDue`) so the
list, detail and admin pages never disagree. Shows the payments table when
present.

**Pay** — `payInvoice(inv)` (in `portal.ts`) records a full-due payment on the
shared invoice record via `updateStudentInvoice`, flipping it to **Paid** (Due
→ 0). Because it writes the same store, the admin Student Invoices page, the
Home Fees card and this list all update together — verified in the browser. The
detail page guards on `studentNo === currentStudent()`.

- **Maps to (future):** student-scoped `student_invoices` query + a `payments`
  write (real gateway in place of the mock Pay).

---

## Resources (`/portal/resources`)

- **Grid page:** `src/features/student/StudentResourcesPage.tsx`
- **Collection page:** `src/features/student/StudentResourceCategoryPage.tsx`
  (route `/portal/resources/:id`)
- Modeled on demo.eductrl.com/cn4/resources (reference only).

**Grid** — resource-collection cards, driven live from the admin Student
Resources module (`resourceCategories` in `mock/studentResources.ts`); each card
shows its **live file count** via `resourceCountForCategory`. No duplicate list.

**Collection** — breadcrumb "Resources › {collection}", then the collection's
files (`resourcesForCategory`). Each file row shows a file-type icon (from
`fileType`), name + size (`formatFileSize`), **who uploaded it** (`uploadedBy`,
the Staff module) and date, an optional **related course** link
(`relatedCourse` → the Course Management `courses` module), and a **Download**
button → the global success dialog. So a resource ties back to Staff and Course
Management — real cross-module connections, verified in the browser.

- **Maps to (future):** a `resource_categories` table + a `resources` table
  (real file storage in place of the mock download) joined to `staff` and
  `courses`.

---

<!--
  Section template — copy for each new student page:

  ## <Page name> (`/route`)

  - **Mock file:** `src/mock/student/<file>.ts`
  - **Used by:** `src/features/student/<Page>.tsx` (+ components …)

  ### `exportName: Type[]`
  Short description of what it renders.

  | Field | Type | Notes |
  |-------|------|-------|
  | id | number | |

  - Records: **N** (…).
  - **Maps to (future):** `<table>` joined to … (design spec §…).
-->
