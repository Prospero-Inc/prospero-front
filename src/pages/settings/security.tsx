import {
  Chevron,
  CodeInput,
  Group,
  Help,
  IconBox,
  ListCard,
  ListRow,
  StatusCardHeader,
  StatusPill
} from '@/components/design/settings'
import { KeyIcon, ShieldIcon, SignOutIcon } from '@/components/icons/app'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { settingsStaticProps } from '@/components/settings/settingsStaticProps'
import { useSettingsRequest } from '@/components/settings/useSettingsRequest'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { useConfirm } from '@/components/ui/ConfirmSheet'
import { HttpMethod } from '@/enums'
import type { Profile } from '@/interfaces'
import { signOutAndUnsubscribePush } from '@/lib/signOutAndUnsubscribePush'
import { useApi, useRevalidateApi } from '@/lib/useApi'
import { Box, Button, Text, useDisclosure, useToast } from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import NextLink from 'next/link'
import { useState } from 'react'

const CODE_LENGTH = 6

/** Asks for the authenticator's code before turning 2FA off: a stolen
 * session alone can't lower the account's security. */
const DisableTwoFactorSheet = ({
  isOpen,
  onClose,
  onDisabled
}: {
  isOpen: boolean
  onClose: () => void
  onDisabled: () => Promise<unknown>
}) => {
  const { t } = useTranslation('settings')
  const toast = useToast()
  const request = useSettingsRequest()
  const [code, setCode] = useState('')
  const [hasError, setHasError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const close = () => {
    setCode('')
    setHasError(false)
    onClose()
  }

  const submit = async (value: string) => {
    if (value.length !== CODE_LENGTH || isSaving) return
    setIsSaving(true)
    setHasError(false)
    try {
      await request('/proxy/disable-2fa', HttpMethod.POST, { token: value })
      await onDisabled()
      toast({ title: t('security.disabled'), status: 'success' })
      close()
    } catch {
      setCode('')
      setHasError(true)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={close}
      title={t('security.disableTitle')}
      footer={
        <Button
          variant="dangerSolid"
          size="cta"
          w="full"
          isDisabled={code.length !== CODE_LENGTH}
          isLoading={isSaving}
          onClick={() => submit(code)}
        >
          {t('security.disable')}
        </Button>
      }
    >
      <Text fontSize="14px" color="text.secondary" lineHeight="1.5" mb="18px">
        {t('security.disableDescription')}
      </Text>
      <CodeInput
        value={code}
        onChange={value => {
          setCode(value)
          setHasError(false)
        }}
        // Sent on the sixth digit, like the design's 2FA screens.
        onComplete={submit}
        digitLabel={position => t('security.codeDigit', { position })}
        isInvalid={hasError}
        isDisabled={isSaving}
      />
      {hasError && (
        <Text
          role="alert"
          textAlign="center"
          fontSize="13px"
          color="money.expenseText"
          mt="10px"
        >
          {t('security.wrongCode')}
        </Text>
      )}
    </BottomSheet>
  )
}

/**
 * Seguridad (docs/diseno-mobile.html, 09): two-step verification with its
 * state and one button, changing the password by email, and signing out of
 * every device.
 */
export default function SecuritySettingsPage() {
  const { t } = useTranslation('settings')
  const toast = useToast()
  const confirm = useConfirm()
  const request = useSettingsRequest()
  const revalidateApi = useRevalidateApi()
  const disableSheet = useDisclosure()
  const { data: session } = useSession()
  const { data, error } = useApi<{ user: Profile }>('auth/profile')
  const profile = data?.user
  const isOn = profile?.enable2FA ?? false

  // There's no "change password" endpoint for a signed-in user: the
  // password-reset email to their own address does the job (and proves
  // they still own the mailbox).
  const onChangePassword = async () => {
    if (!profile) return
    if (
      !(await confirm({
        title: t('security.resetLinkTitle'),
        description: t('security.resetLinkDescription', {
          email: profile.email
        }),
        confirmLabel: t('security.resetLinkConfirm')
      }))
    )
      return
    try {
      await request('/proxy/request-reset-password', HttpMethod.PATCH, {
        email: profile.email
      })
      toast({
        title: t('security.resetLinkSent'),
        description: t('security.resetLinkSentDescription', {
          email: profile.email
        }),
        status: 'success',
        isClosable: true
      })
    } catch (sendError) {
      toast({
        title: t('error'),
        description: sendError instanceof Error ? sendError.message : undefined,
        status: 'error'
      })
    }
  }

  // Revokes every refresh token (other devices can't renew their session
  // and drop out within 15 minutes), then signs this one out right away.
  const onSignOutEverywhere = async () => {
    if (
      !(await confirm({
        title: t('security.everywhereTitle'),
        description: t('security.everywhereDescription'),
        confirmLabel: t('security.everywhereConfirm'),
        destructive: true
      }))
    )
      return
    try {
      await request('/proxy/logout-all', HttpMethod.POST)
      await signOutAndUnsubscribePush(session?.accessToken, {
        callbackUrl: '/auth/login'
      })
    } catch (signOutError) {
      toast({
        title: t('error'),
        description:
          signOutError instanceof Error ? signOutError.message : undefined,
        status: 'error'
      })
    }
  }

  return (
    <SettingsLayout
      title={t('security.title')}
      isLoading={data === undefined && !error}
    >
      <Box layerStyle="statusCard">
        <StatusCardHeader
          icon={
            <IconBox
              size="44px"
              icon={<ShieldIcon boxSize="22px" />}
              bg={isOn ? 'tint.income' : 'button.soft'}
              color={isOn ? 'money.incomeText' : 'text.secondary'}
            />
          }
          title={t('security.twoFactor')}
          status={
            <StatusPill isOn={isOn}>
              {t(isOn ? 'security.statusOn' : 'security.statusOff')}
            </StatusPill>
          }
        />
        <Text
          fontSize="12.5px"
          color="text.secondary"
          lineHeight="1.45"
          my="12px"
        >
          {t('security.twoFactorDescription')}
        </Text>
        {isOn ? (
          <Button
            variant="danger"
            size="ctaSm"
            w="full"
            onClick={disableSheet.onOpen}
          >
            {t('security.disable')}
          </Button>
        ) : (
          <Button
            as={NextLink}
            href="/settings/security/2fa"
            variant="brand"
            size="ctaSm"
            w="full"
          >
            {t('security.enable')}
          </Button>
        )}
      </Box>

      {profile && !profile.isGoogleAccount && (
        <>
          <Group>{t('security.accessGroup')}</Group>
          <ListCard>
            <ListRow
              onClick={onChangePassword}
              icon={<IconBox icon={<KeyIcon boxSize="18px" />} />}
              label={t('security.changePassword')}
              value={<Chevron />}
            />
          </ListCard>
        </>
      )}

      <Group>{t('security.sessions')}</Group>
      <ListCard>
        <ListRow
          onClick={onSignOutEverywhere}
          color="money.expenseText"
          icon={
            <IconBox
              icon={<SignOutIcon boxSize="18px" />}
              bg="tint.expense"
              color="money.expense"
            />
          }
          label={t('security.everywhere')}
        />
      </ListCard>
      <Help>{t('security.everywhereHelp')}</Help>

      <DisableTwoFactorSheet
        isOpen={disableSheet.isOpen}
        onClose={disableSheet.onClose}
        onDisabled={() => revalidateApi('auth/profile')}
      />
    </SettingsLayout>
  )
}

export const getStaticProps = settingsStaticProps
