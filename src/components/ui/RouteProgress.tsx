import { Box, Progress, VisuallyHidden } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'

/**
 * Barra fina arriba de la pantalla mientras se navega. Acompaña al skeleton
 * de la página de destino y es lo único que se ve cuando se recarga la
 * misma página (p. ej. al cambiar de período en Gastos), donde un skeleton
 * de pantalla completa sería un salto innecesario. El estado lo maneja
 * `useRouteLoading`.
 */
export const RouteProgress = ({ isLoading }: { isLoading: boolean }) => {
  const { t } = useTranslation('common')

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
