import {
  Chevron,
  Group,
  IconBox,
  ListCard,
  ListRow,
  StatusCardHeader,
  StatusPill
} from '@/components/design/settings'
import { KeyIcon, ShieldIcon } from '@/components/icons/app'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { settingsStaticProps } from '@/components/settings/settingsStaticProps'
import { useSettingsRequest } from '@/components/settings/useSettingsRequest'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { useConfirm } from '@/components/ui/ConfirmSheet'
import { HttpMethod } from '@/enums'
import type { Profile } from '@/interfaces'
import { useApi, useRevalidateApi } from '@/lib/useApi'
import {
  Box,
  Button,
  HStack,
  PinInput,
  PinInputField,
  Text,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import NextLink from 'next/link'
import { useState } from 'react'

const CODE_LENGTH = 6

/** design .otp div: 46 × 56 box, 24 px digit, brand border on focus. */
const OTP_FIELD_STYLE = {
  w: '46px',
  h: '56px',
  borderRadius: '14px',
  border: '1.5px solid',
  borderColor: 'field.border',
  bg: 'bg.surface',
  fontSize: '24px',
  fontWeight: 'bold',
  color: 'text.primary',
  _focusVisible: { borderColor: 'brand.solid', borderWidth: '2px' }
} as const

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
      <HStack justify="center" spacing="8px">
        <PinInput
          otp
          type="number"
          placeholder=""
          autoFocus
          value={code}
          onChange={value => {
            setCode(value)
            setHasError(false)
          }}
          // Sent on the sixth digit, like the design's 2FA screens.
          onComplete={submit}
          isInvalid={hasError}
          isDisabled={isSaving}
        >
          {Array.from({ length: CODE_LENGTH }, (_, index) => (
            <PinInputField
              key={index}
              {...OTP_FIELD_STYLE}
              aria-label={t('security.codeDigit', { position: index + 1 })}
              {...(index === 0 ? { autoComplete: 'one-time-code' } : {})}
            />
          ))}
        </PinInput>
      </HStack>
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
 * state and one button, and changing the password by email. "Cerrar sesión
 * en todos los dispositivos" waits for its backend endpoint.
 */
export default function SecuritySettingsPage() {
  const { t } = useTranslation('settings')
  const toast = useToast()
  const confirm = useConfirm()
  const request = useSettingsRequest()
  const revalidateApi = useRevalidateApi()
  const disableSheet = useDisclosure()
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
        title: t('security.passwordTitle'),
        description: t('security.passwordDescription', {
          email: profile.email
        }),
        confirmLabel: t('security.passwordConfirm')
      }))
    )
      return
    try {
      await request('/proxy/request-reset-password', HttpMethod.PATCH, {
        email: profile.email
      })
      toast({
        title: t('security.passwordSent'),
        description: t('security.passwordSentDescription', {
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
            href="/profile/2fa"
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
          <Group>{t('security.password')}</Group>
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

      <DisableTwoFactorSheet
        isOpen={disableSheet.isOpen}
        onClose={disableSheet.onClose}
        onDisabled={() => revalidateApi('auth/profile')}
      />
    </SettingsLayout>
  )
}

export const getStaticProps = settingsStaticProps
