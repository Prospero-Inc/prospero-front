import { ChevronRightIcon, CloseIcon } from '@/components/icons/app'
import { useAppShellTitle } from '@/components/layouts/shell/AppShellTitle'
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
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { FiChevronDown } from 'react-icons/fi'
import { GoSun, GoMoon } from 'react-icons/go'

import { SwitchLanguage } from './SwitchLanguage'

type MobileProps = FlexProps
/**
 * Top bar. Phone: 56 px with just the screen title and the avatar menu
 * (language and dark mode live in "Más"). Desktop: the same controls as
 * before, next to the side menu.
 */
export const MobileNav = (props: MobileProps) => {
  const router = useRouter()
  const { colorMode, toggleColorMode } = useColorMode()
  const { t } = useTranslation('mobileNav')
  const { data: session, status } = useSession()
  const { title, greeting, trailing = 'avatar', back } = useAppShellTitle()
  const closeHref =
    typeof trailing === 'object' && 'closeHref' in trailing
      ? trailing.closeHref
      : null
  const action =
    typeof trailing === 'object' && 'action' in trailing
      ? trailing.action
      : null
  if (status === 'loading') return null

  const handleChangeColorMode = () => {
    toggleColorMode()
  }
  const handleClick = () => {
    router.push('/settings/profile')
  }
  const handleSettingsClick = () => {
    router.push('/more')
  }
  const themeToggleLabel =
    colorMode === 'light' ? t('toggleToDarkMode') : t('toggleToLightMode')

  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height={{ base: '14', md: '20' }}
      position="sticky"
      top={0}
      zIndex="sticky"
      alignItems="center"
      bg={{ base: 'bg.canvas', md: 'bg.surface' }}
      borderBottomWidth={{ base: 0, md: '1px' }}
      borderBottomColor="border.subtle"
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      {...props}
    >
      {back && (
        <>
          {/* design .navbar: "‹ Más" on the left, title centered. */}
          <Flex
            as={NextLink}
            href={back.href}
            align="center"
            gap="2px"
            h="44px"
            ml="-6px"
            mr="auto"
            color="brand.text"
            fontSize="15px"
            fontWeight={600}
            _focusVisible={{ boxShadow: 'outline', outline: 'none' }}
          >
            <ChevronRightIcon boxSize="22px" transform="rotate(180deg)" />
            {back.label}
          </Flex>
          <Text
            as="h1"
            display={{ base: 'block', md: 'none' }}
            position="absolute"
            left="50%"
            transform="translateX(-50%)"
            maxW="50%"
            fontSize="16px"
            fontWeight="bold"
            color="text.primary"
            noOfLines={1}
          >
            {title}
          </Text>
        </>
      )}
      <Box display={{ base: back ? 'none' : 'block', md: 'none' }} minW={0}>
        {greeting && (
          <Text fontSize="13px" fontWeight="medium" color="text.secondary">
            {greeting}
          </Text>
        )}
        <Text
          as="h1"
          fontSize="20px"
          fontWeight="bold"
          lineHeight="short"
          color="text.primary"
          noOfLines={1}
        >
          {title}
        </Text>
      </Box>
      <HStack spacing={{ base: '0', md: '6' }}>
        <IconButton
          display={{ base: 'none', md: 'flex' }}
          size="lg"
          variant="ghost"
          aria-label={themeToggleLabel}
          icon={colorMode === 'light' ? <GoSun /> : <GoMoon />}
          onClick={handleChangeColorMode}
        />
        <Box display={{ base: 'none', md: 'block' }}>
          <SwitchLanguage />
        </Box>
        {action && (
          <Button
            type="submit"
            form={action.form}
            variant="ghost"
            px="8px"
            mr="-8px"
            color="brand.text"
            fontSize="15px"
            fontWeight={600}
            isDisabled={action.isDisabled}
            isLoading={action.isLoading}
          >
            {action.label}
          </Button>
        )}
        {closeHref && (
          <IconButton
            as={NextLink}
            href={closeHref}
            display={{ base: 'flex', md: 'none' }}
            aria-label={t('close')}
            icon={<CloseIcon boxSize="16px" />}
            boxSize="36px"
            minW="36px"
            borderRadius="full"
            bg="button.soft"
            color="text.primary"
          />
        )}
        {/* Phone: only the screens that keep the avatar show it (Más and
            sub-screens like Por revisar don't, per the design). */}
        <Flex
          alignItems={'center'}
          display={{
            base: trailing === 'avatar' ? 'flex' : 'none',
            md: 'flex'
          }}
        >
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
                {/* Initials in the brand's colors, as in the design (Chakra's
                    default picks a random color per name). */}
                <Avatar
                  name={session?.user?.name ?? undefined}
                  boxSize="36px"
                  bg="brand.subtle"
                  color="brand.text"
                  fontWeight="bold"
                  sx={{ '& > div': { fontSize: '14px' } }}
                />
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
