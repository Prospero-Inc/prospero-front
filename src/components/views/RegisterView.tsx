import { HttpMethod } from '@/enums'
import { useYupValidationResolver } from '@/hooks/useYupValidationResolver'
import registerJson from '@/languages/es/register.json'
import language from '@/languages/es/register.json'
import apiService from '@/lib/apiService'
import {
  Stack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Box,
  Image,
  Text,
  Container,
  Link,
  useToast
} from '@chakra-ui/react'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'

import { PasswordInput } from '../ui'

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
    ),
  name: yup.string().required(language.yupSchema.firstName),
  lastName: yup.string().required(language.yupSchema.lastName),
  userName: yup.string().required(language.yupSchema.userName)
})
interface RegisterViewProps {
  name: string
  lastName: string
  email: string
  password: string
  userName: string
}
export const RegisterView = () => {
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()
  const router = useRouter()
  const {
    control,
    formState: { errors },
    handleSubmit
  } = useForm({
    resolver: useYupValidationResolver(validationSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      lastName: '',
      userName: ''
    }
  })

  const onSubmit = async ({
    email,
    lastName,
    name: firstName,
    password,
    userName
  }: RegisterViewProps) => {
    try {
      setIsLoading(true)

      toast.promise(
        apiService.request<RegisterViewProps>({
          method: HttpMethod.POST,
          endPoint: '/auth/signup',
          data: {
            email,
            lastName,
            firstName,
            password,
            usernName: userName
          }
        }),
        {
          success: () => {
            setIsLoading(false)
            router.push('/auth/login')
            return {
              title: 'Cuenta creada',
              description: 'Cuenta creada con exito',
              status: 'success',
              isClosable: true
            }
          },
          loading: {
            title: 'Creando cuenta',
            description: 'Estamos creando tu cuenta, por favor espera',
            colorScheme: 'primary'
          },
          error: error => {
            setIsLoading(false)
            return {
              title: 'Error',
              description: error?.message ?? 'Error al crear la cuenta'
            }
          }
        }
      )
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al crear la cuenta',
        status: 'error',
        isClosable: true
      })
    }
  }
  return (
    <Container flex={1} p={2}>
      <Image
        mt={['0em', '10em']}
        mx="auto"
        height={['2em', '3.5em']}
        src="/assets/authBrand.svg"
        alt="Prospero Logo"
      />
      <Stack textAlign={'center'}>
        <Heading fontSize={['2xl', '4x', '6xl']} textAlign="center">
          {registerJson.heading}
        </Heading>
        <Text fontSize={['md', 'lg']} color="gray.600">
          {registerJson.text.one}{' '}
          <Text as="span" fontWeight="bold" color="primary.600">
            {registerJson.text.two}
          </Text>
          {registerJson.text.three}
        </Text>
      </Stack>
      <Box as="form" onSubmit={handleSubmit(onSubmit)} mt={4}>
        <Stack spacing={4}>
          <FormControl>
            <FormLabel>{registerJson.form.labelFirstName}</FormLabel>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <Input type="text" {...field} placeholder="John" />
              )}
            />
            {errors.name && <Text color="red">{errors.name.message}</Text>}
          </FormControl>
          <FormControl id="lastName">
            <FormLabel>{registerJson.form.labelLastName}</FormLabel>
            <Controller
              control={control}
              name="lastName"
              render={({ field }) => (
                <Input type="text" {...field} placeholder="Doe" />
              )}
            />

            {errors.lastName && (
              <Text color="red">{errors.lastName.message}</Text>
            )}
          </FormControl>
          <FormControl>
            <FormLabel>{registerJson.form.labelUsername}</FormLabel>
            <Controller
              control={control}
              name="userName"
              render={({ field }) => (
                <Input type="text" {...field} placeholder="johnDoe" />
              )}
            />
            {errors.lastName && (
              <Text color="red">{errors.lastName.message}</Text>
            )}
          </FormControl>
          <FormControl id="email">
            <FormLabel>{registerJson.form.labelEmail}</FormLabel>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input colorScheme="primary.500" type="email" {...field} />
              )}
            />
            {errors.email && <Text color="red">{errors.email.message}</Text>}
          </FormControl>
          <FormControl id="password">
            <FormLabel>{registerJson.form.labelPassword}</FormLabel>
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <PasswordInput size={['sm', 'md', 'lg']} {...field} />
              )}
            />
            {errors.password && (
              <Text color="red">{errors.password.message}</Text>
            )}
          </FormControl>
          <Link
            as={NextLink}
            fontSize={['small', 'medium']}
            ml="auto"
            variant={'brandPrimary'}
            href="/auth/login"
          >
            {registerJson.backLink}
          </Link>
          <Stack spacing={6}>
            <Button
              type="submit"
              bg="primary.400"
              color="white"
              _hover={{ bg: 'primary.500' }}
              isLoading={isLoading}
            >
              {registerJson.submit}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Container>
  )
}
