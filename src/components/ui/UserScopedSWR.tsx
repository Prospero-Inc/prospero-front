import { useSession } from 'next-auth/react'
import type { ReactNode } from 'react'
import { SWRConfig } from 'swr'

/**
 * SWR cache for the signed-in user, in memory only (never persisted to
 * storage, so no financial data stays on the device). Keyed by the user:
 * signing out or switching accounts mounts a fresh, empty cache, so one
 * person never sees another's cached data.
 */
export const UserScopedSWR = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession()

  return (
    <SWRConfig
      key={session?.user?.email ?? 'signed-out'}
      value={{
        provider: () => new Map(),
        revalidateOnFocus: true,
        // Saving always re-fetches with an explicit mutate (useRevalidateApi),
        // which skips deduping; these only spare repeated reads on navigation
        // and on going back to the app.
        dedupingInterval: 30_000,
        focusThrottleInterval: 60_000
      }}
    >
      {children}
    </SWRConfig>
  )
}
