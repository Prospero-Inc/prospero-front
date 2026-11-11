import { useEffect, useState } from 'react'

/** The Wallet "Transaction" automation of the Shortcuts app is iPhone-only
 * (iOS 17+), so iPad and desktop browsers don't count. */
export const isIphone = (): boolean =>
  typeof navigator !== 'undefined' && /iPhone/.test(navigator.userAgent)

/**
 * `null` until mounted: the page is prerendered, so reading the user agent
 * while rendering would differ between the server and the browser.
 */
export const useIsIphone = (): boolean | null => {
  const [value, setValue] = useState<boolean | null>(null)
  useEffect(() => setValue(isIphone()), [])
  return value
}
