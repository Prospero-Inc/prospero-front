/** @type {import('next').NextConfig} */

const { i18n } = require('./next-i18next.config.js')
const withPWA = require('next-pwa')({
  dest: 'public',
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
