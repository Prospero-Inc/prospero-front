import { HttpMethod } from '@/enums'
import { useYupValidationResolver } from '@/hooks/useYupValidationResolver'
import { localApiService } from '@/lib'
import { HttpError } from '@/lib/apiService'
import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Icon,
  Image,
  Input,
  Link,
  Spinner,
  Stack,
  Text,
  useColorModeValue
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { IconType } from 'react-icons'
import {
  MdCheckCircleOutline,
  MdErrorOutline,
  MdMarkEmailRead,
  MdOutlineMailOutline,
  MdRefresh
} from 'react-icons/md'
import * as yup from 'yup'

type Status = 'verifying' | 'success' | 'error' | 'retry' | 'pending' | 'sent'

// Statuses the backend uses for a bad/unknown link. Anything else (429, 5xx,
// network) says nothing about the link, so it gets a retry instead of
// "invalid link".
const INVALID_LINK_STATUSES = [400, 401, 422]

const validationSchema = yup.object().shape({
  email: yup.string().email().required()
})

const STATUS_ICON: Record<Exclude<Status, 'verifying'>, IconType> = {
  success: MdCheckCircleOutline,
  error: MdErrorOutline,
  retry: MdRefresh,
  pending: MdOutlineMailOutline,
  sent: MdMarkEmailRead
}

const STATUS_COLOR: Record<Exclude<Status, 'verifying'>, string> = {
  success: 'green.400',
  error: 'red.400',
  retry: 'orange.400',
  pending: 'primary.400',
  sent: 'primary.400'
}

const firstQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

/**
 * Landing page for the account-verification email link
 * (`/auth/verify-account?id=..&code=..`). Without `id`/`code` it renders the
 * "check your inbox" state — LoginView sends inactive users here — with a
 * form to resend the link.
 */
export const VerifyAccountView = () => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [status, setStatus] = useState<Status>('verifying')
  const [isResending, setIsResending] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  // The activation token is single-use: React strict mode / a re-render must
  // not fire the request twice, or the second call fails and flips a
  // successful activation to the error state.
  const hasRequested = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [linkParams, setLinkParams] = useState<{
    id: string
    code: string
  } | null>(null)

  const cardBg = useColorModeValue('white', 'gray.700')
  const pageBg = useColorModeValue('gray.50', 'gray.800')
  const mutedText = useColorModeValue('gray.600', 'gray.300')

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<{ email: string }>({
    resolver: useYupValidationResolver(validationSchema),
    defaultValues: { email: '' }
  })

  useEffect(() => {
    if (!router.isReady || hasRequested.current) return
    hasRequested.current = true

    const id = firstQueryValue(router.query.id)
    const code = firstQueryValue(router.query.code)
    const email = firstQueryValue(router.query.email)
    if (email) reset({ email })

    if (!id || !code) {
      setStatus('pending')
      return
    }

    setLinkParams({ id, code })
  }, [router.isReady, router.query, reset])

  const verify = useCallback(async (params: { id: string; code: string }) => {
    setStatus('verifying')
    try {
      await localApiService.request({
        method: HttpMethod.GET,
        endPoint: '/proxy/activate-account',
        query: params
      })
      setStatus('success')
    } catch (error) {
      setStatus(
        error instanceof HttpError &&
          INVALID_LINK_STATUSES.includes(error.status)
          ? 'error'
          : 'retry'
      )
    }
  }, [])

  useEffect(() => {
    if (linkParams) void verify(linkParams)
  }, [linkParams, verify])

  // Move focus to the new heading so screen-reader and keyboard users land
  // on the result instead of wherever they were.
  useEffect(() => {
    if (status !== 'verifying') headingRef.current?.focus()
  }, [status])

  const onResend = async ({ email }: { email: string }) => {
    setIsResending(true)
    setResendError(null)
    try {
      await localApiService.request({
        method: HttpMethod.POST,
        endPoint: '/proxy/resend-verification',
        data: { email }
      })
      setStatus('sent')
    } catch {
      setResendError(t('verifyAccount.resend.error'))
    } finally {
      setIsResending(false)
    }
  }

  const showResendForm = status === 'error' || status === 'pending'

  return (
    <Flex minH={'100vh'} align={'center'} justify={'center'} bg={pageBg} px={4}>
      <Stack
        spacing={5}
        w={'full'}
        maxW={'md'}
        bg={cardBg}
        rounded={'xl'}
        boxShadow={'lg'}
        p={{ base: 6, md: 8 }}
        my={10}
        textAlign={'center'}
      >
        <Image
          src={'/assets/authBrand.svg'}
          alt="Prospero"
          maxH={'2.5rem'}
          mx={'auto'}
        />

        {status === 'verifying' ? (
          <Stack align={'center'} spacing={4} py={6} role="status">
            <Spinner
              size={'xl'}
              color={'primary.400'}
              thickness={'4px'}
              label={t('verifyAccount.verifying')}
            />
            <Text color={mutedText}>{t('verifyAccount.verifying')}</Text>
          </Stack>
        ) : (
          <Stack spacing={4} role="status">
            <Icon
              as={STATUS_ICON[status]}
              boxSize={16}
              color={STATUS_COLOR[status]}
              mx={'auto'}
              aria-hidden
            />
            <Heading
              as="h1"
              ref={headingRef}
              tabIndex={-1}
              outline={'none'}
              fontSize={{ base: '2xl', md: '3xl' }}
              lineHeight={1.2}
            >
              {t(`verifyAccount.${status}.heading`)}
            </Heading>
            <Text color={mutedText}>{t(`verifyAccount.${status}.text`)}</Text>
          </Stack>
        )}

        {status === 'success' && (
          <Button
            as={NextLink}
            href="/auth/login"
            colorScheme="primary"
            size={'lg'}
          >
            {t('verifyAccount.goToLogin')}
          </Button>
        )}

        {status === 'retry' && linkParams && (
          <Button
            colorScheme="primary"
            size={'lg'}
            onClick={() => void verify(linkParams)}
          >
            {t('verifyAccount.retry.button')}
          </Button>
        )}

        {status === 'sent' && (
          <Button variant={'outline'} onClick={() => setStatus('pending')}>
            {t('verifyAccount.sent.useAnotherEmail')}
          </Button>
        )}

        {showResendForm && (
          <Stack
            as="form"
            method="post"
            onSubmit={handleSubmit(onResend)}
            spacing={3}
            textAlign={'left'}
            pt={2}
          >
            <FormControl isInvalid={!!errors.email}>
              <FormLabel fontSize={'sm'} color={mutedText}>
                {t('verifyAccount.resend.label')}
              </FormLabel>
              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    placeholder="john@doe.com"
                    size={'lg'}
                  />
                )}
              />
              {errors.email && (
                <FormErrorMessage>
                  {t('verifyAccount.resend.invalidEmail')}
                </FormErrorMessage>
              )}
            </FormControl>
            {resendError && (
              <Text color={'red.400'} fontSize={'sm'} role="alert">
                {resendError}
              </Text>
            )}
            <Button
              type="submit"
              colorScheme="primary"
              size={'lg'}
              isLoading={isResending}
            >
              {t('verifyAccount.resend.submit')}
            </Button>
          </Stack>
        )}

        {status !== 'success' && status !== 'verifying' && (
          <Link
            as={NextLink}
            href="/auth/login"
            variant={'brandPrimary'}
            fontSize={'sm'}
          >
            {t('verifyAccount.backToLogin')}
          </Link>
        )}
      </Stack>
    </Flex>
  )
}
