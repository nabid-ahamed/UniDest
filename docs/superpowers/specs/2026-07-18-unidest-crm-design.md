# UniDest — Study Abroad CRM: System Architecture & Database Design

**Date:** 2026-07-18
**Status:** Approved (design phase)
**Author:** Design session (Nabid + Claude)

---

## 1. Overview

UniDest is a **multi-tenant SaaS CRM** for study-abroad / overseas-education
consultancies (comparable to eductrl). Many independent agencies sign up; each
has its own staff, leads, students, applications, and (optionally) its own
university catalog. Target scale: **~100,000–150,000 total users** across all
tenants.

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

---

## 3. Multi-Tenancy Strategy

**Chosen model: shared database, shared schema, `tenant_id` column
(row-level isolation).**

| Option | Verdict |
|--------|---------|
| Shared DB + `tenant_id` column | ✅ **Chosen** — cheapest and simplest at 150k users |
| Schema-per-tenant | ⚠️ Hard to manage/migrate across thousands of tenants |
| Database-per-tenant | ❌ Wasteful at this scale |

### Enforcement — three layers of defense

1. **Application layer** — every query is filtered by the current `tenant_id`,
   injected from the JWT via a request-scoped tenant context. The `tenant_id` is
   **never** read from the request body.
2. **PostgreSQL Row-Level Security (RLS)** — policies on every tenant-scoped
   table so that even a buggy query cannot cross tenants. The app sets
   `SET app.current_tenant = :id` per connection/transaction.
3. **Indexing** — every index on a tenant-scoped table begins with `tenant_id`,
   so a tenant's rows are physically clustered and queries stay fast even on
   large tables.

### Shared vs. tenant-specific catalog (deferred decision)

The university/course catalog scope (global vs. per-tenant) is **not decided
yet**. The schema is built to support all three options without change by making
`tenant_id` **nullable** on catalog tables:

```
universities.tenant_id  IS NULL   → global row (visible to all tenants)
universities.tenant_id  = 42      → private to tenant 42
```

Read query: `WHERE tenant_id IS NULL OR tenant_id = :current_tenant`.

- All rows global → **Global shared catalog**
- All rows tenant-scoped → **Per-tenant catalog**
- Mixed → **Global + custom**

The choice becomes purely a data-entry decision later; no migration needed.

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
tenant_id    BIGINT        NOT NULL → tenants(id)   [except: tenants itself;
                                                     nullable on catalog tables]
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

### 5.3 Lead → Student funnel

**leads**
```
id, public_id, tenant_id, branch_id, assigned_to → users,
name, phone, email,
source ENUM(facebook | website | walkin | referral | other),
status ENUM(new | contacted | counselling | applied | enrolled | lost),
interested_country_id → countries, interested_level ENUM(...),
next_follow_up_at,
converted_student_id → students  (NULL until converted)
INDEX (tenant_id, status)
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
test_scores JSONB,        -- {ielts:6.5, toefl:null, ...}
assigned_to → users, status ENUM(active | inactive)
INDEX (tenant_id, assigned_to)
```

**student_documents**
```
id, tenant_id, student_id → students, uploaded_by → users,
type ENUM(passport | transcript | sop | ielts | photo | other),
file_url, file_size, status ENUM(pending | verified | rejected)
INDEX (tenant_id, student_id)
```

### 5.4 University catalog (`tenant_id` nullable — see §3)

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

### 5.5 Applications (core)

**applications**
```
id, public_id, tenant_id, student_id → students,
course_id → courses, intake_id → intakes, assigned_to → users,
status ENUM(draft | submitted | offer_received | offer_accepted |
            visa_applied | enrolled | rejected | withdrawn),
priority ENUM(low | normal | high),
submitted_at, decision_at
INDEX (tenant_id, status)
INDEX (tenant_id, student_id)
```

**application_status_history** — timeline
```
id, tenant_id, application_id → applications,
from_status, to_status, note, changed_by → users, changed_at
```

**application_documents**
```
id, tenant_id, application_id → applications,
type, file_url, status
```

### 5.6 Tasks, communication, audit

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

### 5.7 Agents & finance (schema now, features later)

```
agents      : id, tenant_id, name, company, email, commission_rate
commissions : id, tenant_id, agent_id → agents,
              application_id → applications, amount,
              status ENUM(pending | paid)
invoices    : id, tenant_id, student_id → students, amount, currency,
              status ENUM(unpaid | partial | paid), due_date
payments    : id, tenant_id, invoice_id → invoices, amount, method, paid_at
```

### 5.8 Relationship summary

```
tenant ─< users, roles, branches, leads, students, applications,
          tasks, appointments, notes, activity_log, agents, invoices
lead   ──(convert)──► student
student ─< applications, student_documents, appointments, invoices
application ─< application_status_history, application_documents, commissions
course  >─ university >─ country
application >─ course, >─ intake
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
3. **JSONB** for flexible fields (academic history, test scores, settings,
   permissions) → extend without schema migrations.
4. **PostgreSQL RLS** as a safety net beneath the application filter.
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

**Phase 2 — Backend core**
NestJS setup, Prisma schema (tables above), auth + JWT + RBAC, tenancy + RLS,
CRUD APIs for the core funnel. Wire the SPA to real APIs.

**Phase 3 — Supporting modules**
Tasks / follow-ups, appointments, documents (object storage), activity log,
notifications (email first).

**Phase 4 — Monetization & extras**
Agents & commissions, invoicing & payments, reports, form builder, WhatsApp/SMS.

---

## 8. Open Questions / Deferred Decisions

- **Catalog scope** (global vs. per-tenant vs. mixed) — deferred; schema already
  supports all three via nullable `tenant_id` (§3).
- **Object storage provider** (AWS S3 vs. Cloudflare R2 vs. self-hosted MinIO) —
  decide at Phase 2.
- **Hosting/deployment target** (VPS vs. managed cloud) — decide at Phase 2.
- **Notification channels priority** (email → SMS → WhatsApp) — confirm at
  Phase 3.
