import {
  AuthField,
  AuthLead,
  AuthScreen,
  AuthTitle,
  SentNotice
} from '@/components/auth/AuthScreen'
import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
import { Box, Button, Input, Text } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { type FormEvent, useState } from 'react'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * ¿Olvidaste tu contraseña? (docs/diseno-mobile.html, 12): one field, and
 * the same "check your email" answer whether or not the account exists —
 * as the backend already does — shown in place instead of a toast.
 */
export const ForgotPasswordView = () => {
  const { t } = useTranslation('common')
  const { locale } = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const address = email.trim()
    if (!EMAIL.test(address)) {
      setError(t('account.register.invalidEmail'))
      return
    }
    setIsSending(true)
    setError(null)
    try {
      await localApiService.request({
        method: HttpMethod.PATCH,
        endPoint: '/proxy/request-reset-password',
        data: { email: address },
        headers: { 'x-lang': locale ?? 'es' }
      })
      setIsSent(true)
    } catch {
      setError(t('account.forgot.error'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <AuthScreen
      title={t('account.forgot.pageTitle')}
      back={{ href: '/auth/login', label: t('account.signIn') }}
    >
      <Box mt="4px" mb="6px">
        <AuthTitle>{t('account.forgot.title')}</AuthTitle>
      </Box>
      <Box mb="20px">
        <AuthLead>{t('account.forgot.lead')}</AuthLead>
      </Box>
      <Box as="form" method="post" noValidate onSubmit={onSubmit}>
        <AuthField
          id="forgot-email"
          label={t('account.register.email')}
          error={error ?? undefined}
        >
          <Input
            id="forgot-email"
            variant="design"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            value={email}
            onChange={event => {
              setEmail(event.target.value)
              setIsSent(false)
            }}
            isInvalid={!!error}
          />
        </AuthField>
        <Button
          type="submit"
          variant="brand"
          size="cta"
          w="full"
          mt="6px"
          isLoading={isSending}
        >
          {t(isSent ? 'account.forgot.resend' : 'account.forgot.submit')}
        </Button>
      </Box>
      {isSent && (
        <SentNotice title={t('account.forgot.sentTitle')}>
          {t('account.forgot.sentText')}
        </SentNotice>
      )}
      {isSent && (
        <Text fontSize="12.5px" color="text.secondary" mt="12px" mx="4px">
          {t('account.forgot.sentHint')}
        </Text>
      )}
    </AuthScreen>
  )
}
