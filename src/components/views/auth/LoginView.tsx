import { PasswordInput } from '@/components/ui'
import { CookiesEnum, HttpMethod } from '@/enums'
import { useYupValidationResolver } from '@/hooks/useYupValidationResolver'
import {
  isRequiresTwoFactorResponse,
  LoginResponse,
  PRE_AUTH_TOKEN_STORAGE_KEY
} from '@/interfaces'
import { localApiService } from '@/lib'
import { HttpError } from '@/lib/apiService'
import { cookiesPlugin } from '@/plugins'
import { Stack, useToast } from '@chakra-ui/react'
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Link,
  Text
} from '@chakra-ui/react'
import { signIn, SignInResponse } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'

// docs/diseno-mobile.html .lfield: 13 px label, 54 px field, 2 px brand
// border while focused.
const FIELD_LABEL_STYLE = {
  fontSize: '13px',
  fontWeight: 600,
  mb: '6px',
  color: 'field.label'
} as const
const FIELD_STYLE = {
  h: '54px',
  borderRadius: '14px',
  borderWidth: '1.5px',
  borderColor: 'field.border',
  bg: 'bg.surface',
  fontSize: '16px',
  px: '14px',
  _focusVisible: {
    borderColor: 'brand.solid',
    borderWidth: '2px',
    boxShadow: 'none'
  }
} as const

interface LoginViewProps {
  email: string
  password: string
}
export const LoginView = () => {
  const router = useRouter()
  const toast = useToast()
  const [isLoading, setLoading] = useState(false)
  const { t } = useTranslation('common')

  const validationSchema = yup.object().shape({
    email: yup
      .string()
      .email(t('login.yupSchema.email.email'))
      .required(t('login.yupSchema.email.required')),
    password: yup.string().required(t('login.yupSchema.password.required'))
  })
  const {
    control,
    formState: { errors },
    handleSubmit
  } = useForm({
    resolver: useYupValidationResolver(validationSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data: LoginViewProps) => {
    const lang = cookiesPlugin.getName(CookiesEnum.NEXT_LOCALE)
    setLoading(true)
    let toastId = null
    try {
      toastId = toast({
        title: t('login.toast.loading.title'),
        description: t('login.toast.loading.description'),
        status: 'loading',
        colorScheme: 'primary'
      })

      const loginResponse = await localApiService.request<LoginResponse>({
        endPoint: '/proxy/login',
        method: HttpMethod.POST,
        data: { email: data.email, password: data.password },
        headers: { 'x-lang': `${lang}` }
      })

      if (isRequiresTwoFactorResponse(loginResponse)) {
        sessionStorage.setItem(
          PRE_AUTH_TOKEN_STORAGE_KEY,
          loginResponse.preAuthToken
        )
        return router.push('/auth/verify-2fa')
      }

      const resp: SignInResponse | undefined = await signIn('credentials', {
        accessToken: loginResponse.accessToken,
        refreshToken: loginResponse.refreshToken,
        accessTokenExpiresIn: String(loginResponse.accessTokenExpiresIn),
        redirect: false,
        callbackUrl: '/dashboard'
      })

      if (resp?.error)
        return toast({
          title: t('login.toast.error.title'),
          description: resp.error ?? t('login.toast.error.description'),
          status: 'error',
          isClosable: true
        })

      if (resp?.url) return router.replace('/dashboard')
    } catch (error) {
      // 403 = correct credentials but the account was never activated —
      // send them to the page that explains it and can resend the link.
      if (error instanceof HttpError && error.status === 403)
        return router.push({
          pathname: '/auth/verify-account',
          query: { email: data.email }
        })

      toast({
        title: t('login.toast.error.title'),
        description:
          error instanceof Error
            ? error.message
            : t('login.toast.error.description'),
        status: 'error',
        isClosable: true
      })
    } finally {
      setLoading(false)
      toastId && toast.close(toastId)
    }
  }
  return (
    <Stack
      as={'form'}
      method="post"
      onSubmit={handleSubmit(onSubmit)}
      w={'full'}
      spacing={0}
    >
      <FormControl mb="14px" isInvalid={Boolean(errors.email)}>
        <FormLabel {...FIELD_LABEL_STYLE}>{t('login.labelEmail')}</FormLabel>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Input
              {...FIELD_STYLE}
              {...field}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              placeholder="ana@ejemplo.com"
            />
          )}
        />
        {errors.email && (
          <Text color="money.expenseText" fontSize="13px" mt="6px">
            {errors.email.message}
          </Text>
        )}
      </FormControl>
      <FormControl mb="14px" isInvalid={Boolean(errors.password)}>
        <FormLabel {...FIELD_LABEL_STYLE}>{t('login.labelPassword')}</FormLabel>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <PasswordInput
              {...FIELD_STYLE}
              pr="52px"
              autoComplete="current-password"
              {...field}
            />
          )}
        />
        {errors.password && (
          <Text color="money.expenseText" fontSize="13px" mt="6px">
            {errors.password.message}
          </Text>
        )}
      </FormControl>
      <Link
        as={NextLink}
        href="/auth/forgot-password"
        alignSelf="flex-end"
        mt="-2px"
        mb="20px"
        fontSize="13.5px"
        fontWeight={600}
        color="brand.text"
      >
        {t('login.forgotPasswordLink')}
      </Link>
      <Button
        type="submit"
        isLoading={isLoading}
        h="54px"
        borderRadius="16px"
        bg="brand.solid"
        color="white"
        fontSize="16px"
        fontWeight="bold"
        _hover={{ bg: 'brand.solid', opacity: 0.92 }}
        _active={{ opacity: 0.85 }}
      >
        {t('login.sigIn')}
      </Button>
      <Text textAlign="center" fontSize="14px" color="text.secondary" mt="18px">
        {t('login.noAccount')}{' '}
        <Link
          as={NextLink}
          href="/auth/register"
          fontWeight="bold"
          color="brand.text"
        >
          {t('login.createAccount')}
        </Link>
      </Text>
    </Stack>
  )
}
