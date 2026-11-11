/**
 * Screenshots behind "Ver con capturas" (step 3 of /settings/shortcut).
 * None exist yet, so the link stays hidden. To add one, put a portrait
 * iPhone screenshot (1179 × 2556, PNG) at `public/assets/shortcut/paso-N.png`
 * and set its `isAvailable` to true; the link shows up as soon as one is.
 * (`public/assets` isn't precached by the service worker, which is fine.)
 */
export const SHORTCUT_SCREENSHOTS: readonly {
  step: number
  path: string
  isAvailable: boolean
}[] = [
  { step: 1, path: '/assets/shortcut/paso-1.png', isAvailable: false },
  { step: 2, path: '/assets/shortcut/paso-2.png', isAvailable: false },
  { step: 3, path: '/assets/shortcut/paso-3.png', isAvailable: false }
]

export const AVAILABLE_SCREENSHOTS = SHORTCUT_SCREENSHOTS.filter(
  shot => shot.isAvailable
)

/** iPhone portrait screen. */
export const SCREENSHOT_SIZE = { width: 1179, height: 2556 } as const
