import 'dotenv/config'
import { defineConfig } from 'prisma/config'

/**
 * Prisma 7 configuration.
 *
 * The database URL lives here rather than in `schema.prisma` (Prisma 7 removed
 * `datasource.url`). It is read from `DATABASE_URL` in `.env`, which is
 * gitignored — see `.env.example` for the expected shape.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // This config drives the Prisma CLI (migrate / db seed / studio), which
    // runs DDL. Supabase's pooled endpoint (pgbouncer, 6543) is transaction-mode
    // and cannot run DDL — it hangs — so the CLI must use the session-mode
    // direct URL (5432). Falls back to DATABASE_URL for providers that expose
    // only one endpoint (e.g. Neon).
    //
    // The application itself does NOT read this file: PrismaClient is
    // constructed with a PrismaPg adapter pointed at the pooled DATABASE_URL,
    // which is the right endpoint for serving requests.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
})
