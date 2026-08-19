# UniDest API

NestJS + Prisma + PostgreSQL. Serves the React SPA in the parent directory.

## Setup

```bash
cd server
npm install
cp .env.example .env     # then paste your real connection strings
npx prisma migrate deploy
npx prisma db seed
npm run start:dev        # http://localhost:4000/api
```

The SPA runs separately from the repo root (`npm run dev`, port 3000). Its Vite
config proxies `/api` here, so the browser sees same-origin requests and no CORS
is involved in development.

## Database

Hosted PostgreSQL (Supabase free tier). `.env` needs **two** URLs and they are
not interchangeable:

| Variable | Port | Used for |
|---|---|---|
| `DATABASE_URL` | 6543 | Normal queries. Pooled through pgbouncer. |
| `DIRECT_URL` | 5432 | Migrations and seeding. Session mode. |

**The pooled endpoint cannot run DDL.** Point a migration at port 6543 and it
hangs silently rather than failing — this cost an afternoon once. `prisma.config.ts`
routes CLI commands to `DIRECT_URL` for exactly this reason.

If your password contains special characters, URL-encode them: `$` → `%24`,
`@` → `%40`, `#` → `%23`.

## Scripts

| Command | Does |
|---|---|
| `npm run start:dev` | Dev server with reload |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled build |
| `npm run db:seed` | Re-seed (idempotent — safe to re-run) |
| `npm run db:studio` | Browse the data in a GUI |

## Demo accounts

All seeded with password `123456`:

| Email | Role | Lands on |
|---|---|---|
| `admin@gmail.com` | Super Admin | `/dashboard` |
| `staff@gmail.com` | Counsellor | `/dashboard` (restricted nav) |
| `student@gmail.com` | Student | `/portal` |

Plus three staff accounts (`sarah.ali@`, `mohammed.saleh@`, `moses.otieno@globaled.com`).

## Endpoints

```
POST   /auth/login              GET    /leads              GET    /students
POST   /auth/refresh            GET    /leads/:id          GET    /students/:id
POST   /auth/logout             POST   /leads              POST   /students
GET    /auth/me                 PATCH  /leads/:id          PATCH  /students/:id
                                DELETE /leads/:id          DELETE /students/:id
GET    /health                  POST   /leads/:id/convert  POST   /students/purge

GET    /applications            GET    /courses            GET    /staff
GET    /applications/:id        GET    /courses/:id        GET    /staff/assignable
GET    /applications/:id/history GET   /universities       GET    /staff/:id
POST   /applications            GET    /countries          POST   /staff
PATCH  /applications/:id        GET    /course-categories  PATCH  /staff/:id
DELETE /applications/:id                                   DELETE /staff/:id
                                GET    /roles              GET    /branches
```

Everything except `/health` and the login/refresh routes requires a bearer
token. Most routes additionally require a permission from the caller's role.

## Things that will bite you

**Every constructor needs an explicit `@Inject()`.** `tsx` runs on esbuild,
which does not emit decorator metadata, so Nest cannot infer dependencies from
type annotations. Without it you get `Cannot read properties of undefined` at
request time, not at compile time.

**Query params arrive as strings.** `@Type(() => Number)` relies on the same
missing metadata, so services coerce with `Number(...)` themselves. Prisma
rejects a string where it wants an Int.

**`PrismaService` holds the client as a property, not a base class.** In
Prisma 7 the generated model accessors live on the instance, so a subclass sees
`.lead` and `.user` as `undefined`. Call `prisma.client.lead.findMany()`.

**BigInt needs the `toJSON` shim in `main.ts`.** Every id is a BIGINT and
`JSON.stringify` throws on BigInt. It serialises as Number rather than String
because the frontend is built around numeric ids.

**`upsert` cannot key on a nullable column.** Prisma rejects `parentId: null`
in a compound `where`, so the seed uses find-then-create for top-level course
categories and recurring intakes.

## Design notes

- **Status values are lookup tables, not enums** (spec §5.3), so a consultancy
  can rename pipeline stages without an `ALTER TYPE`. Reports must read the
  `isWon` / `isLost` / `isTerminal` flags — never the labels, which tenants edit.
- **`tenant_id` is on every table, always `1`.** Multi-tenancy is a Phase 5
  feature flip, not a data migration (spec §3). `TenantGuard` is a deliberate
  no-op today.
- **Assignments reference user rows, not name strings.** Renaming a staff member
  updates every lead, student and application assigned to them. The mock matched
  `assignedTo === name` and silently orphaned them.
- **Converting a lead keeps both rows** and links them (`lead.convertedStudentId`
  / `student.leadId`). The mock deleted the lead, destroying funnel lineage.
- **Money is `amount` + `currency`**, not the mock's single `"USD 100000"`
  string, so fees can be summed and compared.
- **Response mappers rebuild the flat shapes `src/mock/*` exposed**, including
  derived fields like `leadAgeDays` and joined ones like `statusColor`. That is
  what let the UI migrate without redesigning screens.

## Not in this phase

Redis/BullMQ, file uploads (the `application_documents` table exists but
`fileUrl` stays empty), email/SMS, keyset pagination, row-level security, and
the agents/commissions tables. See §7 of the design spec for the phase plan.
