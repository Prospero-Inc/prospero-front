import { useRouter } from 'next/router'
import { createContext, useContext, useEffect, useState } from 'react'

/** Navegaciones más rápidas que esto no muestran nada: un skeleton o una
 * barra que aparece y desaparece en un parpadeo distrae más de lo que
 * informa. */
const SHOW_DELAY_MS = 150

/** "/en/expenditures?period=initial" → "/expenditures": el pathname de
 * página, comparable con `router.pathname`. */
const toPathname = (url: string, locales: string[] = []): string => {
  const path = url.split(/[?#]/)[0]
  const prefix = locales.find(
    locale => path === `/${locale}` || path.startsWith(`/${locale}/`)
  )
  const withoutLocale = prefix ? path.slice(prefix.length + 1) : path
  return withoutLocale || '/'
}

export interface RouteLoadingState {
  isLoading: boolean
  /** Página a la que se está navegando, mientras `isLoading`. */
  targetPathname: string | null
}

/**
 * Todas las páginas cargan sus datos en `getServerSideProps`: al tocar un
 * link, Next espera esa respuesta antes de cambiar de pantalla. Este hook
 * expone a dónde se está yendo durante esa espera, para mostrar enseguida
 * el skeleton de esa pantalla. Las navegaciones shallow (filtros) se
 * ignoran: no cargan datos.
 */
export const useRouteLoading = (): RouteLoadingState => {
  const router = useRouter()
  const [state, setState] = useState<RouteLoadingState>({
    isLoading: false,
    targetPathname: null
  })

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined

    const start = (url: string, { shallow }: { shallow: boolean }) => {
      if (shallow) return
      clearTimeout(timeout)
      const targetPathname = toPathname(url, router.locales)
      timeout = setTimeout(
        () => setState({ isLoading: true, targetPathname }),
        SHOW_DELAY_MS
      )
    }
    const done = () => {
      clearTimeout(timeout)
      setState({ isLoading: false, targetPathname: null })
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
  }, [router.events, router.locales])

  return state
}

/** Página de destino mientras se navega (o `null`), para que el menú
 * resalte a dónde vas y no la pantalla que estás dejando. */
export const PendingRouteContext = createContext<string | null>(null)

export const usePendingRoute = () => useContext(PendingRouteContext)
