import {
  AuthIllustration,
  AuthLead,
  AuthScreen,
  AuthTitle
} from '@/components/auth/AuthScreen'
import { CodeInput } from '@/components/design/settings'
import { ShieldIcon } from '@/components/icons/app'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { HttpMethod } from '@/enums'
import { LoginSuccessResponse, PRE_AUTH_TOKEN_STORAGE_KEY } from '@/interfaces'
import { localApiService } from '@/lib'
import { HttpError } from '@/lib/apiService'
import {
  Box,
  Button,
  ListItem,
  OrderedList,
  Stack,
  Text,
  useDisclosure
} from '@chakra-ui/react'
import { signIn, useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'

/** When the pre-auth token stops working (its JWT `exp`, in ms), or null
 * if it can't be read. Only for the countdown: the backend decides. */
const expiryOf = (token: string): number | null => {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const { exp } = JSON.parse(json) as { exp?: number }
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

const formatSeconds = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

/**
 * Código 2FA al iniciar sesión (docs/diseno-mobile.html, 12): six boxes
 * with the numeric keyboard and one-time-code autofill, sent by themselves
 * on the sixth digit. The step expires with the pre-auth token (5 min):
 * a countdown says so, and when it runs out it's back to the login.
 */
export const VerifyTwoFactorView = () => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const lostAccess = useDisclosure()
  const { status } = useSession()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  // Only reachable right after the password step. Checked once, on
  // arrival: after a successful code the token is removed on purpose, and
  // re-checking then would bounce to the login instead of the dashboard.
  const checkedArrival = useRef(false)
  useEffect(() => {
    if (checkedArrival.current) return
    checkedArrival.current = true
    const token = sessionStorage.getItem(PRE_AUTH_TOKEN_STORAGE_KEY)
    if (!token) {
      // Already signed in (e.g. this screen remounted right after the
      // code worked): the middleware takes it to the dashboard.
      if (status !== 'authenticated') router.replace('/auth/login')
      return
    }
    setExpiresAt(expiryOf(token))
  }, [router, status])

  useEffect(() => {
    if (expiresAt === null) return
    const tick = () =>
      setSecondsLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [expiresAt])

  const isExpired = secondsLeft === 0

  const backToLogin = () => {
    sessionStorage.removeItem(PRE_AUTH_TOKEN_STORAGE_KEY)
    router.replace('/auth/login')
  }

  const verify = async (value: string) => {
    const preAuthToken = sessionStorage.getItem(PRE_AUTH_TOKEN_STORAGE_KEY)
    if (!preAuthToken) return backToLogin()
    if (value.length !== 6 || isVerifying || isExpired) return
    setIsVerifying(true)
    setError(null)
    try {
      const response = await localApiService.request<LoginSuccessResponse>({
        endPoint: '/proxy/login-verify-2fa',
        method: HttpMethod.POST,
        data: { preAuthToken, token: value }
      })
      const result = await signIn('credentials', {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        accessTokenExpiresIn: String(response.accessTokenExpiresIn),
        redirect: false,
        callbackUrl: '/dashboard'
      })
      if (result?.error) throw new Error(result.error)
      // Navigate first: signing in re-renders the app (and may remount this
      // screen), and the arrival check must still find the token until
      // we've left.
      await router.replace('/dashboard')
      sessionStorage.removeItem(PRE_AUTH_TOKEN_STORAGE_KEY)
    } catch (verifyError) {
      setCode('')
      setError(
        t(
          verifyError instanceof HttpError && verifyError.status === 401
            ? 'account.twoFactor.wrongCode'
            : 'account.twoFactor.error'
        )
      )
      setIsVerifying(false)
    }
  }

  return (
    <AuthScreen
      title={t('account.twoFactor.pageTitle')}
      back={{ href: '/auth/login', label: t('account.back') }}
    >
      <Stack spacing="14px" pt="8px">
        <AuthIllustration size="72px" icon={<ShieldIcon boxSize="34px" />} />
        <AuthTitle center>{t('account.twoFactor.title')}</AuthTitle>
        <AuthLead center>{t('account.twoFactor.lead')}</AuthLead>

        {isExpired ? (
          <Stack spacing="12px" pt="6px" role="alert">
            <Text textAlign="center" fontSize="14px" color="money.expenseText">
              {t('account.twoFactor.expired')}
            </Text>
            <Button variant="brand" size="cta" onClick={backToLogin}>
              {t('account.twoFactor.signInAgain')}
            </Button>
          </Stack>
        ) : (
          <>
            <Box pt="4px">
              <CodeInput
                value={code}
                onChange={value => {
                  setCode(value)
                  setError(null)
                }}
                onComplete={verify}
                digitLabel={position =>
                  t('account.twoFactor.digit', { position })
                }
                isInvalid={!!error}
                isDisabled={isVerifying}
              />
            </Box>
            {error && (
              <Text
                role="alert"
                textAlign="center"
                fontSize="13px"
                color="money.expenseText"
              >
                {error}
              </Text>
            )}
            {secondsLeft !== null && (
              <Text textAlign="center" fontSize="12.5px" color="text.secondary">
                {t('account.twoFactor.expiresIn', {
                  time: formatSeconds(secondsLeft)
                })}
              </Text>
            )}
          </>
        )}

        <Button
          variant="ghost"
          h="44px"
          color="brand.text"
          fontSize="13.5px"
          fontWeight={600}
          onClick={lostAccess.onOpen}
        >
          {t('account.twoFactor.lostAccess')}
        </Button>
      </Stack>

      <BottomSheet
        isOpen={lostAccess.isOpen}
        onClose={lostAccess.onClose}
        title={t('account.twoFactor.lostTitle')}
      >
        <Stack spacing="12px" pb="12px" fontSize="14px" lineHeight="1.5">
          <Text color="text.secondary">{t('account.twoFactor.lostIntro')}</Text>
          <OrderedList spacing="8px" color="text.primary" pl="4px">
            <ListItem>{t('account.twoFactor.lostStep1')}</ListItem>
            <ListItem>{t('account.twoFactor.lostStep2')}</ListItem>
            <ListItem>{t('account.twoFactor.lostStep3')}</ListItem>
          </OrderedList>
          <Text color="text.secondary">{t('account.twoFactor.lostNoKey')}</Text>
        </Stack>
      </BottomSheet>
    </AuthScreen>
  )
}
