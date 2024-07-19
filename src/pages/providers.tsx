// app/providers.tsx
import fetcher from '@/lib/fetcher'
import { theme } from '@/themes'
import { CacheProvider } from '@chakra-ui/next-js'
import { ChakraProvider } from '@chakra-ui/react'
import { SWRConfig } from 'swr'
const options = {
  refreshInterval: 30000,
  fetcher
}
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <SWRConfig value={options}>
        <ChakraProvider theme={theme}>{children}</ChakraProvider>
      </SWRConfig>
    </CacheProvider>
  )
}
