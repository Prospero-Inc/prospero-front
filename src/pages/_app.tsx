import '@/styles/globals.css'
import { SessionWatcher } from '@/components/ui'
import { theme } from '@/themes'
import { ChakraProvider } from '@chakra-ui/react'
import { SessionProvider } from 'next-auth/react'
import { appWithTranslation } from 'next-i18next'
import type { AppProps } from 'next/app'

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
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
        <Component {...pageProps} />
      </SessionProvider>
    </ChakraProvider>
  )
}

export default appWithTranslation(App)
