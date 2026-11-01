import {
  BellIcon,
  CalculatorIcon,
  CheckIcon,
  ChevronRightIcon,
  GlobeIcon,
  MailIcon,
  MoonIcon,
  ShieldIcon,
  SignOutIcon
} from '@/components/icons/app'
import { ProsperoLayout } from '@/components/layouts'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { getPageSkeleton } from '@/components/ui/PageSkeletons'
import { CookiesEnum } from '@/enums'
import { usePushSubscription } from '@/hooks/usePushSubscription'
import { Profile } from '@/interfaces'
import { signOutAndUnsubscribePush } from '@/lib/signOutAndUnsubscribePush'
import { useApi } from '@/lib/useApi'
import { cookiesPlugin } from '@/plugins'
import type { GmailConnectionStatus } from '@/services/gmail'
import {
  Avatar,
  Box,
  Flex,
  Stack,
  Text,
  useColorMode,
  useDisclosure
} from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import type { ReactElement, ReactNode } from 'react'

const LANGUAGES = ['es', 'en'] as const

const percent = (value: number) => Math.round(value * 100)

/** docs/diseno-mobile.html `.li .ic`: 32 px soft square holding an 18 px icon. */
const IconBox = ({
  icon,
  bg = 'button.soft',
  color = 'text.primary'
}: {
  icon: ReactElement
  bg?: string
  color?: string
}) => (
  <Flex
    boxSize="32px"
    flexShrink={0}
    borderRadius="10px"
    bg={bg}
    color={color}
    align="center"
    justify="center"
  >
    {icon}
  </Flex>
)

/** One `.li` row: 56 px, icon box, 15 px label, muted value on the right.
 * A link when `href` is given, a button when `onClick` is. */
const Row = ({
  icon,
  label,
  value,
  href,
  onClick,
  color = 'text.primary',
  ...rest
}: {
  icon: ReactElement
  label: string
  value?: ReactNode
  href?: string
  onClick?: () => void
  color?: string
  role?: 'switch'
  'aria-checked'?: boolean
  'aria-current'?: 'true'
}) => (
  <Flex
    as={href ? NextLink : 'button'}
    {...(href ? { href } : { type: 'button', onClick })}
    {...rest}
    w="full"
    align="center"
    gap="12px"
    h="56px"
    fontSize="15px"
    fontWeight={550}
    color={color}
    textAlign="left"
    _focusVisible={{ boxShadow: 'outline', outline: 'none' }}
  >
    {icon}
    <Box as="span" flex={1} minW={0} noOfLines={1}>
      {label}
    </Box>
    {value !== undefined && (
      <Flex
        as="span"
        align="center"
        gap="6px"
        fontSize="13.5px"
        fontWeight="normal"
        color="text.secondary"
        flexShrink={0}
      >
        {value}
      </Flex>
    )}
  </Flex>
)

/** `.list`: white card, radius 18, hairlines between rows. */
const List = ({ children }: { children: ReactNode }) => (
  <Stack
    spacing={0}
    bg="bg.surface"
    borderRadius="18px"
    px="14px"
    divider={<Box borderTopWidth="1px" borderColor="border.subtle" />}
  >
    {children}
  </Stack>
)

/** `.grp`: 12 px uppercase section label. */
const Group = ({ children }: { children: ReactNode }) => (
  <Text
    as="h2"
    fontSize="12px"
    fontWeight="bold"
    color="text.secondary"
    textTransform="uppercase"
    letterSpacing=".06em"
    mx="4px"
    mt="6px"
    mb="-4px"
  >
    {children}
  </Text>
)

/** `.toggle`: 46 × 28 green pill (the row itself is the switch). */
const Toggle = ({ isOn }: { isOn: boolean }) => (
  <Box
    as="span"
    position="relative"
    w="46px"
    h="28px"
    borderRadius="14px"
    bg={isOn ? 'money.income' : 'toggle.off'}
    transition="background .2s"
  >
    <Box
      as="span"
      position="absolute"
      top="3px"
      left={isOn ? '21px' : '3px'}
      boxSize="22px"
      borderRadius="full"
      bg="white"
      transition="left .2s"
    />
  </Box>
)

/**
 * "Más" tab (docs/diseno-mobile.html, Más): profile, connections, account,
 * preferences and sign out — what used to be split between the side menu,
 * the top bar and the long settings page.
 */
export default function MorePage() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { colorMode, toggleColorMode } = useColorMode()
  const { data: session } = useSession()
  const { data, error } = useApi<{ user: Profile }>('auth/profile')
  const { data: gmail } = useApi<GmailConnectionStatus>('gmail/connection')
  const { isSubscribed } = usePushSubscription(session?.accessToken)
  const language = useDisclosure()
  const profile = data?.user
  const currentLanguage = router.locale === 'en' ? 'en' : 'es'

  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : ''
  const splitSummary = profile?.payFrequency
    ? `${t(`more.payFrequency.${profile.payFrequency}`)} · ${percent(
        profile.needsPercent
      )} / ${percent(profile.wantsPercent)} / ${percent(
        profile.savingsPercent
      )}`
    : ''

  const changeLanguage = (lang: (typeof LANGUAGES)[number]) => {
    language.onClose()
    if (lang === currentLanguage) return
    // A year: the middleware serves every page straight in this language.
    cookiesPlugin.setName(CookiesEnum.NEXT_LOCALE, lang, 365)
    router.push(router.asPath, router.asPath, { locale: lang })
  }

  const chevron = <ChevronRightIcon boxSize="16px" color="icon.subtle" />

  // First load: the screen's skeleton instead of empty rows.
  const PageSkeleton = getPageSkeleton(router.pathname)
  if (data === undefined && !error && PageSkeleton)
    return (
      <ProsperoLayout
        title={t('more.title')}
        pageDescription={t('more.title')}
        topBarTrailing="none"
      >
        <PageSkeleton />
      </ProsperoLayout>
    )

  return (
    <ProsperoLayout
      title={t('more.title')}
      pageDescription={t('more.title')}
      topBarTrailing="none"
    >
      <Stack spacing="12px" maxW="lg" pb={4}>
        <Flex
          as={NextLink}
          // The card shows the pay frequency and split: tapping it edits them.
          href="/settings#budget"
          align="center"
          gap="12px"
          p="14px"
          bg="bg.surface"
          borderRadius="18px"
          _focusVisible={{ boxShadow: 'outline', outline: 'none' }}
        >
          <Avatar
            name={fullName || undefined}
            boxSize="48px"
            bg="brand.subtle"
            color="brand.text"
            fontWeight="bold"
            sx={{ '& > div': { fontSize: '17px' } }}
          />
          <Box flex={1} minW={0}>
            <Text
              fontSize="16px"
              fontWeight="bold"
              color="text.primary"
              noOfLines={1}
            >
              {fullName || ' '}
            </Text>
            <Text fontSize="12.5px" color="text.secondary" noOfLines={1}>
              {splitSummary}
            </Text>
          </Box>
          <ChevronRightIcon boxSize="18px" color="icon.subtle" />
        </Flex>

        <Group>{t('more.sections.connections')}</Group>
        <List>
          <Row
            href="/settings#gmail"
            icon={<IconBox icon={<MailIcon boxSize="18px" />} />}
            label={t('more.gmail')}
            value={
              gmail?.connected ? (
                <>
                  <Box
                    as="span"
                    boxSize="9px"
                    borderRadius="full"
                    bg="money.income"
                  />
                  {t('more.gmailConnected')}
                </>
              ) : gmail ? (
                t('more.gmailDisconnected')
              ) : (
                chevron
              )
            }
          />
          <Row
            href="/settings#notifications"
            icon={<IconBox icon={<BellIcon boxSize="18px" />} />}
            label={t('more.notifications')}
            value={isSubscribed ? t('more.push') : chevron}
          />
        </List>

        <Group>{t('more.sections.account')}</Group>
        <List>
          <Row
            href="/profile"
            icon={<IconBox icon={<ShieldIcon boxSize="18px" />} />}
            label={t('more.security')}
            value={
              profile
                ? t(profile.enable2FA ? 'more.twoFaOn' : 'more.twoFaOff')
                : chevron
            }
          />
          <Row
            href="/budget-calculator"
            icon={<IconBox icon={<CalculatorIcon boxSize="18px" />} />}
            label={t('more.calculator')}
            value={chevron}
          />
        </List>

        <Group>{t('more.sections.preferences')}</Group>
        <List>
          <Row
            onClick={language.onOpen}
            icon={<IconBox icon={<GlobeIcon boxSize="18px" />} />}
            label={t('more.language')}
            value={t(`more.languageName.${currentLanguage}`)}
          />
          <Row
            onClick={toggleColorMode}
            role="switch"
            aria-checked={colorMode === 'dark'}
            icon={<IconBox icon={<MoonIcon boxSize="18px" />} />}
            label={t('more.darkMode')}
            value={<Toggle isOn={colorMode === 'dark'} />}
          />
        </List>

        <List>
          <Row
            onClick={() =>
              signOutAndUnsubscribePush(session?.accessToken, {
                redirect: true
              })
            }
            color="money.expenseText"
            icon={
              <IconBox
                icon={<SignOutIcon boxSize="18px" />}
                bg="tint.expense"
                color="money.expense"
              />
            }
            label={t('more.signOut')}
          />
        </List>
      </Stack>

      <BottomSheet
        isOpen={language.isOpen}
        onClose={language.onClose}
        title={t('more.language')}
      >
        <List>
          {LANGUAGES.map(lang => (
            <Row
              key={lang}
              onClick={() => changeLanguage(lang)}
              aria-current={lang === currentLanguage ? 'true' : undefined}
              icon={<IconBox icon={<GlobeIcon boxSize="18px" />} />}
              label={t(`more.languageName.${lang}`)}
              value={
                lang === currentLanguage ? (
                  <CheckIcon boxSize="18px" color="brand.text" />
                ) : undefined
              }
            />
          ))}
        </List>
      </BottomSheet>
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
