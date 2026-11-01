import {
  Group,
  IconBox,
  ListCard as List,
  ListRow as Row,
  Toggle
} from '@/components/design/settings'
import {
  BellIcon,
  CalculatorIcon,
  CheckIcon,
  ChevronRightIcon,
  GlobeIcon,
  MailIcon,
  MoonIcon,
  PieIcon,
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

const LANGUAGES = ['es', 'en'] as const

const percent = (value: number) => Math.round(value * 100)

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
          href="/settings/profile"
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
            href="/settings/gmail"
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
            href="/settings/notifications"
            icon={<IconBox icon={<BellIcon boxSize="18px" />} />}
            label={t('more.notifications')}
            value={isSubscribed ? t('more.push') : chevron}
          />
        </List>

        <Group>{t('more.sections.account')}</Group>
        <List>
          <Row
            href="/settings/budget"
            icon={<IconBox icon={<PieIcon boxSize="18px" />} />}
            label={t('more.budget')}
            value={
              profile ? (
                <>
                  {percent(profile.needsPercent)} /{' '}
                  {percent(profile.wantsPercent)} /{' '}
                  {percent(profile.savingsPercent)}
                </>
              ) : (
                chevron
              )
            }
          />
          <Row
            href="/settings/security"
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
