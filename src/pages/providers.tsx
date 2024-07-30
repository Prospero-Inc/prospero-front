'use-client'

import fetcher from '@/lib/fetcher'
import { theme } from '@/themes'
import { CacheProvider } from '@chakra-ui/next-js'
import { ChakraProvider } from '@chakra-ui/react'
import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { SWRConfig } from 'swr'

const options = {
  refreshInterval: 30000,
  fetcher
}
export function Providers({
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
