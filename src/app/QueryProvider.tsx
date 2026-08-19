import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

/**
 * One client for the whole app, created outside the component so a re-render
 * never throws the cache away.
 *
 * Defaults are tuned for a CRM back-office: data is refetched on demand rather
 * than on every window focus (a counsellor tabbing between windows should not
 * trigger a burst of requests), and a 30s `staleTime` keeps rapid navigation
 * between list and detail views off the network entirely.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
