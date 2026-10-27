/** @type {import('next').NextConfig} */

const { i18n } = require('./next-i18next.config.js')
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
    ? { urlPattern: entry.urlPattern, handler: 'NetworkOnly' }
    : entry
)

const withPWA = require('next-pwa')({
  dest: 'public',
  runtimeCaching,
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
