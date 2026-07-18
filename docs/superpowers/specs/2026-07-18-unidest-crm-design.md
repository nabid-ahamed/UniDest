# UniDest — Study Abroad CRM: System Architecture & Database Design

**Date:** 2026-07-18
**Status:** Approved (design phase)
**Author:** Design session (Nabid + Claude)

---

## 1. Overview

UniDest is a CRM for study-abroad / overseas-education consultancies
(comparable to eductrl).

**Current scope: single-tenant, multi-tenant-ready.** The system is built and
hosted now for **one organization** — no tenant sign-up, no subdomains, no
tenant switching. However, the schema keeps a `tenant_id` column on every table
(defaulting to `1`) so the product can become a multi-tenant SaaS **later with
no data migration** — only sign-up, tenant filtering, and RLS need to be turned
on. Eventual target scale (once SaaS): **~100,000–150,000 users** across tenants.

Everything a developer builds now looks and behaves as a plain single-tenant
app; the `tenant_id` column is the only concession to the future.

The system manages the core funnel:

```
Lead  ──convert──►  Student  ──►  Application  ──►  Course ─ University ─ Country
```

### Guiding principles

- **Modular monolith first**, not microservices. 150k users is moderate scale;
  a well-indexed monolith + PostgreSQL + Redis handles it comfortably and stays
  cheap and simple to operate. Modules can be extracted into services later if a
  real bottleneck appears.
- **YAGNI** — build the core funnel first (Lead / Student / Application /
  University). Chat, invoicing, notifications, form-builder, CMS come later.
- **Frontend-first** — the React SPA is built first against mock data, then
  wired to the NestJS API.
- **Tenant isolation is non-negotiable** — enforced in three layers.

---

## 2. System Architecture

```
                    ┌─────────────────────────┐
                    │   React SPA (frontend)  │  ← built first
                    │  Vite + TS + Tailwind   │
                    └───────────┬─────────────┘
                                │  HTTPS / REST (JSON) + JWT
                    ┌───────────▼─────────────┐
                    │   NestJS API (backend)  │  ← built later
                    │  modular monolith       │
                    │  Auth · RBAC · Tenancy  │
                    └──┬─────────┬─────────┬──┘
                       │         │         │
              ┌────────▼──┐ ┌────▼────┐ ┌──▼────────┐
              │PostgreSQL │ │  Redis  │ │ Object    │
              │(main DB)  │ │cache +  │ │ Storage   │
              │  + RLS    │ │ queue   │ │ (S3/docs) │
              └───────────┘ └─────────┘ └───────────┘
                                │
                          ┌─────▼──────┐
                          │ Background  │  email / SMS / WhatsApp,
                          │ Workers     │  report generation,
                          │ (BullMQ)    │  bulk import/export
                          └─────────────┘
```

### Components

| Component | Responsibility |
|-----------|----------------|
| **React SPA** | All UI. Talks to API over REST + JWT. Deployed as static assets (CDN). |
| **NestJS API** | Business logic, auth, RBAC, tenancy enforcement, validation. Modular monolith. |
| **PostgreSQL** | Single primary database, shared-schema multi-tenancy, Row-Level Security. |
| **Redis** | Cache (dashboard stats, permissions, sessions) + BullMQ job queue. |
| **Object storage** | Student/application documents (S3-compatible). DB stores only URLs. |
| **Background workers** | Async jobs: notifications, report generation, bulk import/export. |

### Request/data flow (example: create a lead)

1. SPA sends `POST /leads` with JWT (contains `user_id`, `tenant_id`, `role`).
2. API `AuthGuard` verifies JWT → `TenantGuard` sets the tenant context.
3. `PermissionGuard` checks the role can `leads:create`.
4. Service writes the row; `tenant_id` is injected automatically (never trusted
   from the request body).
5. `activity_log` entry written; response returned.

> **Note — this is the eventual SaaS flow.** In the current single-tenant build,
> `TenantGuard` is a **no-op** (`tenant_id` is always `1`) and step 4's tenant
> injection just stamps `1`. `PermissionGuard` (RBAC) **is active now**.
> Tenant-scoped query filtering is turned on in Phase 5 (see §3, §7).

---

## 3. Tenancy Strategy (single-tenant now, SaaS-ready)

**Current build: single tenant.** All rows use a fixed `tenant_id = 1`. There is
**no** tenant sign-up, subdomain routing, tenant switching, or Row-Level
Security in the current scope. The app is, for all practical purposes, a plain
single-organization CRM.

**Why keep `tenant_id` at all?** Adding a tenant discriminator to a populated
production database later is risky and painful (schema migration + backfill on
every table). Including the column now — defaulted to `1` — is nearly free and
makes the eventual SaaS switch a matter of turning features on, not migrating
data.

### What is built now vs. deferred

| Concern | Now (single-tenant) | Later (SaaS) |
|---------|---------------------|--------------|
| `tenant_id` column on every table | ✅ present, always `1` | reused as-is |
| Tenant sign-up / onboarding | ❌ skipped | add |
| Subdomain / tenant routing | ❌ skipped | add |
| Query filtering by tenant | not needed (single value) | enable |
| PostgreSQL Row-Level Security | ❌ skipped | enable |
| `(tenant_id, …)` composite indexes | ✅ present (harmless now) | already optimal |

### Future SaaS model (for reference, not built now)

When SaaS is turned on, the chosen model is **shared database, shared schema,
`tenant_id` column (row-level isolation)** — cheapest and simplest at ~150k
users, versus schema-per-tenant (hard to manage) or database-per-tenant
(wasteful). Isolation will then be enforced in three layers: application-layer
filtering (tenant from JWT, never from the request body), PostgreSQL RLS, and
`tenant_id`-leading indexes. None of this is implemented in the current phase.

### Catalog scope (single-tenant now)

In the current single-tenant build the university/course catalog simply belongs
to the one organization (`tenant_id = 1`). The catalog tables still keep a
**nullable** `tenant_id` so that, when SaaS is enabled later, the same schema can
express a global shared catalog (`NULL`), per-tenant catalogs (`tenant_id` set),
or a mix — with no migration. Not a concern for the current phase.

---

## 4. Technology Stack

### Frontend (built first)

| Concern | Choice | Reason |
|---------|--------|--------|
| Build tool | Vite | Fast dev server / HMR |
| Framework | React + TypeScript | Type safety, team-friendly |
| Styling | Tailwind CSS | Fast, consistent UI |
| Components | shadcn/ui (Radix) | Accessible ready-made components |
| Routing | React Router | Page navigation |
| Server state | TanStack Query | API cache / refetch / invalidation |
| Client state | Zustand | Lightweight global state (auth, tenant) |
| Forms | React Hook Form + Zod | Forms + schema validation |
| Charts | Recharts | Dashboard graphs |
| Tables | TanStack Table | Large lists: sort / filter / pagination |

### Backend (built later)

| Concern | Choice |
|---------|--------|
| Framework | NestJS (modular monolith) |
| ORM | Prisma |
| Database | PostgreSQL |
| Cache / Queue | Redis + BullMQ |
| Auth | JWT (access + refresh), bcrypt/argon2 password hashing |
| File storage | S3-compatible object storage |
| Validation | class-validator / Zod at the edge |

### Frontend project structure

```
src/
├── app/            # router, providers (Query, auth, theme)
├── layouts/        # sidebar + topbar shell
├── features/       # feature-first modules
│   ├── auth/
│   ├── dashboard/
│   ├── leads/
│   ├── students/
│   ├── applications/
│   ├── universities/
│   ├── agents/
│   └── settings/
├── components/ui/  # shared button, input, table, modal...
├── lib/            # api client, helpers, constants
├── hooks/          # shared hooks
├── types/          # shared TS types (Lead, Student, ...)
└── mock/           # mock data (used until the API exists)
```

Each `features/*` folder is self-contained (list, form, detail view, hooks, and
local types) so multiple developers can work in parallel and code stays easy to
locate.

---

## 5. Database Design

### 5.1 Conventions (every table unless noted)

```
id           BIGINT        PRIMARY KEY (auto-increment)
public_id    UUID          UNIQUE, used in URLs/API (avoids leaking sequential ids)
tenant_id    BIGINT        NOT NULL DEFAULT 1 → tenants(id)   [single-tenant now:
                                                always 1; except tenants itself]
created_at   TIMESTAMPTZ   DEFAULT now()
updated_at   TIMESTAMPTZ
deleted_at   TIMESTAMPTZ   NULL   (soft delete)
```

**ID decision:** internal `BIGINT` auto-increment for fast, compact indexes; a
separate `public_id` (UUID) exposed externally so sequential ids never leak.

### 5.2 Tenancy & people

**tenants** *(no `tenant_id`)*
```
id, public_id, name, slug (subdomain), plan_id,
status ENUM(active | suspended | trial),
trial_ends_at, settings JSONB
```

**users** — staff
```
id, public_id, tenant_id, branch_id → branches, role_id → roles,
name, email, password_hash, phone, avatar_url,
status ENUM(active | invited | disabled), last_login_at
UNIQUE (tenant_id, email)
INDEX  (tenant_id, role_id)
```

**roles**
```
id, tenant_id, name, permissions JSONB, is_system BOOLEAN
-- permissions example: {"leads":["create","read","update"],"reports":["read"]}
```

**branches**
```
id, tenant_id, name, address, phone
```

### 5.3 Configurable lookups (admin-editable status & type)

Lead/application status and document type are **not** hardcoded database ENUMs.
Each consultancy runs a different pipeline, and changing a Postgres ENUM later
means `ALTER TYPE` + migration — the exact pain our `tenant_id` strategy exists
to avoid. EduCtrl itself keeps these admin-configurable. So they live in lookup
tables the tenant can edit.

**lead_statuses**
```
id, public_id, tenant_id, key, label, color, sort_order,
is_won BOOLEAN, is_lost BOOLEAN, is_system BOOLEAN
UNIQUE (tenant_id, key)
```

**application_statuses**
```
id, public_id, tenant_id, key, label, color, sort_order,
is_terminal BOOLEAN, is_won BOOLEAN, is_system BOOLEAN
UNIQUE (tenant_id, key)
```

**document_types**
```
id, public_id, tenant_id, key, label,
applies_to ENUM(student | application),   -- internal, safe to keep as ENUM
sort_order, is_system BOOLEAN
UNIQUE (tenant_id, key, applies_to)
```

**Why the `is_won` / `is_lost` / `is_terminal` flags?** A tenant can rename or
reorder statuses freely, so labels are unreliable for analytics. Reports compute
"converted %", "lost %", etc. by reading these **flags**, never by matching a
label. `is_terminal` marks statuses that end a workflow (enrolled / rejected /
withdrawn).

**Why `is_system`?** Seeded default statuses/types have `is_system = true`.
Tenants may **add** their own rows but cannot delete the system ones, guaranteeing
every tenant always has a valid baseline pipeline.

### 5.4 Lead → Student funnel

**leads**
```
id, public_id, tenant_id, branch_id, assigned_to → users,
name, phone, email,
source ENUM(facebook | website | walkin | referral | other),
status_id → lead_statuses,
primary_interest_country_id → countries  (optional; lightweight hint at lead
                                           stage — full multi-preference is
                                           captured on the student after convert),
next_follow_up_at,
converted_student_id → students  (NULL until converted)
INDEX (tenant_id, status_id)
INDEX (tenant_id, assigned_to)
INDEX (tenant_id, next_follow_up_at)
```

**students**
```
id, public_id, tenant_id, lead_id → leads,
first_name, last_name, dob, gender, nationality,
phone, email, address JSONB,
passport_no, passport_expiry,
academic_history JSONB,   -- [{degree, institution, year, gpa}, ...]
assigned_to → users, status ENUM(active | inactive)
INDEX (tenant_id, assigned_to)
```
> `academic_history` stays JSONB for now (we rarely filter on it). If GPA-based
> filtering is needed later, break it out into a structured `student_academics`
> table — same reasoning as `student_test_scores` below.

**student_preferences** — a student can target multiple country/course/intake
combinations (EduCtrl: "more than one selection can be done")
```
id, public_id, tenant_id, student_id → students,
country_id → countries,
level ENUM(bachelor | master | phd | diploma),
intake_year INT, intake_month INT,
priority INT   -- 1 = top choice
INDEX (tenant_id, student_id)
```

**student_test_scores** — one row per test, so Course Finder can filter fast
(e.g. "IELTS 6.5+"); JSONB can't be indexed efficiently for that
```
id, public_id, tenant_id, student_id → students,
test_type ENUM(ielts | toefl | pte | duolingo | gre | gmat | sat),
overall NUMERIC(4,1),   -- the filterable/indexable value
sub_scores JSONB,       -- listening/reading/writing/speaking — display only
test_date DATE, expiry_date DATE
INDEX (tenant_id, student_id)
INDEX (tenant_id, test_type, overall)   -- fast "IELTS 6.5+" filter
```

**student_documents**
```
id, tenant_id, student_id → students, uploaded_by → users,
document_type_id → document_types,
file_url, file_size, status ENUM(pending | verified | rejected)
INDEX (tenant_id, student_id)
```

### 5.5 University catalog (`tenant_id` nullable — see §3)

```
countries     : id, tenant_id?, name, code, flag_url
universities  : id, tenant_id?, country_id → countries, name, city,
                logo_url, website
courses       : id, tenant_id?, university_id → universities, name,
                level ENUM(bachelor | master | phd | diploma),
                tuition_fee NUMERIC, currency, duration_months,
                requirements JSONB
intakes       : id, tenant_id?, course_id → courses, month, year,
                application_deadline
```
`tenant_id?` = nullable (NULL means global).

### 5.6 Applications (core)

**applications**
```
id, public_id, tenant_id, student_id → students,
course_id → courses, intake_id → intakes, assigned_to → users,
status_id → application_statuses,
priority ENUM(low | normal | high),
submitted_at, decision_at
INDEX (tenant_id, status_id)
INDEX (tenant_id, student_id)
```

**application_status_history** — timeline
```
id, tenant_id, application_id → applications,
from_status_id → application_statuses, to_status_id → application_statuses,
note, changed_by → users, changed_at
```

**application_documents**
```
id, tenant_id, application_id → applications,
document_type_id → document_types, file_url, status
```

### 5.7 Tasks, communication, audit

**tasks**
```
id, tenant_id, assigned_to → users, created_by → users,
title, description, due_date,
priority ENUM(low | normal | high),
status ENUM(open | done | cancelled),
related_type ENUM(lead | student | application), related_id
INDEX (tenant_id, assigned_to, status)
INDEX (tenant_id, due_date)
```

**appointments**
```
id, tenant_id, student_id → students, counsellor_id → users,
scheduled_at, mode ENUM(office | online | phone),
status ENUM(scheduled | done | cancelled | no_show)
```

**notes** *(polymorphic)*
```
id, tenant_id, author_id → users,
related_type ENUM(lead | student | application), related_id, body
```

**activity_log** *(audit trail)*
```
id, tenant_id, user_id → users, action, entity_type, entity_id,
meta JSONB, created_at
INDEX (tenant_id, entity_type, entity_id)
```

### 5.8 Agents & finance (schema now, features later)

```
agents      : id, tenant_id, name, company, email, commission_rate
commissions : id, tenant_id, agent_id → agents,
              application_id → applications, amount,
              status ENUM(pending | paid)
invoices    : id, tenant_id, student_id → students, amount, currency,
              status ENUM(unpaid | partial | paid), due_date
payments    : id, tenant_id, invoice_id → invoices, amount, method, paid_at
```

### 5.9 Relationship summary

```
tenant ─< users, roles, branches, lead_statuses, application_statuses,
          document_types, leads, students, applications,
          tasks, appointments, notes, activity_log, agents, invoices
lead   ──(convert)──► student
lead   >─ lead_statuses (status_id)
student ─< student_preferences, student_test_scores, student_documents,
          applications, appointments, invoices
application ─< application_status_history, application_documents, commissions
application >─ application_statuses (status_id), >─ course, >─ intake
course  >─ university >─ country
student_preference >─ country
user   ─< tasks (assigned), appointments (counsellor), activity_log
agent  ─< commissions
invoice ─< payments
```

---

## 6. Efficiency & Scaling (for ~150k users)

1. **Composite indexes lead with `tenant_id`** → a tenant's rows are clustered;
   queries stay fast even on multi-million-row tables.
2. **Keyset / cursor pagination** (`WHERE (tenant_id, id) < (:t, :cursor)
   ORDER BY id DESC LIMIT 50`) instead of `OFFSET` → constant-time on deep pages.
3. **JSONB** for flexible, non-filtered fields (academic history, settings,
   permissions, test sub-scores) → extend without schema migrations. Fields we
   filter on (e.g. test `overall` score) are real indexed columns, not JSONB —
   see `student_test_scores` (§5.4).
4. **PostgreSQL RLS** — deferred; added only when SaaS/multi-tenant is enabled.
5. **Redis cache** for dashboard aggregates, permission lookups, and sessions,
   with event-based invalidation on writes.
6. **Background workers (BullMQ)** for anything slow: notifications, report
   generation, bulk import/export — keeps request latency low.
7. **Future-proofing (only if needed):** partition high-volume tables
   (`applications`, `activity_log`) by year; add a read replica for reporting.
   Not built up front (YAGNI).

---

## 7. Roadmap (phased)

**Phase 1 — Frontend shell + core UI (current focus, mock data)**
Layout (sidebar + topbar), auth screens, Dashboard, Leads, Students,
Applications, Universities — all against mock data.

**Phase 2 — Backend core (single-tenant)**
NestJS setup, Prisma schema (tables above, `tenant_id` fixed to `1`),
auth + JWT + RBAC, CRUD APIs for the core funnel. Wire the SPA to real APIs.
No tenant filtering or RLS yet.

**Phase 3 — Supporting modules**
Tasks / follow-ups, appointments, documents (object storage), activity log,
notifications (email first).

**Phase 4 — Monetization & extras**
Agents & commissions, invoicing & payments, reports, form builder, WhatsApp/SMS.

**Phase 5 — SaaS switch (only if/when needed)**
Tenant sign-up & onboarding, subdomain routing, tenant-scoped query filtering,
PostgreSQL RLS, billing/plans. No data migration required — `tenant_id` already
exists on every table.

---

## 8. Open Questions / Deferred Decisions

- **SaaS / multi-tenancy** — deferred to Phase 5. Current build is single-tenant;
  `tenant_id` column is retained on every table (default `1`) so no migration is
  needed later (§1, §3).
- **Catalog scope** (global vs. per-tenant vs. mixed) — only relevant once SaaS
  is enabled; schema already supports all three via nullable `tenant_id` (§3).
- **Object storage provider** (AWS S3 vs. Cloudflare R2 vs. self-hosted MinIO) —
  decide at Phase 2.
- **Hosting/deployment target** (VPS vs. managed cloud) — decide at Phase 2.
- **Notification channels priority** (email → SMS → WhatsApp) — confirm at
  Phase 3.

---

## 9. Changelog

**2026-07-18 — schema alignment with EduCtrl behaviour & SaaS-ready reasoning**

1. **Status/type ENUMs → lookup tables.** `leads.status`, `applications.status`,
   and `student_documents.type` / `application_documents.type` are now FKs to
   admin-editable `lead_statuses`, `application_statuses`, and `document_types`.
   Reason: per-tenant pipelines + no `ALTER TYPE` migrations; reports use
   `is_won`/`is_lost`/`is_terminal` flags, not labels. (§5.3, §5.4, §5.6)
2. **Single → multiple student preference.** Removed `leads.interested_country_id`
   / `interested_level`; added `student_preferences` (country + level + intake +
   priority, many per student). A lead keeps only an optional
   `primary_interest_country_id`. Reason: students target multiple destinations.
   (§5.4, §5.9)
3. **`test_scores` JSONB → structured `student_test_scores`.** Filterable
   `overall` is now an indexed column (`(tenant_id, test_type, overall)`) for fast
   "IELTS 6.5+" Course Finder queries; sub-scores stay JSONB (display only).
   `academic_history` remains JSONB for now (noted for future split). (§5.4, §6)
4. **Tenant-flow clarity.** Added a note under §2 that `TenantGuard` is a no-op in
   the current single-tenant build (RBAC active now, tenant filtering in Phase 5).
   (§2)
