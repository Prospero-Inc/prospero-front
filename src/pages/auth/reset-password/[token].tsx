import {
  AuthField,
  AuthIllustration,
  AuthLead,
  AuthPasswordInput,
  AuthScreen,
  AuthTitle,
  meetsPasswordPolicy,
  PasswordRules
} from '@/components/auth/AuthScreen'
import { AlertIcon, CheckIcon } from '@/components/icons/app'
import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
import { HttpError } from '@/lib/apiService'
import { Box, Button, Stack, Text } from '@chakra-ui/react'
import { GetServerSideProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { type FormEvent, useState } from 'react'

type Status = 'form' | 'done' | 'invalid'

/**
 * Restablecer contraseña (docs/diseno-mobile.html, 12): where the emailed
 * reset link lands (`${API_BASE_URL_RESET}auth/reset-password/<token>`).
 * Used to be the separate change-password app, English only. Same live
 * rules as the registration plus "Coinciden", and a way to sign in after.
 */
export default function ResetPasswordPage() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const token = typeof router.query.token === 'string' ? router.query.token : ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<Status>('form')

  const matches = password !== '' && password === confirmation
  const isValid = meetsPasswordPolicy(password) && matches

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (!isValid || !token) return
    setIsSaving(true)
    setError(null)
    try {
      await localApiService.request({
        method: HttpMethod.POST,
        endPoint: `/proxy/reset-password?token=${encodeURIComponent(token)}`,
        data: { password, confirmPassword: confirmation },
        headers: { 'x-lang': router.locale ?? 'es' }
      })
      setStatus('done')
    } catch (resetError) {
      // 422: unknown, expired or already used link.
      if (resetError instanceof HttpError && resetError.status === 422)
        setStatus('invalid')
      else
        setError(
          resetError instanceof Error
            ? resetError.message
            : t('account.reset.error')
        )
    } finally {
      setIsSaving(false)
    }
  }

  if (status !== 'form')
    return (
      <AuthScreen title={t('account.reset.pageTitle')}>
        <Stack spacing="14px" pt="28px" role="status">
          <AuthIllustration
            icon={
              status === 'done' ? (
                <CheckIcon boxSize="46px" />
              ) : (
                <AlertIcon boxSize="42px" />
              )
            }
          />
          <AuthTitle center>{t(`account.reset.${status}.title`)}</AuthTitle>
          <AuthLead center fontSize="14.5px">
            {t(`account.reset.${status}.text`)}
          </AuthLead>
          <Button
            as={NextLink}
            href={status === 'done' ? '/auth/login' : '/auth/forgot-password'}
            variant="brand"
            size="cta"
            mt="6px"
          >
            {t(`account.reset.${status}.button`)}
          </Button>
        </Stack>
      </AuthScreen>
    )

  return (
    <AuthScreen
      title={t('account.reset.pageTitle')}
      back={{ href: '/auth/login', label: t('account.signIn') }}
    >
      <Box mt="4px" mb="6px">
        <AuthTitle>{t('account.reset.title')}</AuthTitle>
      </Box>
      <Box mb="20px">
        <AuthLead>{t('account.reset.lead')}</AuthLead>
      </Box>
      <Box as="form" method="post" noValidate onSubmit={onSubmit}>
        <AuthField
          id="reset-password"
          label={t('account.reset.new')}
          error={
            submitted && !meetsPasswordPolicy(password)
              ? t('account.register.weakSecret')
              : undefined
          }
        >
          <AuthPasswordInput
            id="reset-password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
          />
        </AuthField>
        <AuthField
          id="reset-confirmation"
          label={t('account.reset.repeat')}
          error={
            submitted && !matches ? t('account.reset.mismatch') : undefined
          }
        >
          <AuthPasswordInput
            id="reset-confirmation"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmation}
            onChange={event => setConfirmation(event.target.value)}
          />
        </AuthField>
        <PasswordRules
          value={password}
          extra={[{ label: t('account.rules.match'), ok: matches }]}
        />
        {error && (
          <Text
            role="alert"
            fontSize="13px"
            color="money.expenseText"
            mb="12px"
            mx="2px"
          >
            {error}
          </Text>
        )}
        <Button
          type="submit"
          variant="brand"
          size="cta"
          w="full"
          isLoading={isSaving}
        >
          {t('account.reset.submit')}
        </Button>
      </Box>
    </AuthScreen>
  )
}

// Rendered per request: one cached page per reset token would be pointless
// (and would keep tokens on disk).
export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale as string, ['common']))
  }
})
