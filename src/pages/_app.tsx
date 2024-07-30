import '@/styles/globals.css'
import { appWithTranslation } from 'next-i18next'
import type { AppProps } from 'next/app'

import { Providers } from './providers'

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <Providers session={session}>
      <Component {...pageProps} />
    </Providers>
  )
}

export default appWithTranslation(App)
