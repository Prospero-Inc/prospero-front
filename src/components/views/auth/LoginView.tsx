import { PasswordInput } from '@/components/ui'
import { useYupValidationResolver } from '@/hooks/useYupValidationResolver'
import language from '@/languages/es/login.json'
import { useToast } from '@chakra-ui/react'
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Link,
  Stack,
  Text
} from '@chakra-ui/react'
import { signIn, SignInResponse } from 'next-auth/react'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'
const validationSchema = yup.object().shape({
  email: yup
    .string()
    .email(language.yupSchema.email.email)
    .required(language.yupSchema.email.required),
  password: yup
    .string()
    .required(language.yupSchema.password.required)
    .min(8, language.yupSchema.password.minLength)
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d])(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/,
      language.yupSchema.password.matches
    )
})
interface LoginViewProps {
  email: string
  password: string
}
export const LoginView = () => {
  const router = useRouter()
  const toast = useToast()
  const [isLoading, setLoading] = useState(false)
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
    setLoading(true)
    let toastId = null
    try {
      toastId = toast({
        title: language.toast.loading.title,
        description: language.toast.loading.description,
        status: 'loading',
        colorScheme: 'primary'
      })
      const resp: SignInResponse | undefined = await signIn('credentials', {
        ...data,
        redirect: false,
        callbackUrl: '/dashboard'
      })

      if (resp?.error)
        return toast({
          title: language.toast.error.title,
          description: resp.error ?? language.toast.error.description,
          status: 'error',
          isClosable: true
        })

      if (resp?.url) return router.replace('/dashboard')
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
      toastId && toast.close(toastId)
    }
  }
  return (
    <Stack
      maxW={'2xl'}
      as={'form'}
      onSubmit={handleSubmit(onSubmit)}
      w={'full'}
      justifyContent={'center'}
    >
      <FormControl my={2}>
        <FormLabel color={'gray'} fontSize={['small', 'medium']}>
          {language.labelEmail}
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
      <FormControl my={2}>
        <FormLabel color={'gray'} fontSize={['small', 'medium']}>
          {language.labelPassword}
        </FormLabel>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <PasswordInput size={['md', 'md', 'lg']} {...field} />
          )}
        />
        {errors.password && <Text color="red">{errors.password.message}</Text>}
      </FormControl>
      <Link
        fontSize={['small', 'medium']}
        ml="auto"
        variant={'brandPrimary'}
        href="/auth/forgot-password"
      >
        {language.forgotPassword}
      </Link>
      <Button
        colorScheme="primary"
        my={2}
        type="submit"
        h={['3em', '4em']}
        isLoading={isLoading}
      >
        {language.login}
      </Button>
    </Stack>
  )
}
