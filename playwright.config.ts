import { defineConfig, devices } from '@playwright/test'

const FRONT_PORT = 4556
const BACKEND_PORT = 4555

// Mobile smoke tests: the real Next production build against
// e2e/fake-backend.mjs, at iPhone and Pixel sizes. Both run on Chromium
// (device metrics, touch and UA only) so CI needs a single browser.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${FRONT_PORT}`,
    locale: 'es-SV',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'iphone',
      use: { ...devices['iPhone 13'], browserName: 'chromium' }
    },
    { name: 'pixel', use: { ...devices['Pixel 7'] } }
  ],
  webServer: [
    {
      command: 'node e2e/fake-backend.mjs',
      port: BACKEND_PORT,
      env: { FAKE_BACKEND_PORT: String(BACKEND_PORT) },
      reuseExistingServer: !process.env.CI
    },
    {
      // Expects a prior `pnpm build` (CI does it as its own step).
      command: `npx next start -p ${FRONT_PORT}`,
      port: FRONT_PORT,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        API_INTERNAL_URL: `http://localhost:${BACKEND_PORT}/api`,
        NEXT_PUBLIC_API_URL: `http://localhost:${BACKEND_PORT}/api`,
        NEXTAUTH_URL: `http://localhost:${FRONT_PORT}`,
        NEXTAUTH_URL_INTERNAL: `http://localhost:${FRONT_PORT}`,
        NEXTAUTH_SECRET: 'playwright-only-secret'
      }
    }
  ]
})
