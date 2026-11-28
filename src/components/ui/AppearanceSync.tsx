import { readAppearance } from '@/hooks/useAppearance'
import { useColorMode } from '@chakra-ui/react'
import { useEffect } from 'react'

/**
 * Renders nothing. With "Automático", applies the phone's mode on start and
 * each time the app comes back to the foreground — not on live changes:
 * iOS reports both modes while the installed app goes to the background
 * (e.g. pulling down Notification Center), which flipped the app.
 */
export const AppearanceSync = () => {
  const { setColorMode } = useColorMode()

  useEffect(() => {
    const follow = () => {
      if (
        document.visibilityState === 'visible' &&
        readAppearance() === 'system'
      )
        setColorMode('system')
    }
    follow()
    document.addEventListener('visibilitychange', follow)
    return () => document.removeEventListener('visibilitychange', follow)
  }, [setColorMode])

  return null
}
