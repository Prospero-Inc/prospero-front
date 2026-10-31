import { Button, Flex, Text, useToast } from '@chakra-ui/react'
import { Serwist } from '@serwist/window'
import { useTranslation } from 'next-i18next'
import { useEffect } from 'react'

const TOAST_ID = 'sw-update'

/**
 * Registers the service worker (public/sw.js, built from src/sw.ts) and,
 * when a new version is waiting, offers to switch to it instead of the old
 * silent `skipWaiting`, which could swap code under a half-filled form.
 * Production only: there is no service worker in `next dev`.
 */
export const ServiceWorkerUpdater = () => {
  const toast = useToast()
  const { t } = useTranslation('common')

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const serwist = new Serwist('/sw.js', { scope: '/', type: 'classic' })

    const activateUpdate = () => {
      // Reload once the new worker controls the page, so code and cache match.
      serwist.addEventListener('controlling', () => window.location.reload())
      serwist.messageSkipWaiting()
    }

    serwist.addEventListener('waiting', () => {
      if (toast.isActive(TOAST_ID)) return
      toast({
        id: TOAST_ID,
        duration: null,
        position: 'bottom',
        render: ({ onClose }) => (
          <Flex
            bg="primary.500"
            color="white"
            p={4}
            borderRadius="lg"
            align="center"
            gap={3}
            boxShadow="lg"
          >
            <Text flex={1}>{t('swUpdate.text')}</Text>
            <Button
              size="sm"
              colorScheme="whiteAlpha"
              onClick={() => {
                onClose()
                activateUpdate()
              }}
            >
              {t('swUpdate.action')}
            </Button>
          </Flex>
        )
      })
    })

    serwist.register().catch(error => {
      console.error('Service worker registration failed', error)
    })
  }, [toast, t])

  return null
}
