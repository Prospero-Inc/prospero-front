import { PasswordInput } from '@/components/ui'
import { CookiesEnum } from '@/enums'
import { useYupValidationResolver } from '@/hooks/useYupValidationResolver'
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
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'

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
    password: yup
      .string()
      .required(t('login.yupSchema.password.required'))
      .min(8, t('login.yupSchema.password.minLength'))
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d])(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/,
        t('login.yupSchema.password.matches')
      )
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

      const resp: SignInResponse | undefined = await signIn('credentials', {
        email: data.email,
        password: data.password,
        lang,
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
      toast({
        title: t('login.toast.error.title'),
        description: t('login.toast.error.description'),
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
      onSubmit={handleSubmit(onSubmit)}
      w={'full'}
      justifyContent={'center'}
    >
      <FormControl my={2}>
        <FormLabel color={'gray'}>{t('login.labelEmail')}</FormLabel>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Input
              size={['md', 'md', 'lg']}
              {...field}
              placeholder="john@doe.com"
            />
          )}
        />
        {errors.email && <Text color="red">{errors.email.message}</Text>}
      </FormControl>
      <FormControl my={2}>
        <FormLabel color={'gray'}>{t('login.labelPassword')}</FormLabel>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <PasswordInput size={['md', 'md', 'lg']} {...field} />
          )}
        />
        {errors.password && <Text color="red">{errors.password.message}</Text>}
      </FormControl>
      <Link ml="auto" variant={'brandPrimary'} href="/auth/forgot-password">
        {t('login.forgotPasswordLink')}
      </Link>
      <Button colorScheme="primary" my={2} type="submit" isLoading={isLoading}>
        {t('login.sigIn')}
      </Button>
    </Stack>
  )
}
