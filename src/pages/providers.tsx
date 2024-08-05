'use-client'

import fetcher from '@/lib/fetcher'
import { theme } from '@/themes'
import { CacheProvider } from '@chakra-ui/next-js'
import { ChakraProvider } from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { SWRConfig } from 'swr'

const options = {
  refreshInterval: 30000,
  fetcher
}
export default function Providers({
  children,
  session
}: {
  children: React.ReactNode
  session: Session | null
}) {
  return (
    <SessionProvider session={session}>
      <CacheProvider>
        <SWRConfig value={options}>
          <ChakraProvider
            theme={theme}
            toastOptions={{
              defaultOptions: {
                isClosable: true,
                duration: 3000
              }
            }}
          >
            {children}
          </ChakraProvider>
        </SWRConfig>
      </CacheProvider>
    </SessionProvider>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale as string, [
        'common',
        'sidebar',
        'mobileNav'
      ]))
    }
  }
}
