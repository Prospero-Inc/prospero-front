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
  const [isTogglingGmailReviewPush, setIsTogglingGmailReviewPush] =
    useState(false)
  const [isTogglingBudgetAlert, setIsTogglingBudgetAlert] = useState(false)

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

  const onToggleGmailReviewPush = () =>
    updatePreference(
      { gmailReviewPushEnabled: !preferences.gmailReviewPushEnabled },
      setIsTogglingGmailReviewPush
    )

  const onToggleBudgetAlert = () =>
    updatePreference(
      { budgetAlertEmailEnabled: !preferences.budgetAlertEmailEnabled },
      setIsTogglingBudgetAlert
    )

  return (
    <Box>
      <Heading size="md" mb={3}>
        {t('title')}
      </Heading>

      <Stack spacing={4}>
        <PushDeviceToggle />

        <FormControl maxW="sm">
          <Stack
            direction="row"
            align="center"
            justify="space-between"
            spacing={4}
          >
            <FormLabel mb={0}>{t('push.gmailReview')}</FormLabel>
            <Switch
              isChecked={preferences.gmailReviewPushEnabled}
              isDisabled={isTogglingGmailReviewPush}
              aria-busy={isTogglingGmailReviewPush}
              onChange={onToggleGmailReviewPush}
            />
          </Stack>
          <FormHelperText>{t('push.gmailReviewHelp')}</FormHelperText>
        </FormControl>

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

        <FormControl maxW="sm">
          <Stack
            direction="row"
            align="center"
            justify="space-between"
            spacing={4}
          >
            <FormLabel mb={0}>{t('toggles.budgetAlert')}</FormLabel>
            <Switch
              isChecked={preferences.budgetAlertEmailEnabled}
              isDisabled={isTogglingBudgetAlert}
              onChange={onToggleBudgetAlert}
            />
          </Stack>
          <FormHelperText>{t('toggles.budgetAlertNotice')}</FormHelperText>
        </FormControl>
      </Stack>
    </Box>
  )
}
