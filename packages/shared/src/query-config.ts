import { QueryClient } from '@tanstack/react-query'

// ─── Per-resource stale times ───────────────────────
// Controls how long data is considered fresh before refetching.

export const staleTimes = {
  /** Real-time data: driver location, active deliveries */
  realtime: 5_000,           // 5s
  /** Frequently changing: order list, notifications */
  dynamic: 30_000,           // 30s
  /** Moderate: order detail, quotes */
  standard: 2 * 60_000,     // 2 min
  /** Slow-changing: products, categories */
  slow: 5 * 60_000,         // 5 min
  /** Near-static: user profile, settings */
  static: 30 * 60_000,      // 30 min
  /** Immutable: categories, theme data */
  immutable: 24 * 60 * 60_000, // 24h
} as const

// ─── GC (garbage collection) times ──────────────────
export const gcTimes = {
  short: 5 * 60_000,        // 5 min
  medium: 15 * 60_000,      // 15 min
  long: 60 * 60_000,        // 1 hour
  persist: 24 * 60 * 60_000, // 24h (for persisted queries)
} as const

// ─── Create QueryClient with mobile-optimized defaults ─────

export interface CreateQueryClientOptions {
  /** Default staleTime for all queries */
  defaultStaleTime?: number
  /** Default gcTime */
  defaultGcTime?: number
  /** Max retries on failure */
  retries?: number
}

export function createQueryClient(opts: CreateQueryClientOptions = {}): QueryClient {
  const {
    defaultStaleTime = staleTimes.dynamic,
    defaultGcTime = gcTimes.medium,
    retries = 2,
  } = opts

  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: defaultStaleTime,
        gcTime: defaultGcTime,
        retry: retries,
        refetchOnWindowFocus: false,
        // On mobile, don't refetch on reconnect by default
        // (individual queries can override)
        refetchOnReconnect: 'always',
        // Network mode: always attempt, cache serves offline
        networkMode: 'offlineFirst',
      },
      mutations: {
        retry: 1,
        networkMode: 'offlineFirst',
      },
    },
  })
}
