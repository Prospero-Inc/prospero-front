import {
  CalendarRepeatIcon,
  HomeIcon,
  ListIcon,
  MoreIcon,
  PlusIcon
} from '@/components/icons/app'
import { useOpenQuickAdd } from '@/components/quick-add'
import { useApi } from '@/lib/useApi'
import type { ReviewQueueSummary } from '@/services/reviewQueue'
import { Box, Flex, type FlexProps, IconProps, Text } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import type { ComponentType } from 'react'

interface Tab {
  key: 'home' | 'movements' | 'fixed' | 'more'
  href: string
  icon: ComponentType<IconProps>
  /** Other routes that light this tab up. */
  matches: string[]
}

const TABS: [Tab, Tab, Tab, Tab] = [
  { key: 'home', href: '/dashboard', icon: HomeIcon, matches: ['/dashboard'] },
  {
    key: 'movements',
    href: '/movements',
    icon: ListIcon,
    matches: ['/movements', '/review', '/expenditures', '/entries']
  },
  {
    key: 'fixed',
    href: '/fixed-expenses',
    icon: CalendarRepeatIcon,
    matches: ['/fixed-expenses']
  },
  {
    key: 'more',
    href: '/more',
    icon: MoreIcon,
    matches: ['/more', '/settings', '/budget-calculator', '/goals']
  }
]

/**
 * Phone navigation, as drawn in docs/diseno-mobile.html: Inicio ·
 * Movimientos (pending count) · "+" · Fijos · Más. Desktop keeps the side
 * menu.
 */
export const BottomTabBar = (props: FlexProps) => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const openQuickAdd = useOpenQuickAdd()
  const { data: summary } = useApi<ReviewQueueSummary>('review-queue/summary')
  const pending =
    (summary?.pendingTransactions ?? 0) + (summary?.pendingSalaries ?? 0)

  const isActive = (tab: Tab) =>
    tab.matches.some(
      route =>
        router.pathname === route || router.pathname.startsWith(`${route}/`)
    )

  const renderTab = (tab: Tab) => {
    const active = isActive(tab)
    const TabIcon = tab.icon
    return (
      <Flex
        key={tab.key}
        as={NextLink}
        href={tab.href}
        aria-current={active ? 'page' : undefined}
        direction="column"
        align="center"
        w="64px"
        minH="48px"
        gap={1}
        position="relative"
        color={active ? 'tab.active' : 'tab.inactive'}
        _hover={{ textDecoration: 'none' }}
      >
        <TabIcon boxSize="26px" />
        {tab.key === 'movements' && pending > 0 && (
          <Box
            position="absolute"
            top="-3px"
            left="38px"
            minW="18px"
            h="18px"
            px="5px"
            borderRadius="9px"
            bg="status.pendingSolid"
            color="white"
            fontSize="10.5px"
            fontWeight="bold"
            display="grid"
            placeItems="center"
            aria-label={t('tabBar.pending', { count: pending })}
          >
            {pending}
          </Box>
        )}
        <Text fontSize="11px" fontWeight="semibold" lineHeight="short">
          {t(`tabBar.${tab.key}`)}
        </Text>
      </Flex>
    )
  }

  return (
    <Flex
      as="nav"
      aria-label={t('tabBar.label')}
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex="sticky"
      bg="tabbar.bg"
      backdropFilter="saturate(180%) blur(12px)"
      borderTopWidth="1px"
      borderColor="border.subtle"
      justify="space-around"
      align="flex-start"
      pt={2}
      px="6px"
      pb="calc(8px + env(safe-area-inset-bottom))"
      {...props}
    >
      {renderTab(TABS[0])}
      {renderTab(TABS[1])}
      <Box
        as="button"
        type="button"
        onClick={openQuickAdd}
        aria-label={t('tabBar.add')}
        w="56px"
        h="56px"
        mt="-2px"
        borderRadius="18px"
        bg="brand.solid"
        color="white"
        display="grid"
        placeItems="center"
        boxShadow="0 8px 18px -6px rgba(83,82,237,.7)"
        _active={{ transform: 'scale(0.96)' }}
      >
        <PlusIcon boxSize="28px" />
      </Box>
      {renderTab(TABS[2])}
      {renderTab(TABS[3])}
    </Flex>
  )
}
