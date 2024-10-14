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
import { useTranslation } from 'next-i18next'
import { IconType } from 'react-icons'
import { BsStopCircle } from 'react-icons/bs'

import { EntryIcon } from '../icons'
import { BagIcon } from '../icons/BagIcon'
import { EgressIcon } from '../icons/EgressIcon'
import { GoalsIcon } from '../icons/GoalsIcon'
import { SettingsIcon } from '../icons/SettingsIcon'
import { Brand } from './Brand'
import { NavItem } from './NavItem'
interface LinkItemProps {
  name: string
  icon: IconType
  route: string
}
const LinkItems: Array<LinkItemProps> = [
  { name: 'dashboard', icon: BsStopCircle, route: '/dashboard' },
  { name: 'entries', icon: EntryIcon, route: '/entries' },
  { name: 'expenditures', icon: EgressIcon, route: '/expenditures' },
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
      {LinkItems.map(link => (
        <NavItem key={link.name} icon={link.icon} path={link.route}>
          {t(`${link.name}`)}
        </NavItem>
      ))}
    </Box>
  )
}
