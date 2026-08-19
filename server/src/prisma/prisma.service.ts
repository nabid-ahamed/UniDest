import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

/**
 * One shared database connection for the whole app.
 *
 * Holds the client as a property rather than extending PrismaClient: in
 * Prisma 7 the generated model accessors (`.lead`, `.user`, …) are defined on
 * the instance, so a subclass sees them as undefined. Callers therefore use
 * `prisma.client.lead.findMany()`.
 *
 * Uses the POOLED url (DATABASE_URL, port 6543) — pgbouncer multiplexes many
 * app requests onto few Postgres connections, keeping us inside Supabase's
 * connection limit. The unpooled DIRECT_URL (5432) is only for migrations,
 * which need session mode to run DDL.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client: PrismaClient

  constructor() {
    this.client = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    })
  }

  async onModuleInit() {
    await this.client.$connect()
  }

  async onModuleDestroy() {
    await this.client.$disconnect()
  }
}
