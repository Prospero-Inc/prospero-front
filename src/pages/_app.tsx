import '@/styles/globals.css'
import type { AppProps } from 'next/app'

import { Providers } from './providers'

export default function App({
  Component,
  pageProps: { session, ...pageProps }
}: AppProps) {
  return (
    <Providers session={session}>
      <Component {...pageProps} />
    </Providers>
  )
}
