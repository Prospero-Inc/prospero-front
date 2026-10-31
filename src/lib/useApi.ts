import { HttpMethod } from '@/enums'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import useSWR, { useSWRConfig } from 'swr'

import { localApiService } from './apiService'

// Client-side data for the main screens (dashboard, expenses, income, fixed
// expenses): SWR over /api/proxy/read/*, so navigating and saving no longer
// go through getServerSideProps. The cache is in memory only (SWRConfig in
// _app) and is dropped when the signed-in user changes.

type Query = Record<string, string | undefined>

const KEY_TAG = 'api'

const toQueryString = (query: Query = {}): string =>
  new URLSearchParams(
    Object.entries(query).filter(
      (entry): entry is [string, string] => entry[1] !== undefined
    )
  ).toString()

/**
 * Data from a backend GET (`path` without leading slash, e.g.
 * 'periods/transactions'). Pass `null` to wait (e.g. until the router has
 * the query). The access token isn't part of the key: it rotates every 15
 * minutes and the fetcher always reads the current one.
 */
export const useApi = <T>(path: string | null, query?: Query) => {
  const { data: session } = useSession()
  const { locale } = useRouter()
  const token = session?.accessToken
  const queryString = toQueryString(query)

  return useSWR<T>(
    path && token ? [KEY_TAG, path, queryString, locale] : null,
    () =>
      localApiService.request<T>({
        method: HttpMethod.GET,
        endPoint: `/proxy/read/${path}${queryString ? `?${queryString}` : ''}`,
        headers: {
          Authorization: `Bearer ${token}`,
          'x-lang': locale ?? 'es'
        }
      })
  )
}

const keyPath = (key: unknown): string | null =>
  Array.isArray(key) && key[0] === KEY_TAG && typeof key[1] === 'string'
    ? key[1]
    : null

/**
 * Re-fetches every loaded `useApi` whose path starts with one of
 * `prefixes` — what a screen calls after saving instead of reloading the
 * page. Returns once fresh data is in.
 */
export const useRevalidateApi = () => {
  const { mutate } = useSWRConfig()
  return (...prefixes: string[]) =>
    mutate(key => {
      const path = keyPath(key)
      return path !== null && prefixes.some(prefix => path.startsWith(prefix))
    })
}

/**
 * Optimistically edits the cached data of every loaded `useApi` under
 * `prefix` (e.g. drop a deleted row) without re-fetching yet.
 */
export const useUpdateApiCache = () => {
  const { mutate } = useSWRConfig()
  return <T>(prefix: string, update: (_current: T) => T) =>
    mutate<T>(
      key => keyPath(key)?.startsWith(prefix) ?? false,
      current => (current === undefined ? current : update(current)),
      { revalidate: false }
    )
}
