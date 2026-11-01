import { QuickAddProvider } from '@/components/quick-add'
import { MobileNav } from '@/components/ui/MobileNav'
import { SidebarContent } from '@/components/ui/SidebarContent'
import { Box } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import type { ReactNode } from 'react'

import { BottomTabBar } from './BottomTabBar'

/** Routes rendered inside the app shell (menus, tab bar). */
const APP_SHELL_ROUTES = [
  '/dashboard',
  '/expenditures',
  '/entries',
  '/fixed-expenses',
  '/goals',
  '/budget-calculator',
  '/settings',
  '/profile',
  '/more',
  '/movements',
  '/review'
]

export const usesAppShell = (pathname: string): boolean =>
  APP_SHELL_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  )

const NO_TAB_BAR_ROUTES = ['/review']

/** Height the content leaves free above the phone tab bar. */
const TAB_BAR_SPACE = 'calc(72px + env(safe-area-inset-bottom))'

/**
 * Mounted once in _app for every app route, so navigating swaps only the
 * page: the side menu (desktop), top bar and tab bar (phone) stay put
 * instead of remounting on every screen.
 */
export const AppShell = ({ children }: { children: ReactNode }) => {
  const { pathname } = useRouter()
  // Sub-screens (Por revisar) close back with the top bar's X instead.
  const hasTabBar = !NO_TAB_BAR_ROUTES.includes(pathname)
  return (
    <QuickAddProvider>
      <Box minH="100dvh" bg="bg.canvas">
        <SidebarContent display={{ base: 'none', md: 'block' }} />
        <MobileNav />
        <Box
          ml={{ base: 0, md: 60 }}
          p={{ base: 0, md: 4 }}
          pb={{ base: hasTabBar ? TAB_BAR_SPACE : 4, md: 4 }}
        >
          {children}
        </Box>
        {hasTabBar && <BottomTabBar display={{ base: 'flex', md: 'none' }} />}
      </Box>
    </QuickAddProvider>
  )
}
