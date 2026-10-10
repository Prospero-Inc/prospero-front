import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
import { HttpError } from '@/lib/apiService'
import { GmailConnectionStatus } from '@/services/gmail'
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
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
import { useEffect, useRef, useState } from 'react'

interface GmailConnectionProps {
  connection: GmailConnectionStatus
}

const KNOWN_ERROR_REASONS = [
  'cancelled',
  'invalid_state',
  'exchange_failed',
  'no_refresh_token',
  'google_unavailable',
  'invalid_request',
  'unknown_error'
] as const

export const GmailConnection = ({ connection }: GmailConnectionProps) => {
  const { t } = useTranslation('settings', { keyPrefix: 'gmail' })
  const router = useRouter()
  const toast = useToast()
  const { data: session } = useSession()
  const authHeader = { Authorization: `Bearer ${session?.accessToken}` }

  const [isConnecting, setIsConnecting] = useState(false)
  const [isTogglingAutoDetect, setIsTogglingAutoDetect] = useState(false)
  const [isTogglingNotify, setIsTogglingNotify] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const hasHandledRedirect = useRef(false)

  const showError = (error: unknown) => {
    toast({
      title: t('toast.error.title'),
      description:
        error instanceof Error ? error.message : t('toast.error.description'),
      status: 'error',
      isClosable: true
    })
  }

  useEffect(() => {
    if (!router.isReady || hasHandledRedirect.current) return

    const { gmail, reason } = router.query
    if (gmail !== 'connected' && gmail !== 'error') return

    hasHandledRedirect.current = true

    if (gmail === 'connected')
      toast({
        title: t('toast.connected.title'),
        description: t('toast.connected.description'),
        status: 'success',
        isClosable: true
      })
    else {
      const reasonKey =
        typeof reason === 'string' &&
        (KNOWN_ERROR_REASONS as readonly string[]).includes(reason)
          ? reason
          : 'unknown_error'

      toast({
        title: t('toast.error.title'),
        description: t(`toast.errors.${reasonKey}`),
        status: 'warning',
        isClosable: true
      })
    }

    router.replace('/settings', undefined, { shallow: true })
  }, [router.isReady, router.query])

  const onConnect = async () => {
    setIsConnecting(true)
    try {
      const data = await localApiService.request<{ url: string }>({
        endPoint: '/proxy/get-gmail-connect-url',
        method: HttpMethod.GET,
        headers: authHeader
      })
      window.location.href = data.url
    } catch (error) {
      showError(error)
      setIsConnecting(false)
    }
  }

  const onToggleAutoDetect = async () => {
    setIsTogglingAutoDetect(true)
    try {
      await localApiService.request({
        endPoint: '/proxy/update-gmail-preferences',
        method: HttpMethod.PATCH,
        data: { autoDetectEnabled: !connection.autoDetectEnabled },
        headers: authHeader
      })
      router.replace(router.asPath)
    } catch (error) {
      showError(error)
    } finally {
      setIsTogglingAutoDetect(false)
    }
  }

  const onToggleNotify = async () => {
    setIsTogglingNotify(true)
    try {
      await localApiService.request({
        endPoint: '/proxy/update-gmail-preferences',
        method: HttpMethod.PATCH,
        data: { notifyIncomeEnabled: !connection.notifyIncomeEnabled },
        headers: authHeader
      })
      router.replace(router.asPath)
    } catch (error) {
      showError(error)
    } finally {
      setIsTogglingNotify(false)
    }
  }

  const onSyncNow = async () => {
    setIsSyncing(true)
    try {
      await localApiService.request({
        endPoint: '/proxy/sync-gmail-now',
        method: HttpMethod.POST,
        headers: authHeader
      })
      toast({
        title: t('toast.synced.title'),
        description: t('toast.synced.description'),
        status: 'success',
        isClosable: true
      })
      router.replace(router.asPath)
    } catch (error) {
      if (error instanceof HttpError && error.status === 409)
        toast({
          title: t('toast.error.title'),
          description: t('toast.syncRevoked'),
          status: 'warning',
          isClosable: true
        })
      else if (error instanceof HttpError && error.status === 429)
        toast({
          title: t('toast.error.title'),
          description: t('toast.syncThrottled'),
          status: 'warning',
          isClosable: true
        })
      else showError(error)
    } finally {
      setIsSyncing(false)
    }
  }

  const onDisconnect = async () => {
    if (!window.confirm(t('confirmDisconnect'))) return

    setIsDisconnecting(true)
    try {
      await localApiService.request({
        endPoint: '/proxy/disconnect-gmail',
        method: HttpMethod.DELETE,
        headers: authHeader
      })
      toast({
        title: t('toast.disconnected.title'),
        description: t('toast.disconnected.description'),
        status: 'success',
        isClosable: true
      })
      router.replace(router.asPath)
    } catch (error) {
      showError(error)
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <Box>
      <Heading size="md" mb={3}>
        {t('title')}
      </Heading>

      {!connection.connected ? (
        <Stack spacing={3}>
          <Text>{t('status.disconnected')}</Text>
          <Button
            alignSelf="flex-start"
            colorScheme="primary"
            isLoading={isConnecting}
            onClick={onConnect}
          >
            {t('connect')}
          </Button>
        </Stack>
      ) : (
        <Stack spacing={4}>
          <Flex align="center" gap={3} wrap="wrap">
            <Badge colorScheme="green">{t('status.connected')}</Badge>
            <Text fontSize="sm" color="gray.500">
              {connection.lastSyncAt
                ? t('lastSync.value', {
                    date: new Date(connection.lastSyncAt).toLocaleString()
                  })
                : t('lastSync.never')}
            </Text>
            <Button
              size="sm"
              variant="outline"
              isLoading={isSyncing}
              onClick={onSyncNow}
            >
              {t('syncNow')}
            </Button>
          </Flex>

          <FormControl
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            maxW="sm"
          >
            <FormLabel mb={0}>{t('toggles.autoDetect')}</FormLabel>
            <Switch
              isChecked={connection.autoDetectEnabled}
              isDisabled={isTogglingAutoDetect}
              onChange={onToggleAutoDetect}
            />
          </FormControl>

          <FormControl
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            maxW="sm"
          >
            <FormLabel mb={0}>{t('toggles.notifyIncome')}</FormLabel>
            <Switch
              isChecked={connection.notifyIncomeEnabled}
              isDisabled={isTogglingNotify}
              onChange={onToggleNotify}
            />
          </FormControl>

          <Button
            alignSelf="flex-start"
            colorScheme="red"
            variant="outline"
            isLoading={isDisconnecting}
            onClick={onDisconnect}
          >
            {t('disconnect')}
          </Button>
        </Stack>
      )}
    </Box>
  )
}
