import { signOutAndUnsubscribePush } from '@/lib/signOutAndUnsubscribePush'
import {
  FlexProps,
  Flex,
  useColorModeValue,
  IconButton,
  HStack,
  Menu,
  MenuButton,
  Avatar,
  VStack,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
  Box,
  Badge,
  Button,
  useColorMode
} from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { FiMenu, FiChevronDown } from 'react-icons/fi'
import { GoSun, GoMoon } from 'react-icons/go'

import { SwitchLanguage } from './SwitchLanguage'
interface MobileProps extends FlexProps {
  onOpen: () => void
}
export const MobileNav = ({ onOpen, ...rest }: MobileProps) => {
  const router = useRouter()
  const { colorMode, toggleColorMode } = useColorMode()
  const { t } = useTranslation('mobileNav')
  const { data: session, status } = useSession()
  if (status === 'loading') return null

  const handleChangeColorMode = () => {
    toggleColorMode()
  }
  const handleClick = () => {
    router.push('/profile')
  }
  const handleSettingsClick = () => {
    router.push('/settings')
  }
  const themeToggleLabel =
    colorMode === 'light' ? t('toggleToDarkMode') : t('toggleToLightMode')

  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue('white', 'gray.900')}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      {...rest}
    >
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        variant="outline"
        aria-label={t('openMenu')}
        icon={<FiMenu />}
      />

      <HStack spacing={{ base: '0', md: '6' }}>
        <IconButton
          size="lg"
          variant="ghost"
          aria-label={themeToggleLabel}
          icon={colorMode === 'light' ? <GoSun /> : <GoMoon />}
          onClick={handleChangeColorMode}
        />
        <SwitchLanguage />
        <Flex alignItems={'center'}>
          <Menu>
            <MenuButton
              aria-label={t('userMenu')}
              py={2}
              transition="all 0.3s"
              borderRadius="full"
              // Anillo solo con teclado (WCAG 2.4.7): los navegadores no
              // activan :focus-visible al hacer clic con el mouse.
              _focusVisible={{ boxShadow: 'outline' }}
            >
              <HStack>
                <Avatar size={'sm'} name={session?.user?.name ?? undefined} />
                <VStack
                  display={{ base: 'none', md: 'flex' }}
                  alignItems="flex-start"
                  spacing="1px"
                  ml="2"
                >
                  <Text fontSize="sm">{session?.user?.name}</Text>
                </VStack>
                <Box display={{ base: 'none', md: 'flex' }}>
                  <FiChevronDown />
                </Box>
              </HStack>
            </MenuButton>
            <MenuList
              bg={useColorModeValue('white', 'gray.900')}
              borderColor={useColorModeValue('gray.200', 'gray.700')}
            >
              <MenuItem onClick={handleClick}>{t('profile')}</MenuItem>
              <MenuItem onClick={handleSettingsClick}>{t('settings')}</MenuItem>
              <MenuItem isDisabled closeOnSelect={false}>
                <Flex align="center" justify="space-between" flex="1">
                  <Text>{t('billing')}</Text>
                  <Badge ml="2" colorScheme="gray" fontSize="2xs">
                    {t('billingComingSoon')}
                  </Badge>
                </Flex>
              </MenuItem>
              <MenuDivider />
              <MenuItem
                as={Button}
                onClick={() =>
                  signOutAndUnsubscribePush(session?.accessToken, {
                    redirect: true
                  })
                }
              >
                {t('signOut')}
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  )
}
