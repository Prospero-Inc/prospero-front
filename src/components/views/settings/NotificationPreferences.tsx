import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
import { NotificationPreferences as NotificationPreferencesData } from '@/services/notifications'
import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Stack,
  Switch,
  Text,
  useToast
} from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { PushDeviceToggle } from './PushDeviceToggle'

interface NotificationPreferencesProps {
  preferences: NotificationPreferencesData
}

export const NotificationPreferences = ({
  preferences
}: NotificationPreferencesProps) => {
  const { t } = useTranslation('settings', { keyPrefix: 'notifications' })
  const router = useRouter()
  const toast = useToast()
  const { data: session } = useSession()
  const authHeader = { Authorization: `Bearer ${session?.accessToken}` }

  const [isTogglingGmailReview, setIsTogglingGmailReview] = useState(false)

  const showError = (error: unknown) => {
    toast({
      title: t('toast.error.title'),
      description:
        error instanceof Error ? error.message : t('toast.error.description'),
      status: 'error',
      isClosable: true
    })
  }

  const updatePreference = async (
    data: Partial<NotificationPreferencesData>,
    setIsToggling: (_value: boolean) => void
  ) => {
    setIsToggling(true)
    try {
      await localApiService.request({
        endPoint: '/proxy/update-notification-preferences',
        method: HttpMethod.PATCH,
        data,
        headers: authHeader
      })
      toast({
        title: t('toast.success.title'),
        description: t('toast.success.description'),
        status: 'success',
        isClosable: true
      })
      router.replace(router.asPath)
    } catch (error) {
      showError(error)
    } finally {
      setIsToggling(false)
    }
  }

  const onToggleGmailReview = () =>
    updatePreference(
      { gmailReviewEmailEnabled: !preferences.gmailReviewEmailEnabled },
      setIsTogglingGmailReview
    )

  // Deliberately only two controls. The device switch *is* the push opt-in
  // (the account-level `gmailReviewPushEnabled` stays at its default `true`
  // and isn't exposed — a second push switch only confused which one wins),
  // and `budgetAlertEmailEnabled` stays hidden until budget alerts actually
  // exist; showing a switch that never sends anything was misleading.
  return (
    <Box>
      <Heading size="md" mb={1}>
        {t('title')}
      </Heading>
      <Text color="gray.500" fontSize="sm" mb={4}>
        {t('gmailSection')}
      </Text>

      <Stack spacing={5}>
        <PushDeviceToggle />

        <FormControl maxW="sm">
          <Stack
            direction="row"
            align="center"
            justify="space-between"
            spacing={4}
          >
            <FormLabel mb={0}>{t('toggles.gmailReview')}</FormLabel>
            <Switch
              isChecked={preferences.gmailReviewEmailEnabled}
              isDisabled={isTogglingGmailReview}
              aria-busy={isTogglingGmailReview}
              onChange={onToggleGmailReview}
            />
          </Stack>
          <FormHelperText>
            {t('toggles.gmailReviewReplacedByPush')}
          </FormHelperText>
        </FormControl>
      </Stack>
    </Box>
  )
}
