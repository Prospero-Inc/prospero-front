import { HttpMethod } from '@/enums'
import { useYupValidationResolver } from '@/hooks/useYupValidationResolver'
import language from '@/language/es/forgot-password.json'
import apiService from '@/lib/apiService'
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
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'
const validationSchema = yup.object().shape({
  email: yup.string().email().required()
})
export const ForgotPasswordView = () => {
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
    toast.promise(
      apiService
        .request<{ email: string }>({
          method: HttpMethod.PATCH,
          data,
          endPoint: '/auth/request-reset-password'
        })
        .finally(() => {
          setisLoading(false)
        }),
      {
        loading: {
          title: language.toast.loading.title,
          description: language.toast.loading.description
        },
        success: () => {
          router.replace('/auth/login')
          return {
            title: language.toast.success.title,
            description: language.toast.success.description,
            status: 'success'
          }
        },
        error: () => {
          return {
            title: language.toast.error.title,
            description: language.toast.error.description,
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
      <Heading>{language.title}</Heading>
      <Text my={4}>{language.descriptionBlockOne}</Text>
      <Text my={4}>{language.descriptionBlockTwo}</Text>
      <FormControl my={2}>
        <FormLabel color={'gray'} fontSize={['small', 'medium']}>
          {language.inputLabel}
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
        {language.backToLogin}
      </Link>
      <Button
        colorScheme="primary"
        my={2}
        type="submit"
        h={['3em', '4em']}
        isLoading={isLoading}
      >
        {language.submitButton}
      </Button>
    </Stack>
  )
}
