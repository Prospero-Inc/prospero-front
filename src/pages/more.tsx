import { ProsperoLayout } from '@/components/layouts'
import { SwitchLanguage } from '@/components/ui'
import { Profile } from '@/interfaces'
import { signOutAndUnsubscribePush } from '@/lib/signOutAndUnsubscribePush'
import { useApi } from '@/lib/useApi'
import {
  Avatar,
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  LinkBox,
  LinkOverlay,
  Stack,
  Switch,
  Text,
  useColorMode
} from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import NextLink from 'next/link'
import type { ReactNode } from 'react'
import type { IconType } from 'react-icons'
import {
  MdCalculate,
  MdChevronRight,
  MdLock,
  MdMail,
  MdNotifications,
  MdPieChart
} from 'react-icons/md'

const percent = (value: number) => Math.round(value * 100)

/** One tappable row: icon, label, optional value, chevron. 56 px tall. */
const LinkRow = ({
  href,
  icon,
  label,
  value
}: {
  href: string
  icon: IconType
  label: string
  value?: string
}) => (
  <LinkBox
    as={Flex}
    align="center"
    gap={3}
    minH="56px"
    px={4}
    _hover={{ bg: 'bg.subtle' }}
  >
    <Icon as={icon} boxSize={5} color="brand.text" />
    <LinkOverlay as={NextLink} href={href} flex={1} color="text.primary">
      {label}
    </LinkOverlay>
    {value && (
      <Text color="text.secondary" fontSize="sm">
        {value}
      </Text>
    )}
    <Icon as={MdChevronRight} boxSize={5} color="text.secondary" />
  </LinkBox>
)

const Section = ({
  title,
  children
}: {
  title: string
  children: ReactNode
}) => (
  <Box>
    <Heading
      as="h2"
      fontSize="sm"
      fontWeight="semibold"
      color="text.secondary"
      textTransform="uppercase"
      letterSpacing="wide"
      mb={2}
      px={1}
    >
      {title}
    </Heading>
    <Stack
      spacing={0}
      bg="bg.surface"
      borderRadius="16px"
      borderWidth="1px"
      borderColor="border.subtle"
      overflow="hidden"
      divider={<Box borderBottomWidth="1px" borderColor="border.subtle" />}
    >
      {children}
    </Stack>
  </Box>
)

/**
 * "Más" tab (docs/diseno-mobile.html): the occasional things — profile,
 * connections, notifications, security, preferences, sign out — that used
 * to be split between the side menu, the top bar and a long settings page.
 */
export default function MorePage() {
  const { t } = useTranslation('common')
  const { colorMode, toggleColorMode } = useColorMode()
  const { data: session } = useSession()
  const { data } = useApi<{ user: Profile }>('auth/profile')
  const profile = data?.user

  const splitSummary = profile?.payFrequency
    ? `${t(`more.payFrequency.${profile.payFrequency}`)} · ${percent(
        profile.needsPercent
      )} / ${percent(profile.wantsPercent)} / ${percent(
        profile.savingsPercent
      )}`
    : ''

  return (
    <ProsperoLayout title={t('more.title')} pageDescription={t('more.title')}>
      <Stack spacing={6} maxW="lg" pb={4}>
        <LinkBox
          as={Flex}
          align="center"
          gap={4}
          p={4}
          bg="bg.surface"
          borderRadius="16px"
          borderWidth="1px"
          borderColor="border.subtle"
        >
          <Avatar
            name={
              profile ? `${profile.firstName} ${profile.lastName}` : undefined
            }
          />
          <Box flex={1} minW={0}>
            <LinkOverlay as={NextLink} href="/profile">
              <Text fontWeight="bold" color="text.primary" noOfLines={1}>
                {profile ? `${profile.firstName} ${profile.lastName}` : ' '}
              </Text>
            </LinkOverlay>
            <Text fontSize="sm" color="text.secondary" noOfLines={1}>
              {splitSummary}
            </Text>
          </Box>
          <Icon as={MdChevronRight} boxSize={5} color="text.secondary" />
        </LinkBox>

        <Section title={t('more.sections.connections')}>
          <LinkRow
            href="/settings#gmail"
            icon={MdMail}
            label={t('more.gmail')}
          />
          <LinkRow
            href="/settings#notifications"
            icon={MdNotifications}
            label={t('more.notifications')}
          />
        </Section>

        <Section title={t('more.sections.account')}>
          <LinkRow
            href="/settings#budget"
            icon={MdPieChart}
            label={t('more.budget')}
          />
          <LinkRow
            href="/profile"
            icon={MdLock}
            label={t('more.security')}
            value={
              profile
                ? t(profile.enable2FA ? 'more.twoFaOn' : 'more.twoFaOff')
                : undefined
            }
          />
          <LinkRow
            href="/budget-calculator"
            icon={MdCalculate}
            label={t('more.calculator')}
          />
        </Section>

        <Section title={t('more.sections.preferences')}>
          <Flex align="center" justify="space-between" minH="56px" px={4}>
            <Text color="text.primary">{t('more.language')}</Text>
            <SwitchLanguage />
          </Flex>
          <Flex align="center" justify="space-between" minH="56px" px={4}>
            <Text as="label" htmlFor="dark-mode" color="text.primary">
              {t('more.darkMode')}
            </Text>
            <Switch
              id="dark-mode"
              size="lg"
              isChecked={colorMode === 'dark'}
              onChange={toggleColorMode}
            />
          </Flex>
        </Section>

        <Button
          variant="outline"
          colorScheme="red"
          onClick={() =>
            signOutAndUnsubscribePush(session?.accessToken, { redirect: true })
          }
        >
          {t('more.signOut')}
        </Button>
      </Stack>
    </ProsperoLayout>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale as string, [
      'common',
      'sidebar',
      'mobileNav'
    ]))
  }
})
