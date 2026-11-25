/** @type {import('next').NextConfig} */

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

// Only the routing keys: next-i18next's config also carries i18next options
// (`interpolation`) that Next rejects as unknown.
const {
  i18n: { defaultLocale, locales, localeDetection }
} = require('./next-i18next.config.js')
const i18n = { defaultLocale, locales, localeDetection }

// What the app shell needs offline from public/ (never public/assets: the
// desktop-only illustrations every phone used to download on install).
// Listed here because Serwist ignores `globPublicPatterns` once
// `additionalPrecacheEntries` is set; the revision is a hash of the
// content, so a changed icon replaces the cached one.
const publicPrecacheEntries = [
  ...fs
    .readdirSync(path.join(__dirname, 'public/icons'))
    .map(file => `icons/${file}`),
  'manifest.json',
  'favicon.ico'
].map(file => ({
  url: `/${file}`,
  revision: crypto
    .createHash('md5')
    .update(fs.readFileSync(path.join(__dirname, 'public', file)))
    .digest('hex')
}))

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
  // The offline fallback page (src/sw.ts) can only be served if it's
  // precached; a fresh revision per build keeps it in sync with the app.
  additionalPrecacheEntries: [
    ...publicPrecacheEntries,
    { url: '/_offline', revision: crypto.randomUUID() }
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
      {
        source: '/profile',
        destination: '/settings/profile',
        permanent: false
      },
      {
        source: '/profile/:step(2fa|verify-2fa)',
        destination: '/settings/security/2fa',
        permanent: false
      },
      // The old list pages are gone: push notifications already on people's
      // phones still open /expenditures, and that one always meant "review
      // these".
      { source: '/expenditures', destination: '/review', permanent: false },
      {
        source: '/entries',
        destination: '/movements?kind=income',
        permanent: false
      }
    ]
  }
}

module.exports = withSerwist(nextConfig)
