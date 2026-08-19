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

/** Base URL of the real API. Unused while mock-backed; read in Phase 2. */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

/** True once the app talks to a real backend instead of the mock modules. */
export const USING_REAL_API = false

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
  const token = localStorage.getItem('unidest-token')
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
