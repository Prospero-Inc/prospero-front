import '@/styles/globals.css'
import { ProsperoLayout } from '@/components/layouts'
import { SessionWatcher } from '@/components/ui'
import { getPageSkeleton } from '@/components/ui/PageSkeletons'
import { RouteProgress } from '@/components/ui/RouteProgress'
import {
  PendingRouteContext,
  RouteLoadingContext,
  useRouteLoading
} from '@/hooks/useRouteLoading'
import { theme } from '@/themes'
import { ChakraProvider } from '@chakra-ui/react'
import { SessionProvider } from 'next-auth/react'
import { appWithTranslation, useTranslation } from 'next-i18next'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter()
  const { t } = useTranslation('common')
  const routeLoading = useRouteLoading()
  const { isLoading, targetPathname } = routeLoading
  // Al ir a otra pantalla, se muestra enseguida su skeleton (dentro del
  // layout real, con el menú) en vez de dejar la pantalla vieja quieta
  // mientras llegan los datos. Recargar la misma pantalla (cambiar de
  // período, guardar) solo muestra la barra: un skeleton ahí sería un salto.
  const PageSkeleton =
    isLoading && targetPathname && targetPathname !== router.pathname
      ? getPageSkeleton(targetPathname)
      : null

  // El idioma lo resuelve el middleware a partir de la cookie NEXT_LOCALE
  // (ver `middleware.ts`) antes de renderizar: acá antes se cambiaba del
  // lado del cliente después del primer render, lo que hacía "saltar" de
  // idioma y forzaba inglés a quien entraba por primera vez.
  return (
    <ChakraProvider
      theme={theme}
      toastOptions={{
        defaultOptions: {
          isClosable: true,
          duration: 3000
        }
      }}
    >
      <SessionProvider session={session} refetchInterval={60}>
        <SessionWatcher />
        <RouteProgress isLoading={isLoading} />
        <RouteLoadingContext.Provider value={routeLoading}>
          <PendingRouteContext.Provider
            value={PageSkeleton ? targetPathname : null}
          >
            {PageSkeleton ? (
              <ProsperoLayout title={t('routeLoading')} pageDescription="">
                <PageSkeleton />
              </ProsperoLayout>
            ) : (
              <Component {...pageProps} />
            )}
          </PendingRouteContext.Provider>
        </RouteLoadingContext.Provider>
      </SessionProvider>
    </ChakraProvider>
  )
}

export default appWithTranslation(App)
