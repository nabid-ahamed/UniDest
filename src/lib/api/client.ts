/**
 * The single seam between the UI and its data source.
 *
 * Today every `api.*` call resolves from the mock modules in `src/mock/`. In
 * Phase 2 (see the roadmap in the design spec) this file becomes the only place
 * that changes: swap the bodies for `request()` calls against the NestJS API and
 * every feature hook — and therefore every screen — keeps working untouched.
 *
 * Rules for this layer:
 *  - Feature code never imports from `src/mock/` directly; it goes through the
 *    hooks in `src/lib/api/hooks/`, which call this module.
 *  - Everything is async, even while it is mock-backed, so the eventual network
 *    swap does not change a single call signature.
 */

import { clearSession, getAccessToken } from '../../store/auth'

/**
 * Base URL of the real API. Defaults to '/api', which the Vite dev proxy
 * (vite.config.ts) forwards to the NestJS server on port 4000 — so the browser
 * sees same-origin requests and no CORS is involved in development.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

/**
 * Kill switch for the mock → API migration.
 *
 * Resources that have been migrated check this: true routes them at the NestJS
 * server, false falls back to `src/mock/`. Set `VITE_USE_REAL_API=false` in a
 * `.env.local` to run entirely on mock data without editing code — useful if
 * the backend is down or a migration bug appears.
 *
 * The default is deployment-aware rather than a bare `true`. The NestJS server
 * only runs on localhost, so a deployed build (Vercel and friends) has no API
 * to reach: `/api/*` there hits the SPA rewrite and returns 405, which surfaces
 * as "Could not reach the server" on the login form. Preview deployments are
 * demos, so mock data is the correct default — an explicit VITE_USE_REAL_API,
 * or a VITE_API_URL pointing at a hosted backend, still wins.
 */
const isLocalhost =
  typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)

export const USING_REAL_API =
  import.meta.env.VITE_USE_REAL_API === 'true'
    ? true
    : import.meta.env.VITE_USE_REAL_API === 'false'
      ? false
      : isLocalhost || Boolean(import.meta.env.VITE_API_URL)

/**
 * Resolve a value the way the network eventually will: asynchronously.
 *
 * Mock data is synchronous, but the hooks must already behave as if it is not —
 * otherwise loading states go untested until the day the API lands. A microtask
 * is enough to make the promise real without adding artificial latency.
 */
export function mocked<T>(produce: () => T): Promise<T> {
  return Promise.resolve().then(produce)
}

/**
 * Fetch wrapper for Phase 2. Not called while `USING_REAL_API` is false, but
 * defined now so the shape of a real request — auth header, JSON body, error
 * handling — is settled before the backend exists.
 */
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  if (!res.ok) {
    // The API returns `{ message }` on failure; fall back to the status text.
    const body = await res.json().catch(() => null)

    // 401 means the token is missing, expired, or invalid. Drop the dead
    // session and send the user to sign in again — without this the app sits
    // on a blank screen retrying a request that can never succeed.
    // The login call itself is exempt: a 401 there is "wrong password", which
    // the form shows inline rather than treating as an expired session.
    if (res.status === 401 && !path.startsWith('/auth/login')) {
      clearSession()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    throw new ApiError(body?.message ?? res.statusText, res.status)
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

/** Error carrying the HTTP status, so callers can branch on 401/403/404. */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}
