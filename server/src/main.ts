import 'reflect-metadata'
import 'dotenv/config'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

/**
 * Postgres BIGINT columns come back as JavaScript BigInt, which JSON.stringify
 * throws on ("Do not know how to serialize a BigInt"). Every id in this schema
 * is a BigInt, so without this shim any response containing one crashes.
 *
 * Serialising as a Number (not a string) is deliberate: the frontend is built
 * around numeric ids — `qk.leads.detail(id: number)` in src/lib/api/keys.ts,
 * `/leads/:id` routes, `Number(id)` parsing — so strings would break it.
 * Safe here because Number holds integers up to 2^53; these ids are far below.
 */
;(BigInt.prototype as unknown as { toJSON(): number }).toJSON = function (this: bigint) {
  return Number(this)
}

const PORT = Number(process.env.PORT ?? 4000)

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Every route lives under /api, matching API_BASE_URL in the frontend's
  // src/lib/api/client.ts (which defaults to '/api').
  app.setGlobalPrefix('api')

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties with no DTO decorator
      forbidNonWhitelisted: true, // ...and reject the request if any were sent
      transform: true, // coerce payloads into their DTO classes
    }),
  )

  // The Vite dev proxy means the browser sees same-origin requests in dev, so
  // CORS is not strictly needed there. Configured anyway for direct calls
  // (curl, Postman) and for the eventual deployed frontend.
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })

  await app.listen(PORT)
  console.log(`API listening on http://localhost:${PORT}/api`)
  console.log(`Health check:     http://localhost:${PORT}/api/health`)
}

bootstrap()
