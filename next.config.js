/** @type {import('next').NextConfig} */

// Only the routing keys: next-i18next's config also carries i18next options
// (`interpolation`) that Next rejects as unknown.
const {
  i18n: { defaultLocale, locales, localeDetection }
} = require('./next-i18next.config.js')
const i18n = { defaultLocale, locales, localeDetection }

// Serwist builds src/sw.ts into public/sw.js — the same URL next-pwa used,
// so existing push subscriptions stay attached to it. ESM-only package:
// requires Node 22.12+ (production and CI run 22.23).
const withSerwist = require('@serwist/next').default({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  // Registered by ServiceWorkerUpdater instead, so it can offer the update
  // ("new version available") rather than taking over silently.
  register: false,
  reloadOnOnline: false,
  // Precache only what the app shell needs offline. Never public/assets
  // (desktop-only illustrations every phone used to download on install).
  globPublicPatterns: ['icons/**/*', 'manifest.json', 'favicon.ico'],
  // The offline fallback page (src/sw.ts) can only be served if it's
  // precached; a fresh revision per build keeps it in sync with the app.
  additionalPrecacheEntries: [
    { url: '/_offline', revision: require('crypto').randomUUID() }
  ],
  // Precaching a stale build during `next dev` causes more confusion
  // (edits not showing up) than it's worth — only in production builds.
  disable: process.env.NODE_ENV === 'development'
})

const nextConfig = {
  reactStrictMode: true,
  i18n,
  // Configuración is no longer one long page: each section is its own
  // screen under /settings/*, reached from "Más". Old links keep working
  // (the query string, e.g. Google's ?gmail=connected, is carried over).
  async redirects() {
    return [
      {
        source: '/settings',
        has: [{ type: 'query', key: 'gmail' }],
        destination: '/settings/gmail',
        permanent: false
      },
      { source: '/settings', destination: '/more', permanent: false },
      { source: '/profile', destination: '/settings/profile', permanent: false }
    ]
  }
}

module.exports = withSerwist(nextConfig)
