import {
  AuthField,
  AuthIllustration,
  AuthLead,
  AuthScreen,
  AuthTitle
} from '@/components/auth/AuthScreen'
import { AlertIcon, CheckIcon, MailIcon } from '@/components/icons/app'
import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
import { HttpError } from '@/lib/apiService'
import {
  Box,
  Button,
  Flex,
  Input,
  Spinner,
  Stack,
  Text
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'

type LinkStatus = 'verifying' | 'success' | 'invalid' | 'retry'

// Statuses the backend uses for a bad/unknown link. Anything else (429, 5xx,
// network) says nothing about the link, so it gets a retry instead of
// "invalid link".
const INVALID_LINK_STATUSES = [400, 401, 422]

/** Seconds before "Reenviar correo" can be used again. */
const RESEND_COOLDOWN = 45

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The mail app to open for the address's provider, when we know it. */
const MAILBOXES: { domains: string[]; name: string; url: string }[] = [
  {
    domains: ['gmail.com', 'googlemail.com'],
    name: 'Gmail',
    url: 'https://mail.google.com/'
  },
  {
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'],
    name: 'Outlook',
    url: 'https://outlook.live.com/mail/'
  },
  {
    domains: ['yahoo.com', 'yahoo.es', 'ymail.com'],
    name: 'Yahoo Mail',
    url: 'https://mail.yahoo.com/'
  },
  {
    domains: ['icloud.com', 'me.com', 'mac.com'],
    name: 'iCloud Mail',
    url: 'https://www.icloud.com/mail'
  }
]

const mailboxOf = (email: string) => {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  return MAILBOXES.find(mailbox => mailbox.domains.includes(domain))
}

const firstQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

/** Counts down one second at a time while above 0. */
const useCountdown = () => {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (seconds <= 0) return
    const timer = setTimeout(() => setSeconds(left => left - 1), 1000)
    return () => clearTimeout(timer)
  }, [seconds])
  return [seconds, setSeconds] as const
}

const formatSeconds = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

/**
 * Two jobs on one route:
 * - "Revisá tu correo" (docs/diseno-mobile.html, 11): where registering (and
 *   logging in with an inactive account) lands — the address we wrote to,
 *   a button to open that mail app, resend with a cooldown, use another
 *   address.
 * - The activation link from that email (`?id=..&code=..`): activates the
 *   account and says how it went.
 */
export const VerifyAccountView = () => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [linkStatus, setLinkStatus] = useState<LinkStatus | null>(null)
  const [linkParams, setLinkParams] = useState<{
    id: string
    code: string
  } | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [cooldown, setCooldown] = useCountdown()
  // The activation token is single-use: a re-render must not fire the
  // request twice, or the second call fails and flips a successful
  // activation to the error state.
  const hasRead = useRef(false)

  useEffect(() => {
    if (!router.isReady || hasRead.current) return
    hasRead.current = true
    const id = firstQueryValue(router.query.id)
    const code = firstQueryValue(router.query.code)
    const queryEmail = firstQueryValue(router.query.email)
    if (id && code) {
      setLinkParams({ id, code })
      return
    }
    if (queryEmail && EMAIL.test(queryEmail)) {
      setEmail(queryEmail)
      // Just registered: the email went out a moment ago.
      if (firstQueryValue(router.query.sent) === '1')
        setCooldown(RESEND_COOLDOWN)
    } else setIsEditingEmail(true)
  }, [router.isReady, router.query, setCooldown])

  const verify = useCallback(async (params: { id: string; code: string }) => {
    setLinkStatus('verifying')
    try {
      await localApiService.request({
        method: HttpMethod.GET,
        endPoint: '/proxy/activate-account',
        query: params
      })
      setLinkStatus('success')
    } catch (error) {
      setLinkStatus(
        error instanceof HttpError &&
          INVALID_LINK_STATUSES.includes(error.status)
          ? 'invalid'
          : 'retry'
      )
    }
  }, [])

  useEffect(() => {
    if (linkParams) void verify(linkParams)
  }, [linkParams, verify])

  const resend = async (address: string) => {
    setIsResending(true)
    setEmailError(null)
    try {
      // The answer is the same whether or not the account exists.
      await localApiService.request({
        method: HttpMethod.POST,
        endPoint: '/proxy/resend-verification',
        data: { email: address }
      })
      setEmail(address)
      setIsEditingEmail(false)
      setCooldown(RESEND_COOLDOWN)
    } catch {
      setEmailError(t('account.checkEmail.resendError'))
    } finally {
      setIsResending(false)
    }
  }

  const onSubmitEmail = (event: FormEvent) => {
    event.preventDefault()
    const address = emailInput.trim()
    if (!EMAIL.test(address)) {
      setEmailError(t('account.register.invalidEmail'))
      return
    }
    void resend(address)
  }

  const pageTitle = t('account.checkEmail.pageTitle')

  // The activation link from the email.
  if (linkParams) {
    if (linkStatus === null || linkStatus === 'verifying')
      return (
        <AuthScreen title={pageTitle}>
          <Stack align="center" spacing="16px" pt="80px" role="status">
            <Spinner size="xl" color="brand.solid" thickness="4px" />
            <AuthLead center>{t('account.activate.verifying')}</AuthLead>
          </Stack>
        </AuthScreen>
      )
    const ok = linkStatus === 'success'
    return (
      <AuthScreen title={pageTitle}>
        <Stack spacing="14px" pt="28px" role="status">
          <AuthIllustration
            icon={
              ok ? <CheckIcon boxSize="46px" /> : <AlertIcon boxSize="42px" />
            }
          />
          <AuthTitle center>
            {t(`account.activate.${linkStatus}.title`)}
          </AuthTitle>
          <AuthLead center fontSize="14.5px">
            {t(`account.activate.${linkStatus}.text`)}
          </AuthLead>
          {ok && (
            <Button
              as={NextLink}
              href="/auth/login"
              variant="brand"
              size="cta"
              mt="6px"
            >
              {t('account.activate.goToLogin')}
            </Button>
          )}
          {linkStatus === 'retry' && (
            <Button
              variant="brand"
              size="cta"
              mt="6px"
              onClick={() => void verify(linkParams)}
            >
              {t('account.activate.retryButton')}
            </Button>
          )}
          {linkStatus === 'invalid' && (
            <Button
              variant="brand"
              size="cta"
              mt="6px"
              onClick={() => {
                setLinkStatus(null)
                setLinkParams(null)
                setIsEditingEmail(true)
              }}
            >
              {t('account.activate.newLink')}
            </Button>
          )}
        </Stack>
      </AuthScreen>
    )
  }

  // No address yet (or "Usar otro correo"): ask for it.
  if (isEditingEmail || !email)
    return (
      <AuthScreen
        title={pageTitle}
        back={{ href: '/auth/login', label: t('account.signIn') }}
      >
        <Box mt="4px" mb="6px">
          <AuthTitle>{t('account.checkEmail.askTitle')}</AuthTitle>
        </Box>
        <Box mb="20px">
          <AuthLead>{t('account.checkEmail.askLead')}</AuthLead>
        </Box>
        <Box as="form" method="post" noValidate onSubmit={onSubmitEmail}>
          <AuthField
            id="resend-email"
            label={t('account.register.email')}
            error={emailError ?? undefined}
          >
            <Input
              id="resend-email"
              variant="design"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              value={emailInput}
              onChange={event => setEmailInput(event.target.value)}
              isInvalid={!!emailError}
            />
          </AuthField>
          <Button
            type="submit"
            variant="brand"
            size="cta"
            w="full"
            mt="6px"
            isLoading={isResending}
          >
            {t('account.checkEmail.send')}
          </Button>
        </Box>
      </AuthScreen>
    )

  const mailbox = mailboxOf(email)
  return (
    <AuthScreen title={pageTitle}>
      <Stack spacing="14px" pt="28px" px="4px">
        <AuthIllustration icon={<MailIcon boxSize="46px" />} />
        <AuthTitle center>{t('account.checkEmail.title')}</AuthTitle>
        <AuthLead center fontSize="14.5px">
          {t('account.checkEmail.sentTo')}
        </AuthLead>
        <Flex
          align="center"
          justify="center"
          gap="10px"
          bg="field.bg"
          borderRadius="16px"
          px="14px"
          py="12px"
          fontSize="14px"
          fontWeight={600}
          color="text.primary"
          wordBreak="break-all"
        >
          <MailIcon boxSize="18px" color="text.secondary" flex="none" />
          {email}
        </Flex>
        <AuthLead center fontSize="13px">
          {t('account.checkEmail.hint')}
        </AuthLead>
        {mailbox && (
          <Button
            as="a"
            href={mailbox.url}
            target="_blank"
            rel="noopener noreferrer"
            variant="brand"
            size="cta"
            mt="6px"
          >
            {t('account.checkEmail.open', { name: mailbox.name })}
          </Button>
        )}
        <Button
          variant="soft"
          size="cta"
          isDisabled={cooldown > 0}
          isLoading={isResending}
          onClick={() => void resend(email)}
        >
          {t('account.checkEmail.resend')}
        </Button>
        {cooldown > 0 && (
          <Text
            textAlign="center"
            fontSize="12.5px"
            color="text.secondary"
            aria-live="polite"
          >
            {t('account.checkEmail.cooldown', {
              time: formatSeconds(cooldown)
            })}
          </Text>
        )}
        {emailError && (
          <Text
            textAlign="center"
            fontSize="13px"
            color="money.expenseText"
            role="alert"
          >
            {emailError}
          </Text>
        )}
        {/* A typo in the address: register again with the right one. */}
        <Button
          as={NextLink}
          href="/auth/register"
          variant="ghost"
          h="44px"
          mt="4px"
          color="brand.text"
          fontSize="13.5px"
          fontWeight={600}
        >
          {t('account.checkEmail.useAnother')}
        </Button>
      </Stack>
    </AuthScreen>
  )
}
