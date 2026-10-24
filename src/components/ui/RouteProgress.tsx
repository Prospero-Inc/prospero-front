import { Box, Progress, VisuallyHidden } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

/** Navegaciones más rápidas que esto no muestran nada: una barra que
 * aparece y desaparece en un parpadeo distrae más de lo que informa. */
const SHOW_DELAY_MS = 150

/**
 * Barra de progreso global arriba de la pantalla mientras se navega a otra
 * página. Todas las páginas cargan sus datos en `getServerSideProps`, así
 * que al tocar un link Next espera esa respuesta antes de cambiar de
 * pantalla: sin esto, durante esa espera parecía que el clic no hizo nada.
 *
 * Las navegaciones shallow (los filtros de Gastos/Ingresos) se ignoran: no
 * cargan datos y son instantáneas.
 */
export const RouteProgress = () => {
  const router = useRouter()
  const { t } = useTranslation('common')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined

    const start = (_url: string, { shallow }: { shallow: boolean }) => {
      if (shallow) return
      clearTimeout(timeout)
      timeout = setTimeout(() => setIsLoading(true), SHOW_DELAY_MS)
    }
    const done = () => {
      clearTimeout(timeout)
      setIsLoading(false)
    }

    router.events.on('routeChangeStart', start)
    router.events.on('routeChangeComplete', done)
    router.events.on('routeChangeError', done)
    return () => {
      clearTimeout(timeout)
      router.events.off('routeChangeStart', start)
      router.events.off('routeChangeComplete', done)
      router.events.off('routeChangeError', done)
    }
  }, [router.events])

  if (!isLoading) return null

  return (
    <Box position="fixed" top={0} left={0} right={0} zIndex="banner">
      <Progress
        size="xs"
        isIndeterminate
        colorScheme="primary"
        bg="transparent"
        aria-label={t('routeLoading')}
        sx={{
          // Sin animación para quien la desactivó en el sistema: la barra
          // fija igual comunica que algo está cargando.
          '@media (prefers-reduced-motion: reduce)': {
            '& > div': { animation: 'none', width: '100%' }
          }
        }}
      />
      <VisuallyHidden role="status">{t('routeLoading')}</VisuallyHidden>
    </Box>
  )
}
