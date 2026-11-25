import { useSession } from 'next-auth/react'
import { type ReactNode, useState } from 'react'
import { SWRConfig } from 'swr'

/**
 * SWR cache for the signed-in user, in memory only (never persisted to
 * storage, so no financial data stays on the device). Signing out or
 * switching accounts mounts a fresh, empty cache, so one person never sees
 * another's cached data. The first sign-in (or the session loading) keeps
 * the tree mounted: nothing user-scoped was cached before it.
 */
export const UserScopedSWR = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession()
  const email = session?.user?.email ?? null
  const [scope, setScope] = useState({ email, generation: 0 })
  // Derived during render (no effect) so the old cache never paints.
  if (status !== 'loading' && email !== scope.email)
    setScope({
      email,
      generation: scope.email === null ? scope.generation : scope.generation + 1
    })

  return (
    <SWRConfig
      key={scope.generation}
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
