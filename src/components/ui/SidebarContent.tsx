import {
  BoxProps,
  useBreakpointValue,
  useColorModeValue,
  Flex,
  Icon,
  CloseButton,
  Box,
  Text
} from '@chakra-ui/react'
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
  { name: 'Dashboard', icon: BsStopCircle, route: '/dashboard' },
  { name: 'Ingresos', icon: EntryIcon, route: '/entries' },
  { name: 'Egresos', icon: EgressIcon, route: '/expenditures' },
  { name: 'Metas', icon: GoalsIcon, route: '/goals' },
  { name: 'Calculadora 50/30/20', icon: BagIcon, route: '/budget-calculator' },
  { name: 'Configuraciones', icon: SettingsIcon, route: '/settings' }
]
interface SidebarProps extends BoxProps {
  onClose: () => void
}

export const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
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
      transition="3s ease"
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
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
          {link.name}
        </NavItem>
      ))}
    </Box>
  )
}
