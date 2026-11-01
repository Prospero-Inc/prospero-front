import {
  BankBadge,
  Chevron,
  Group,
  Help,
  ListCard,
  StatusCardHeader,
  StatusPill,
  SwitchRow
} from '@/components/design/settings'
import { MailIcon, PlusIcon, SyncIcon } from '@/components/icons/app'
import { AddBankSheet, BankSheet } from '@/components/settings/BankSheets'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { settingsStaticProps } from '@/components/settings/settingsStaticProps'
import {
  useErrorToast,
  useSettingsRequest
} from '@/components/settings/useSettingsRequest'
import { useConfirm } from '@/components/ui/ConfirmSheet'
import { HttpMethod } from '@/enums'
import { HttpError } from '@/lib/apiService'
import { useApi } from '@/lib/useApi'
import type {
  FinancialInstitution,
  SupportedParser
} from '@/services/financialInstitutions'
import type {
  GmailConnectionStatus,
  UpdateGmailPreferencesData
} from '@/services/gmail'
import {
  Box,
  Button,
  Flex,
  Stack,
  Text,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'

// Why Google's consent didn't end in a connection (api/gmail/callback.ts).
const KNOWN_ERROR_REASONS = [
  'cancelled',
  'invalid_state',
  'exchange_failed',
  'no_refresh_token',
  'google_unavailable',
  'invalid_request',
  'unknown_error'
]

const REDIRECT_TOAST_ID = 'gmail-redirect'

const NO_INSTITUTIONS: FinancialInstitution[] = []
const NO_PARSERS: SupportedParser[] = []

/** `.inst`: badge, name, detection badge and the sender addresses. */
const BankCard = ({
  institution,
  onOpen
}: {
  institution: FinancialInstitution
  onOpen: () => void
}) => {
  const { t } = useTranslation('settings')
  const badge = !institution.isActive
    ? { key: 'paused', bg: 'button.soft', color: 'text.secondary' }
    : institution.parserKey
    ? { key: 'auto', bg: 'tint.income', color: 'money.incomeText' }
    : { key: 'manual', bg: 'status.pendingBg', color: 'status.pending' }
  return (
    <Box
      as="button"
      type="button"
      onClick={onOpen}
      layerStyle="bankCard"
      textAlign="left"
      w="full"
      _focusVisible={{ boxShadow: 'outline', outline: 'none' }}
    >
      <Flex align="center" gap="12px">
        <BankBadge name={institution.name} />
        <Box flex={1} minW={0}>
          <Text
            fontSize="15px"
            fontWeight={650}
            color="text.primary"
            noOfLines={1}
          >
            {institution.name}
          </Text>
          <Box
            as="span"
            display="inline-flex"
            alignItems="center"
            h="20px"
            px="7px"
            mt="4px"
            borderRadius="6px"
            fontSize="10.5px"
            fontWeight="bold"
            bg={badge.bg}
            color={badge.color}
          >
            {t(`gmail.banks.badge.${badge.key}`)}
          </Box>
        </Box>
        <Chevron />
      </Flex>
      {institution.senders.map((sender, index) => (
        <Flex
          key={sender.id}
          align="center"
          gap="8px"
          h="40px"
          fontSize="13px"
          color="text.primary"
          borderTopWidth="1px"
          borderColor="border.subtle"
          mt={index === 0 ? '10px' : 0}
          pt={index === 0 ? '10px' : 0}
        >
          <MailIcon boxSize="16px" color="text.secondary" />
          <Text as="span" noOfLines={1}>
            {sender.emailAddress}
          </Text>
        </Flex>
      ))}
    </Box>
  )
}

/**
 * Gmail y bancos (docs/diseno-mobile.html, 08): the connection's state and
 * "Sincronizar ahora" on top, the banks it reads below, "Desconectar" at the
 * bottom. Google's consent screen comes back here (?gmail=connected).
 */
export default function GmailSettingsPage() {
  const { t } = useTranslation('settings')
  const { t: tCommon } = useTranslation('common')
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()
  const showError = useErrorToast()
  const request = useSettingsRequest()
  const addBank = useDisclosure()

  const {
    data: connection,
    error,
    mutate: mutateConnection
  } = useApi<GmailConnectionStatus>('gmail/connection')
  const { data: institutionsData, mutate: mutateInstitutions } = useApi<
    FinancialInstitution[]
  >('financial-institutions')
  const { data: parsersData } = useApi<SupportedParser[]>(
    'financial-institutions/supported-parsers'
  )
  const institutions = institutionsData ?? NO_INSTITUTIONS
  const parsers = parsersData ?? NO_PARSERS

  const [busy, setBusy] = useState<'connect' | 'sync' | 'disconnect' | null>(
    null
  )
  const [openBankId, setOpenBankId] = useState<number | null>(null)
  const openBank =
    institutions.find(institution => institution.id === openBankId) ?? null

  // Back from Google's consent screen: say how it went, once, and clean
  // the URL so a reload doesn't repeat it.
  const handledRedirect = useRef(false)
  useEffect(() => {
    if (!router.isReady || handledRedirect.current) return
    const { gmail, reason } = router.query
    if (gmail !== 'connected' && gmail !== 'error') return
    handledRedirect.current = true
    // Showed up twice in the e2e before the URL was cleaned: one toast only.
    if (!toast.isActive(REDIRECT_TOAST_ID))
      toast(
        gmail === 'connected'
          ? {
              id: REDIRECT_TOAST_ID,
              title: t('gmail.toast.connected'),
              status: 'success'
            }
          : {
              id: REDIRECT_TOAST_ID,
              title: t('gmail.toast.notConnected'),
              description: t(
                `gmail.errors.${
                  typeof reason === 'string' &&
                  KNOWN_ERROR_REASONS.includes(reason)
                    ? reason
                    : 'unknown_error'
                }`
              ),
              status: 'warning',
              isClosable: true
            }
      )
    router.replace('/settings/gmail', undefined, { shallow: true })
  }, [router, t, toast])

  const onConnect = async () => {
    setBusy('connect')
    try {
      const { url } = await request<{ url: string }>(
        '/proxy/get-gmail-connect-url',
        HttpMethod.GET
      )
      window.location.href = url
    } catch (connectError) {
      showError(connectError)
      setBusy(null)
    }
  }

  const onSync = async () => {
    setBusy('sync')
    try {
      await request('/proxy/sync-gmail-now', HttpMethod.POST)
      await mutateConnection()
      toast({ title: t('gmail.toast.synced'), status: 'success' })
    } catch (syncError) {
      if (syncError instanceof HttpError && syncError.status === 409)
        toast({ title: t('gmail.toast.syncRevoked'), status: 'warning' })
      else if (syncError instanceof HttpError && syncError.status === 429)
        toast({ title: t('gmail.toast.syncThrottled'), status: 'warning' })
      else showError(syncError)
    } finally {
      setBusy(null)
    }
  }

  // Optimistic: the toggle moves at once and goes back if saving fails.
  const onToggle = async (key: keyof UpdateGmailPreferencesData) => {
    if (!connection) return
    const next = { ...connection, [key]: !connection[key] }
    try {
      await mutateConnection(
        async () => {
          await request('/proxy/update-gmail-preferences', HttpMethod.PATCH, {
            [key]: next[key]
          })
          return next
        },
        { optimisticData: next, rollbackOnError: true, revalidate: false }
      )
    } catch (toggleError) {
      showError(toggleError)
    }
  }

  const onDisconnect = async () => {
    if (
      !(await confirm({
        title: t('gmail.confirmDisconnect'),
        description: t('gmail.confirmDisconnectDescription'),
        confirmLabel: tCommon('confirmSheet.disconnect'),
        destructive: true
      }))
    )
      return
    setBusy('disconnect')
    try {
      await request('/proxy/disconnect-gmail', HttpMethod.DELETE)
      await mutateConnection()
      toast({ title: t('gmail.toast.disconnected'), status: 'success' })
    } catch (disconnectError) {
      showError(disconnectError)
    } finally {
      setBusy(null)
    }
  }

  const isConnected = connection?.connected ?? false
  const needsReconnect =
    connection?.status === 'Expired' || connection?.status === 'Revoked'
  const lastSync = connection?.lastSyncAt
    ? new Intl.DateTimeFormat(router.locale, {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(connection.lastSyncAt))
    : null

  return (
    <SettingsLayout
      title={t('gmail.title')}
      isLoading={connection === undefined && !error}
    >
      <Stack spacing="10px">
        <Box layerStyle="statusCard">
          <StatusCardHeader
            icon={
              <Flex
                boxSize="44px"
                flexShrink={0}
                borderRadius="13px"
                bg="tint.expense"
                color="money.expenseText"
                fontSize="18px"
                fontWeight={800}
                align="center"
                justify="center"
                aria-hidden
              >
                M
              </Flex>
            }
            title={t('gmail.account')}
            status={
              <StatusPill isOn={isConnected}>
                {t(
                  isConnected
                    ? 'gmail.status.connected'
                    : needsReconnect
                    ? 'gmail.status.reconnect'
                    : 'gmail.status.disconnected'
                )}
              </StatusPill>
            }
          />
          <Text fontSize="12.5px" color="text.secondary" mt="12px" mb="10px">
            {isConnected
              ? lastSync
                ? t('gmail.lastSync', { date: lastSync })
                : t('gmail.neverSynced')
              : t(needsReconnect ? 'gmail.reconnectHint' : 'gmail.connectHint')}
          </Text>
          {isConnected ? (
            <Button
              variant="line"
              size="ctaSm"
              w="full"
              leftIcon={<SyncIcon boxSize="18px" />}
              isLoading={busy === 'sync'}
              onClick={onSync}
            >
              {t('gmail.syncNow')}
            </Button>
          ) : (
            <Button
              variant="brand"
              size="ctaSm"
              w="full"
              isLoading={busy === 'connect'}
              onClick={onConnect}
            >
              {t(needsReconnect ? 'gmail.reconnect' : 'gmail.connect')}
            </Button>
          )}
        </Box>

        {isConnected && connection && (
          <ListCard py="2px">
            <SwitchRow
              title={t('gmail.autoDetect')}
              hint={t('gmail.autoDetectHint')}
              isOn={connection.autoDetectEnabled}
              onToggle={() => onToggle('autoDetectEnabled')}
            />
            <SwitchRow
              title={t('gmail.notifyIncome')}
              isOn={connection.notifyIncomeEnabled}
              onToggle={() => onToggle('notifyIncomeEnabled')}
            />
          </ListCard>
        )}

        <Group
          action={
            <Button
              variant="ghost"
              h="44px"
              my="-8px"
              px="8px"
              mr="-8px"
              color="brand.text"
              fontSize="13.5px"
              fontWeight={600}
              leftIcon={<PlusIcon boxSize="14px" />}
              iconSpacing="4px"
              onClick={addBank.onOpen}
            >
              {t('gmail.banks.add')}
            </Button>
          }
        >
          {t('gmail.banks.title')}
        </Group>
        {institutions.length === 0 ? (
          <Help>{t('gmail.banks.empty')}</Help>
        ) : (
          institutions.map(institution => (
            <BankCard
              key={institution.id}
              institution={institution}
              onOpen={() => setOpenBankId(institution.id)}
            />
          ))
        )}

        {isConnected && (
          <Button
            variant="ghost"
            h="44px"
            mt="4px"
            color="money.expenseText"
            fontSize="14px"
            fontWeight={600}
            isLoading={busy === 'disconnect'}
            onClick={onDisconnect}
          >
            {t('gmail.disconnect')}
          </Button>
        )}
      </Stack>

      <AddBankSheet
        isOpen={addBank.isOpen}
        onClose={addBank.onClose}
        institutions={institutions}
        parsers={parsers}
        onSaved={mutateInstitutions}
      />
      <BankSheet
        institution={openBank}
        onClose={() => setOpenBankId(null)}
        onSaved={mutateInstitutions}
      />
    </SettingsLayout>
  )
}

export const getStaticProps = settingsStaticProps
