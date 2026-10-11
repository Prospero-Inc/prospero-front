import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
import { ReviewQueueSummary } from '@/services/reviewQueue'
import {
  BoxProps,
  useBreakpointValue,
  Flex,
  Icon,
  CloseButton,
  Box,
  Text,
  useColorMode
} from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { IconType } from 'react-icons'
import { BsStopCircle } from 'react-icons/bs'

import { EntryIcon } from '../icons'
import { BagIcon } from '../icons/BagIcon'
import { EgressIcon } from '../icons/EgressIcon'
import { FixedExpenseIcon } from '../icons/FixedExpenseIcon'
import { GoalsIcon } from '../icons/GoalsIcon'
import { SettingsIcon } from '../icons/SettingsIcon'
import { Brand } from './Brand'
import { NavItem } from './NavItem'

const emptySummary: ReviewQueueSummary = {
  pendingTransactions: 0,
  pendingSalaries: 0
}

interface LinkItemProps {
  name: string
  icon: IconType
  route: string
  /** Si está presente, este item muestra un badge con
   * `summary[badgeKey]` y usa `badgeAriaKey` para el texto accesible. */
  badgeKey?: keyof ReviewQueueSummary
  badgeAriaKey?: string
}
const LinkItems: Array<LinkItemProps> = [
  { name: 'dashboard', icon: BsStopCircle, route: '/dashboard' },
  {
    name: 'entries',
    icon: EntryIcon,
    route: '/entries',
    badgeKey: 'pendingSalaries',
    badgeAriaKey: 'pendingBadgeEntries'
  },
  {
    name: 'expenditures',
    icon: EgressIcon,
    route: '/expenditures',
    badgeKey: 'pendingTransactions',
    badgeAriaKey: 'pendingBadgeExpenditures'
  },
  { name: 'fixedExpenses', icon: FixedExpenseIcon, route: '/fixed-expenses' },
  { name: 'goals', icon: GoalsIcon, route: '/goals' },
  { name: 'budgetCalculator', icon: BagIcon, route: '/budget-calculator' },
  { name: 'settings', icon: SettingsIcon, route: '/settings' }
]
interface SidebarProps extends BoxProps {
  onClose: () => void
}

export const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
  const { colorMode } = useColorMode()
  const { t } = useTranslation('sidebar')
  const router = useRouter()
  const { data: session } = useSession()
  const [summary, setSummary] = useState<ReviewQueueSummary>(emptySummary)
  const variant = useBreakpointValue(
    {
      base: 'center',
      md: 'flex-start',
      sm: 'flex-start'
    },
    {
      // Breakpoint to use when mediaqueries cannot be used, such as in server-side rendering
      // (Defaults to 'base')
      fallback: 'md'
    }
  )

  // Sincroniza el badge de pendientes con el backend: al montar y cada vez
  // que termina una navegación client-side (ej. confirmar un pendiente en
  // entries/expenditures hace router.replace, que dispara esto de nuevo).
  useEffect(() => {
    if (!session?.accessToken) return

    let isMounted = true
    const fetchSummary = async () => {
      try {
        const data = await localApiService.request<ReviewQueueSummary>({
          endPoint: '/proxy/get-review-queue-summary',
          method: HttpMethod.GET,
          headers: { Authorization: `Bearer ${session.accessToken}` }
        })
        if (isMounted) setSummary(data)
      } catch (error) {
        // El badge es informativo; si falla, simplemente no se muestra.
      }
    }

    fetchSummary()
    router.events.on('routeChangeComplete', fetchSummary)
    return () => {
      isMounted = false
      router.events.off('routeChangeComplete', fetchSummary)
    }
  }, [session?.accessToken, router.events])

  return (
    <Box
      // transition="2s ease"
      // bg={colorMode === 'dark' ? 'gray.900' : 'white'}
      borderRight="1px"
      borderRightColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems={variant} mx="8" justifyContent={variant}>
        <Text fontFamily="monospace" pr={3} fontWeight="bold">
          <Icon as={Brand} />
        </Text>
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>
      {LinkItems.map(link => {
        const badgeCount = link.badgeKey ? summary[link.badgeKey] : undefined
        const badgeAriaLabel =
          link.badgeAriaKey && badgeCount
            ? t(link.badgeAriaKey, { count: badgeCount })
            : undefined

        return (
          <NavItem
            key={link.name}
            icon={link.icon}
            path={link.route}
            badgeCount={badgeCount}
            badgeAriaLabel={badgeAriaLabel}
          >
            {t(`${link.name}`)}
          </NavItem>
        )
      })}
    </Box>
  )
}
