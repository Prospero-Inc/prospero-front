/// <reference lib="webworker" />
// Prospero's service worker, built by @serwist/next into public/sw.js (same
// URL as the old next-pwa one, so existing push subscriptions keep working).
// Standard VAPID Web Push, no Firebase. Payload: { title, body, url, tag },
// `url` a same-origin path (e.g. "/expenditures").
import { defaultCache } from '@serwist/next/worker'
import {
  NetworkOnly,
  type PrecacheEntry,
  type RuntimeCaching,
  Serwist,
  type SerwistGlobalConfig
} from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const DEFAULT_TITLE = 'Prospero'
const DEFAULT_URL = '/dashboard'
const ICON = '/icons/icon-192.png'

// Caches that would hold *user data*: page props, API responses and
// logged-in HTML. Stored on disk they outlive sign-out on a shared device,
// and stale props once broke navigation. They go straight to the network;
// static assets keep Serwist's default caching.
const USER_DATA_CACHES = new Set([
  'next-data',
  'apis',
  'pages',
  'pages-rsc',
  'pages-rsc-prefetch',
  'others'
])

const cacheNameOf = (entry: RuntimeCaching): string | undefined =>
  typeof entry.handler === 'object' && 'cacheName' in entry.handler
    ? String(entry.handler.cacheName)
    : undefined

const runtimeCaching: RuntimeCaching[] = defaultCache.map(entry =>
  USER_DATA_CACHES.has(cacheNameOf(entry) ?? '')
    ? { matcher: entry.matcher, handler: new NetworkOnly() }
    : entry
)

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // No silent takeover: the page shows "new version available" and posts
  // SKIP_WAITING when the user accepts (see ServiceWorkerUpdater).
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: '/_offline',
        matcher: ({ request }) => request.destination === 'document'
      }
    ]
  }
})

serwist.addEventListeners()

// Caches older service workers filled with user data (see USER_DATA_CACHES)
// — deleted so no props/HTML/API responses stay on disk.
const LEGACY_USER_DATA_CACHES = Array.from(USER_DATA_CACHES)

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all(LEGACY_USER_DATA_CACHES.map(name => self.caches.delete(name)))
  )
})

/** Only same-origin URLs: a payload must not open an external site. */
const toSameOriginUrl = (url: unknown): string => {
  if (typeof url !== 'string' || url.length === 0) return DEFAULT_URL
  try {
    const resolved = new URL(url, self.location.origin)
    if (resolved.origin !== self.location.origin) return DEFAULT_URL
    return resolved.pathname + resolved.search + resolved.hash
  } catch {
    return DEFAULT_URL
  }
}

interface PushPayload {
  title: string
  body: string
  url: string
  tag: string | undefined
}

const parsePayload = (event: PushEvent): PushPayload => {
  let raw: Record<string, unknown> = {}
  if (event.data)
    try {
      const parsed: unknown = event.data.json()
      if (parsed && typeof parsed === 'object')
        raw = parsed as Record<string, unknown> // narrowed by the check above
    } catch {
      // Not JSON: use the plain text as the body.
      try {
        raw = { body: event.data.text() }
      } catch {
        raw = {}
      }
    }

  return {
    title:
      typeof raw.title === 'string' && raw.title ? raw.title : DEFAULT_TITLE,
    body: typeof raw.body === 'string' ? raw.body : '',
    url: toSameOriginUrl(raw.url),
    tag: typeof raw.tag === 'string' && raw.tag ? raw.tag : undefined
  }
}

// `renotify` is supported by browsers but missing from TS's DOM typings.
interface ProsperoNotificationOptions extends NotificationOptions {
  renotify?: boolean
}

self.addEventListener('push', event => {
  const { title, body, url, tag } = parsePayload(event)
  const options: ProsperoNotificationOptions = {
    body,
    icon: ICON,
    badge: ICON,
    tag,
    // `renotify` without `tag` is a TypeError in Chrome.
    renotify: Boolean(tag),
    data: { url }
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  const data: unknown = event.notification.data
  const path = toSameOriginUrl(
    data && typeof data === 'object' && 'url' in data ? data.url : undefined
  )
  const targetUrl = new URL(path, self.location.origin).href

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      })

      const sameOrigin = windowClients.find(client => {
        try {
          return new URL(client.url).origin === self.location.origin
        } catch {
          return false
        }
      })

      if (sameOrigin) {
        const focused = await sameOrigin.focus()
        if (focused.url === targetUrl) return
        try {
          await focused.navigate(targetUrl)
          return
        } catch {
          // `navigate` fails on clients this SW doesn't control: open a
          // new window instead.
        }
      }

      await self.clients.openWindow(targetUrl)
    })()
  )
})
