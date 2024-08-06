import '@/styles/globals.css'
import { CookiesEnum } from '@/enums'
import { cookiesPlugin } from '@/plugins'
import { theme } from '@/themes'
import { ChakraProvider } from '@chakra-ui/react'
import { SessionProvider } from 'next-auth/react'
import { appWithTranslation } from 'next-i18next'
import { useTranslation } from 'next-i18next'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const { i18n } = useTranslation('common')
  const router = useRouter()
  const changelanguage = async () => {
    const lang = cookiesPlugin.getName(CookiesEnum.NEXT_LOCALE)

    if (!lang) cookiesPlugin.setName(CookiesEnum.NEXT_LOCALE, 'en')

    await i18n.changeLanguage(lang ?? 'en')
    router.push(router.asPath, router.asPath, { locale: lang ?? 'en' })
  }
  useEffect(() => {
    changelanguage()
  }, [])

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
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </ChakraProvider>
  )
}

export default appWithTranslation(App)
