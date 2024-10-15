/* eslint-disable @typescript-eslint/no-unused-vars */
import { CookiesEnum, HttpMethod } from '@/enums'
import { useYupValidationResolver } from '@/hooks/useYupValidationResolver'
import { localApiService } from '@/lib/apiService'
import { cookiesPlugin } from '@/plugins'
import {
  Button,
  FormControl,
  FormLabel,
  Heading,
  Image,
  Input,
  Link,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'
const validationSchema = yup.object().shape({
  email: yup.string().email().required()
})
export const ForgotPasswordView = () => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [isLoading, setisLoading] = useState(false)
  const toast = useToast()
  const {
    control,
    formState: { errors },
    handleSubmit
  } = useForm({
    resolver: useYupValidationResolver(validationSchema),
    defaultValues: {
      email: ''
    }
  })

  const onSubmit = async (data: { email: string }) => {
    setisLoading(true)
    const lang = cookiesPlugin.getName(CookiesEnum.NEXT_LOCALE)
    toast.promise(
      localApiService
        .request<{ email: string }>({
          method: HttpMethod.PATCH,
          headers: {
            'x-lang': `${lang}`
          },
          data,
          endPoint: '/proxy/request-reset-password'
        })
        .finally(() => {
          setisLoading(false)
        }),
      {
        loading: {
          title: t('forgotPassword.toast.loading.title'),
          description: t('forgotPassword.toast.loading.description'),
          colorScheme: 'primary'
        },
        success: () => {
          router.replace('/auth/login')
          return {
            title: t('forgotPassword.toast.success.title'),
            description: t('forgotPassword.toast.success.description'),
            status: 'success'
          }
        },
        error: _error => {
          return {
            title: t('forgotPassword.toast.error.title'),
            description: t('forgotPassword.toast.error.description'),
            status: 'error'
          }
        }
      }
    )
  }
  return (
    <Stack
      maxW={'2xl'}
      as={'form'}
      onSubmit={handleSubmit(onSubmit)}
      w={'full'}
      justifyContent={'center'}
    >
      <Image src={'/assets/authBrand.svg'} alt="Brannd " mb="5rem" />
      <Heading>{t('forgotPassword.title')}</Heading>
      <Text my={4}>{t('forgotPassword.descriptionBlockOne')}</Text>
      <Text my={4}>{t('forgotPassword.descriptionBlockTwo')}</Text>
      <FormControl my={2}>
        <FormLabel color={'gray'} fontSize={['small', 'medium']}>
          {t('forgotPassword.inputLabel')}
        </FormLabel>
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

      <Link
        fontSize={['small', 'medium']}
        variant={'brandPrimary'}
        ml="auto"
        href="/auth/login"
      >
        {t('forgotPassword.backToLogin')}
      </Link>
      <Button
        colorScheme="primary"
        my={2}
        type="submit"
        h={['3em', '4em']}
        isLoading={isLoading}
      >
        {t('forgotPassword.submitButton')}
      </Button>
    </Stack>
  )
}
