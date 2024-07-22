import { PasswordInput } from '@/components/ui'
import { useYupValidationResolver } from '@/hooks/useYupValidationResolver'
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
import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'
const validationSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters long')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d])(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/,
      'Password must contain at least one lowercase letter, one uppercase letter, one digit, one special character, and one dot'
    )
})
interface LoginViewProps {
  email: string
  password: string
}
export const LoginView = () => {
  const router = useRouter()
  const toast = useToast()

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
    const resp: SignInResponse | undefined = await signIn('credentials', {
      ...data,
      redirect: false,
      callbackUrl: '/dashboard'
    })

    console.log({ resp })
    if (resp?.error)
      return toast({
        title: 'Error',
        description: resp.error ?? 'Error signing in',
        status: 'error',
        duration: 5000,
        isClosable: true
      })

    if (resp?.url) return router.replace('/dashboard')
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
          E-mail
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
          Password
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
        href="/auth/forgot-password"
      >
        Olvidaste tu contraseña?
      </Link>
      <Button colorScheme="primary" my={2} type="submit" h={['3em', '4em']}>
        Entrar
      </Button>
    </Stack>
  )
}
