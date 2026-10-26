import {
  PushAvailability,
  usePushSubscription
} from '@/hooks/usePushSubscription'
import { PushErrorCode, PushSubscriptionError } from '@/lib/webPush'
import {
  FormControl,
  FormHelperText,
  FormLabel,
  Spinner,
  Stack,
  Switch,
  useToast
} from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'

/** Texto de ayuda según la disponibilidad de push en este navegador. */
const AVAILABILITY_HELP_KEY: Record<PushAvailability, string> = {
  loading: 'push.deviceHelp.loading',
  'ios-requires-install': 'push.deviceHelp.iosRequiresInstall',
  unsupported: 'push.deviceHelp.unsupported',
  'no-service-worker': 'push.deviceHelp.noServiceWorker',
  'server-disabled': 'push.deviceHelp.serverDisabled',
  denied: 'push.deviceHelp.denied',
  available: 'push.deviceHelp.available'
}

const ERROR_KEY: Record<PushErrorCode, string> = {
  unsupported: 'push.errors.unsupported',
  'no-service-worker': 'push.errors.noServiceWorker',
  'server-disabled': 'push.errors.serverDisabled',
  'permission-denied': 'push.errors.permissionDenied',
  'permission-dismissed': 'push.errors.permissionDismissed',
  'subscribe-failed': 'push.errors.subscribeFailed',
  'backend-failed': 'push.errors.backendFailed'
}

/** Activa/desactiva la suscripción Web Push de este navegador. */
export const PushDeviceToggle = () => {
  const { t } = useTranslation('settings', { keyPrefix: 'notifications' })
  const toast = useToast()
  const { data: session } = useSession()
  const { availability, isSubscribed, isUpdating, enable, disable } =
    usePushSubscription(session?.accessToken)

  const isAvailable = availability === 'available'

  const onToggle = async () => {
    const wasSubscribed = isSubscribed
    try {
      if (wasSubscribed) await disable()
      else await enable()
      toast({
        title: t(
          wasSubscribed
            ? 'push.toast.disabled.title'
            : 'push.toast.enabled.title'
        ),
        description: t(
          wasSubscribed
            ? 'push.toast.disabled.description'
            : 'push.toast.enabled.description'
        ),
        status: 'success',
        isClosable: true
      })
    } catch (error) {
      toast({
        title: t('toast.error.title'),
        description:
          error instanceof PushSubscriptionError
            ? t(ERROR_KEY[error.code])
            : t('push.errors.subscribeFailed'),
        status: 'error',
        isClosable: true
      })
    }
  }

  return (
    <FormControl maxW="sm" isDisabled={!isAvailable}>
      <Stack direction="row" align="center" justify="space-between" spacing={4}>
        <FormLabel mb={0}>{t('push.device')}</FormLabel>
        <Stack direction="row" align="center" spacing={2}>
          {(isUpdating || availability === 'loading') && (
            <Spinner size="sm" aria-hidden="true" />
          )}
          <Switch
            isChecked={isSubscribed}
            isDisabled={!isAvailable || isUpdating}
            aria-busy={isUpdating || availability === 'loading'}
            onChange={onToggle}
          />
        </Stack>
      </Stack>
      <FormHelperText>{t(AVAILABILITY_HELP_KEY[availability])}</FormHelperText>
    </FormControl>
  )
}
