import { useOpenQuickAdd } from '@/components/quick-add'
import { useApi } from '@/lib/useApi'
import type { ReviewQueueSummary } from '@/services/reviewQueue'
import {
  Badge,
  Box,
  Flex,
  Icon,
  IconButton,
  Text,
  type FlexProps
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import type { IconType } from 'react-icons'
import {
  MdAdd,
  MdEventRepeat,
  MdHome,
  MdMoreHoriz,
  MdSwapVert
} from 'react-icons/md'

interface Tab {
  key: 'home' | 'movements' | 'fixed' | 'more'
  href: string
  icon: IconType
  /** Other routes that light this tab up. */
  matches: string[]
}

const TABS: [Tab, Tab, Tab, Tab] = [
  { key: 'home', href: '/dashboard', icon: MdHome, matches: ['/dashboard'] },
  {
    key: 'movements',
    href: '/movements',
    icon: MdSwapVert,
    matches: ['/movements', '/review', '/expenditures', '/entries']
  },
  {
    key: 'fixed',
    href: '/fixed-expenses',
    icon: MdEventRepeat,
    matches: ['/fixed-expenses']
  },
  {
    key: 'more',
    href: '/more',
    icon: MdMoreHoriz,
    matches: ['/more', '/settings', '/profile', '/budget-calculator', '/goals']
  }
]

/**
 * Phone navigation (docs/diseno-mobile.html): five destinations at thumb
 * height — Inicio · Movimientos (with the pending count) · "+" · Fijos ·
 * Más. Desktop keeps the side menu.
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
    return (
      <Flex
        key={tab.key}
        as={NextLink}
        href={tab.href}
        aria-current={active ? 'page' : undefined}
        direction="column"
        align="center"
        justify="center"
        flex={1}
        minH="56px"
        gap={0.5}
        position="relative"
        color={active ? 'brand.text' : 'text.secondary'}
        _hover={{ textDecoration: 'none' }}
      >
        <Box position="relative">
          <Icon as={tab.icon} boxSize={6} />
          {tab.key === 'movements' && pending > 0 && (
            <Badge
              position="absolute"
              top={-1}
              right={-3}
              borderRadius="full"
              bg="status.pending"
              color="white"
              fontSize="2xs"
              aria-label={t('tabBar.pending', { count: pending })}
            >
              {pending}
            </Badge>
          )}
        </Box>
        <Text fontSize="xs" fontWeight={active ? 'semibold' : 'normal'}>
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
      bg="bg.surface"
      borderTopWidth="1px"
      borderColor="border.subtle"
      align="center"
      px={2}
      pb="env(safe-area-inset-bottom)"
      {...props}
    >
      {renderTab(TABS[0])}
      {renderTab(TABS[1])}
      <Flex flex={1} justify="center">
        <IconButton
          onClick={openQuickAdd}
          aria-label={t('tabBar.add')}
          icon={<Icon as={MdAdd} boxSize={7} />}
          isRound
          w="52px"
          h="52px"
          minW="52px"
          bg="brand.solid"
          color="white"
          boxShadow="md"
          _hover={{ bg: 'primary.600' }}
        />
      </Flex>
      {renderTab(TABS[2])}
      {renderTab(TABS[3])}
    </Flex>
  )
}
