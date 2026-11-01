import { useEffect, useState } from 'react'

/** Whether the browser says it has a connection, kept up to date. Starts
 * as online so the server render and the first client render agree. */
export const useIsOnline = () => {
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return isOnline
}
