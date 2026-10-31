/** @type {import('next').NextConfig} */

// Only the routing keys: next-i18next's config also carries i18next options
// (`interpolation`) that Next rejects as unknown.
const {
  i18n: { defaultLocale, locales, localeDetection }
} = require('./next-i18next.config.js')
const i18n = { defaultLocale, locales, localeDetection }
const defaultRuntimeCaching = require('next-pwa/cache')

// next-pwa's defaults cache *user data* in the service worker:
// - `next-data` (StaleWhileRevalidate on /_next/data/*.json) stored the `{}`
//   Next returns for middleware prefetches and then served it on the real
//   client-side navigation → pages got empty props and crashed ("client-side
//   exception"). It would also show stale amounts after any edit.
// - `apis` / `others` persist /api/proxy responses and logged-in HTML pages on
//   disk, where they outlive sign-out on a shared device.
// All three go straight to the network; static assets keep their caches.
const NETWORK_ONLY_CACHES = new Set(['next-data', 'apis', 'others'])
const runtimeCaching = defaultRuntimeCaching.map(entry =>
  NETWORK_ONLY_CACHES.has(entry.options.cacheName)
    ? // `options` must exist: with an offline fallback page, next-pwa adds
      // a plugin there so a failed network request shows /_offline.
      { urlPattern: entry.urlPattern, handler: 'NetworkOnly', options: {} }
    : entry
)

const withPWA = require('next-pwa')({
  dest: 'public',
  runtimeCaching,
  // Never precache public/assets (illustrations used only on desktop pages):
  // every phone downloaded them on install.
  publicExcludes: ['!noprecache/**/*', '!assets/**/*'],
  register: true,
  skipWaiting: true,
  // Precaching a stale build during `next dev` causes more confusion
  // (edits not showing up) than it's worth — only precache in production.
  disable: process.env.NODE_ENV === 'development'
})

const nextConfig = {
  reactStrictMode: true,
  i18n
}

module.exports = withPWA(nextConfig)
