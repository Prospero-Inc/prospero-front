import {
  Group,
  Help,
  IconBox,
  ListCard,
  SwitchRow
} from '@/components/design/settings'
import { PhoneIcon } from '@/components/icons/app'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { settingsStaticProps } from '@/components/settings/settingsStaticProps'
import {
  useErrorToast,
  useSettingsRequest
} from '@/components/settings/useSettingsRequest'
import { HttpMethod } from '@/enums'
import {
  type PushAvailability,
  usePushSubscription
} from '@/hooks/usePushSubscription'
import { useApi } from '@/lib/useApi'
import { type PushErrorCode, PushSubscriptionError } from '@/lib/webPush'
import type { GmailConnectionStatus } from '@/services/gmail'
import type { NotificationPreferences } from '@/services/notifications'
import { useToast } from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'

// An older backend without a field leaves the switch off, not undefined.
const DEFAULT_PREFERENCES: NotificationPreferences = {
  gmailReviewEmailEnabled: false,
  gmailReviewPushEnabled: true,
  budgetAlertEmailEnabled: false
}

/** The push row's subtitle for each state of this browser. */
const PUSH_STATE_KEY: Record<PushAvailability, string> = {
  loading: 'loading',
  'ios-requires-install': 'iosRequiresInstall',
  unsupported: 'unsupported',
  'no-service-worker': 'noServiceWorker',
  'server-disabled': 'serverDisabled',
  denied: 'denied',
  available: 'available'
}

const PUSH_ERROR_KEY: Record<PushErrorCode, string> = {
  unsupported: 'unsupported',
  'no-service-worker': 'noServiceWorker',
  'server-disabled': 'serverDisabled',
  'permission-denied': 'permissionDenied',
  'permission-dismissed': 'permissionDismissed',
  'subscribe-failed': 'subscribeFailed',
  'backend-failed': 'backendFailed'
}

/**
 * Notificaciones (docs/diseno-mobile.html, 09): push on this device first,
 * with its real state; what we notify about; and email only as a fallback
 * for when no device has push.
 */
export default function NotificationSettingsPage() {
  const { t } = useTranslation('settings')
  const toast = useToast()
  const showError = useErrorToast()
  const request = useSettingsRequest()
  const { data: session } = useSession()
  const push = usePushSubscription(session?.accessToken)

  const {
    data: preferencesData,
    error,
    mutate: mutatePreferences
  } = useApi<Partial<NotificationPreferences>>('notifications/preferences')
  const { data: gmail, mutate: mutateGmail } =
    useApi<GmailConnectionStatus>('gmail/connection')
  const preferences = { ...DEFAULT_PREFERENCES, ...preferencesData }

  const togglePreference = async (key: keyof NotificationPreferences) => {
    const next = { ...preferences, [key]: !preferences[key] }
    try {
      await mutatePreferences(
        async () => {
          await request(
            '/proxy/update-notification-preferences',
            HttpMethod.PATCH,
            { [key]: next[key] }
          )
          return next
        },
        { optimisticData: next, rollbackOnError: true, revalidate: false }
      )
    } catch (toggleError) {
      showError(toggleError)
    }
  }

  // "Ingresos detectados" is the Gmail connection's own setting (the same
  // switch as "Avisarme de ingresos" in Gmail y bancos).
  const toggleIncome = async () => {
    if (!gmail) return
    const next = { ...gmail, notifyIncomeEnabled: !gmail.notifyIncomeEnabled }
    try {
      await mutateGmail(
        async () => {
          await request('/proxy/update-gmail-preferences', HttpMethod.PATCH, {
            notifyIncomeEnabled: next.notifyIncomeEnabled
          })
          return next
        },
        { optimisticData: next, rollbackOnError: true, revalidate: false }
      )
    } catch (toggleError) {
      showError(toggleError)
    }
  }

  const togglePush = async () => {
    try {
      if (push.isSubscribed) await push.disable()
      else await push.enable()
    } catch (pushError) {
      toast({
        title: t('notifications.push.errorTitle'),
        description: t(
          `notifications.push.errors.${
            pushError instanceof PushSubscriptionError
              ? PUSH_ERROR_KEY[pushError.code]
              : 'subscribeFailed'
          }`
        ),
        status: 'error',
        isClosable: true
      })
    }
  }

  const pushState =
    push.availability === 'available'
      ? push.isSubscribed
        ? 'on'
        : 'off'
      : PUSH_STATE_KEY[push.availability]
  const gmailConnected = gmail?.connected ?? false

  return (
    <SettingsLayout
      title={t('notifications.title')}
      isLoading={preferencesData === undefined && !error}
    >
      <Group>{t('notifications.device')}</Group>
      <ListCard py="2px">
        <SwitchRow
          icon={
            <IconBox
              size="36px"
              icon={<PhoneIcon boxSize="18px" />}
              bg="brand.subtle"
              color="brand.text"
            />
          }
          title={t('notifications.push.title')}
          hint={t(`notifications.push.state.${pushState}`)}
          isOn={push.isSubscribed}
          isDisabled={push.availability !== 'available' || push.isUpdating}
          onToggle={togglePush}
        />
      </ListCard>
      <Help>
        {t(
          push.availability === 'available' || push.availability === 'loading'
            ? 'notifications.push.help'
            : `notifications.push.fix.${PUSH_STATE_KEY[push.availability]}`
        )}
      </Help>

      <Group>{t('notifications.what')}</Group>
      <ListCard py="2px">
        <SwitchRow
          title={t('notifications.review')}
          hint={t('notifications.reviewHint')}
          isOn={preferences.gmailReviewPushEnabled}
          onToggle={() => togglePreference('gmailReviewPushEnabled')}
        />
        <SwitchRow
          title={t('notifications.income')}
          hint={t(
            gmailConnected
              ? 'notifications.incomeHint'
              : 'notifications.needsGmail'
          )}
          isOn={gmailConnected && (gmail?.notifyIncomeEnabled ?? false)}
          isDisabled={!gmailConnected}
          onToggle={toggleIncome}
        />
      </ListCard>

      <Group>{t('notifications.email')}</Group>
      <ListCard py="2px">
        <SwitchRow
          title={t('notifications.emailToggle')}
          hint={t('notifications.emailHint')}
          isOn={preferences.gmailReviewEmailEnabled}
          onToggle={() => togglePreference('gmailReviewEmailEnabled')}
        />
      </ListCard>
    </SettingsLayout>
  )
}

export const getStaticProps = settingsStaticProps
