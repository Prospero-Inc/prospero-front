import { MobileNav } from '@/components/ui/MobileNav'
import { SidebarContent } from '@/components/ui/SidebarContent'
import { Box } from '@chakra-ui/react'
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
  '/more'
]

export const usesAppShell = (pathname: string): boolean =>
  APP_SHELL_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  )

/** Height the content leaves free above the phone tab bar. */
const TAB_BAR_SPACE = 'calc(72px + env(safe-area-inset-bottom))'

/**
 * Mounted once in _app for every app route, so navigating swaps only the
 * page: the side menu (desktop), top bar and tab bar (phone) stay put
 * instead of remounting on every screen.
 */
export const AppShell = ({ children }: { children: ReactNode }) => (
  <Box minH="100dvh" bg="bg.canvas">
    <SidebarContent display={{ base: 'none', md: 'block' }} />
    <MobileNav />
    <Box
      ml={{ base: 0, md: 60 }}
      p={{ base: 0, md: 4 }}
      pb={{ base: TAB_BAR_SPACE, md: 4 }}
    >
      {children}
    </Box>
    <BottomTabBar display={{ base: 'flex', md: 'none' }} />
  </Box>
)
