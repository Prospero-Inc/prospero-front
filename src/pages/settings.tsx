import { ProsperoLayout } from '@/components/layouts'
import { SwitchLanguage } from '@/components/ui'
import {
  FinancialInstitutions,
  GmailConnection,
  NotificationPreferences
} from '@/components/views/settings'
import { HttpMethod } from '@/enums'
import { PayFrequency } from '@/interfaces'
import { getValidSession, localApiService } from '@/lib'
import { withClientIp } from '@/lib/server/clientIp'
import { signOutAndUnsubscribePush } from '@/lib/signOutAndUnsubscribePush'
import {
  FinancialInstitution,
  getFinancialInstitutions,
  getSupportedParsers,
  SupportedParser
} from '@/services/financialInstitutions'
import { GmailConnectionStatus, getGmailConnection } from '@/services/gmail'
import {
  getNotificationPreferences,
  NotificationPreferences as NotificationPreferencesData
} from '@/services/notifications'
import { requestProfile } from '@/services/request-profile'
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react'
import { GetServerSideProps } from 'next'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

interface BudgetSettings {
  payFrequency: PayFrequency
  needsPercent: number
  wantsPercent: number
  savingsPercent: number
}

interface SettingsProps {
  account: { email: string; username: string } | null
  budget: BudgetSettings | null
  institutions: FinancialInstitution[]
  supportedParsers: SupportedParser[]
  gmailConnection: GmailConnectionStatus
  notificationPreferences: NotificationPreferencesData
}

const defaultBudget: BudgetSettings = {
  payFrequency: 'Biweekly',
  needsPercent: 50,
  wantsPercent: 30,
  savingsPercent: 20
}

const defaultGmailConnection: GmailConnectionStatus = {
  connected: false,
  status: 'Disconnected',
  lastSyncAt: null,
  autoDetectEnabled: false,
  notifyIncomeEnabled: false
}

const defaultNotificationPreferences: NotificationPreferencesData = {
  gmailReviewEmailEnabled: false,
  gmailReviewPushEnabled: false,
  budgetAlertEmailEnabled: false
}

// Sections the "Más" tab links to (#budget, #gmail, #notifications) land
// below the sticky top bar instead of under it.
const ANCHOR_OFFSET = '80px'

export default function SettingsPage({
  account,
  budget,
  institutions,
  supportedParsers,
  gmailConnection,
  notificationPreferences
}: SettingsProps) {
  const { t } = useTranslation('settings')
  const { data: session } = useSession()
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const { control, handleSubmit, watch } = useForm<BudgetSettings>({
    defaultValues: {
      payFrequency: budget?.payFrequency ?? defaultBudget.payFrequency,
      needsPercent: (budget?.needsPercent ?? 0.5) * 100,
      wantsPercent: (budget?.wantsPercent ?? 0.3) * 100,
      savingsPercent: (budget?.savingsPercent ?? 0.2) * 100
    }
  })
  const [needsPercent, wantsPercent, savingsPercent] = watch([
    'needsPercent',
    'wantsPercent',
    'savingsPercent'
  ])
  const total =
    Number(needsPercent || 0) +
    Number(wantsPercent || 0) +
    Number(savingsPercent || 0)
  const isValidTotal = Math.abs(total - 100) < 0.5

  const onSubmit = async (data: BudgetSettings) => {
    setIsLoading(true)
    try {
      await localApiService.request({
        endPoint: '/proxy/update-profile',
        method: HttpMethod.PATCH,
        data: {
          payFrequency: data.payFrequency,
          needsPercent: Number(data.needsPercent) / 100,
          wantsPercent: Number(data.wantsPercent) / 100,
          savingsPercent: Number(data.savingsPercent) / 100
        },
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      })
      toast({
        title: t('budget.toast.success.title'),
        description: t('budget.toast.success.description'),
        status: 'success',
        isClosable: true
      })
    } catch (error) {
      toast({
        title: t('budget.toast.error.title'),
        description:
          error instanceof Error
            ? error.message
            : t('budget.toast.error.description'),
        status: 'error',
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProsperoLayout title={t('title')} pageDescription={t('title')}>
      <Stack spacing={8} maxW="lg">
        <Box>
          <Heading size="md" mb={3}>
            {t('account.title')}
          </Heading>
          <Text>
            {t('account.email')}: {account?.email ?? '-'}
          </Text>
          <Text>
            {t('account.username')}: {account?.username ?? '-'}
          </Text>
        </Box>

        <Divider />

        <Box
          id="budget"
          scrollMarginTop={ANCHOR_OFFSET}
          as="form"
          method="post"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Heading size="md" mb={3}>
            {t('budget.title')}
          </Heading>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>{t('budget.labelFrequency')}</FormLabel>
              <Controller
                name="payFrequency"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="Biweekly">
                      {t('budget.frequency.Biweekly')}
                    </option>
                    <option value="Monthly">
                      {t('budget.frequency.Monthly')}
                    </option>
                  </Select>
                )}
              />
            </FormControl>
            <FormControl>
              <FormLabel>{t('budget.labelNeeds')}</FormLabel>
              <Controller
                name="needsPercent"
                control={control}
                render={({ field }) => (
                  <Input {...field} type="number" min={0} max={100} />
                )}
              />
            </FormControl>
            <FormControl>
              <FormLabel>{t('budget.labelWants')}</FormLabel>
              <Controller
                name="wantsPercent"
                control={control}
                render={({ field }) => (
                  <Input {...field} type="number" min={0} max={100} />
                )}
              />
            </FormControl>
            <FormControl>
              <FormLabel>{t('budget.labelSavings')}</FormLabel>
              <Controller
                name="savingsPercent"
                control={control}
                render={({ field }) => (
                  <Input {...field} type="number" min={0} max={100} />
                )}
              />
            </FormControl>
            <Text color={isValidTotal ? 'GrayText' : 'red.500'} fontSize="sm">
              {t('budget.total', { total })}
            </Text>
            <Button
              alignSelf="flex-start"
              colorScheme="primary"
              type="submit"
              isLoading={isLoading}
              isDisabled={!isValidTotal}
            >
              {t('budget.submit')}
            </Button>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Heading size="md" mb={3}>
            {t('language.title')}
          </Heading>
          <SwitchLanguage />
        </Box>

        <Divider />

        <Box id="gmail" scrollMarginTop={ANCHOR_OFFSET}>
          <GmailConnection connection={gmailConnection} />
        </Box>

        <Divider />

        <Box id="notifications" scrollMarginTop={ANCHOR_OFFSET}>
          <NotificationPreferences preferences={notificationPreferences} />
        </Box>

        <Divider />

        <FinancialInstitutions
          institutions={institutions}
          supportedParsers={supportedParsers}
        />

        <Divider />

        <Button
          alignSelf="flex-start"
          colorScheme="red"
          variant="outline"
          onClick={() =>
            signOutAndUnsubscribePush(session?.accessToken, {
              callbackUrl: '/auth/login'
            })
          }
        >
          {t('logout')}
        </Button>
      </Stack>
    </ProsperoLayout>
  )
}

export const getServerSideProps: GetServerSideProps = withClientIp(
  async ({ req, res, locale }) => {
    const { session, redirect } = await getValidSession(req, res)
    if (redirect) return redirect

    let account: SettingsProps['account'] = null
    let budget: SettingsProps['budget'] = null
    let institutions: SettingsProps['institutions'] = []
    let supportedParsers: SettingsProps['supportedParsers'] = []
    let gmailConnection: SettingsProps['gmailConnection'] =
      defaultGmailConnection
    let notificationPreferences: SettingsProps['notificationPreferences'] =
      defaultNotificationPreferences

    if (session?.accessToken)
      try {
        institutions = (await getFinancialInstitutions(
          {},
          { authorization: `Bearer ${session.accessToken}`, lang: locale }
        )) as FinancialInstitution[]
      } catch (error) {
        institutions = []
      }

    if (session?.accessToken)
      try {
        supportedParsers = (await getSupportedParsers(
          {},
          { authorization: `Bearer ${session.accessToken}`, lang: locale }
        )) as SupportedParser[]
      } catch (error) {
        supportedParsers = []
      }

    if (session?.accessToken)
      try {
        gmailConnection = (await getGmailConnection(
          {},
          { authorization: `Bearer ${session.accessToken}`, lang: locale }
        )) as GmailConnectionStatus
      } catch (error) {
        gmailConnection = defaultGmailConnection
      }

    if (session?.accessToken)
      try {
        // Merge con defaults: un backend sin `gmailReviewPushEnabled` todavía
        // no rompe el switch (queda en false en vez de undefined).
        notificationPreferences = {
          ...defaultNotificationPreferences,
          ...((await getNotificationPreferences(
            {},
            { authorization: `Bearer ${session.accessToken}`, lang: locale }
          )) as Partial<NotificationPreferencesData>)
        }
      } catch (error) {
        notificationPreferences = defaultNotificationPreferences
      }

    if (session?.accessToken)
      try {
        const profile = (await requestProfile(null, {
          authorization: `Bearer ${session.accessToken}`,
          lang: locale
        })) as { user: BudgetSettings & { email: string; username: string } }
        account = profile?.user
          ? { email: profile.user.email, username: profile.user.username }
          : null
        budget = profile?.user
          ? {
              payFrequency: profile.user.payFrequency,
              needsPercent: profile.user.needsPercent,
              wantsPercent: profile.user.wantsPercent,
              savingsPercent: profile.user.savingsPercent
            }
          : null
      } catch (error) {
        account = null
        budget = null
      }

    return {
      props: {
        ...(await serverSideTranslations(locale as string, [
          'common',
          'sidebar',
          'mobileNav',
          'settings'
        ])),
        account,
        budget,
        institutions,
        supportedParsers,
        gmailConnection,
        notificationPreferences
      }
    }
  }
)
