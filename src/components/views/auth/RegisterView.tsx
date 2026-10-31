import { PasswordInput } from '@/components/ui'
import { HttpMethod } from '@/enums'
import { useYupValidationResolver } from '@/hooks/useYupValidationResolver'
import { RegisterViewProps } from '@/interfaces'
import { localApiService } from '@/lib/apiService'
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
import { TFunction, useTranslation } from 'next-i18next'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'

const validationSchema = (t: TFunction) =>
  yup.object().shape({
    email: yup
      .string()
      .email(t('register.yupSchema.email.email'))
      .required(t('register.yupSchema.email.required')),
    password: yup
      .string()
      .required(t('register.yupSchema.password.required'))
      .min(8, t('register.yupSchema.password.minLength'))
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
        t('register.yupSchema.password.matches')
      ),
    name: yup.string().required(t('register.yupSchema.firstName')),
    lastName: yup.string().required(t('register.yupSchema.lastName')),
    userName: yup.string().required(t('register.yupSchema.userName'))
  })

export const RegisterView = () => {
  const { t } = useTranslation('common')
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()
  const router = useRouter()
  const {
    control,
    formState: { errors },
    handleSubmit
  } = useForm({
    resolver: useYupValidationResolver(validationSchema(t)),
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
        localApiService.request<RegisterViewProps>({
          method: HttpMethod.POST,
          endPoint: '/proxy/form',
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
            router.push({
              pathname: '/auth/verify-account',
              query: { email }
            })
            return {
              title: t('verifyAccount.registered.title'),
              description: t('verifyAccount.registered.description'),
              status: 'success',
              isClosable: true
            }
          },
          loading: {
            title: t('registerToast.loading.title'),
            description: t('registerToast.loading.description'),
            colorScheme: 'primary'
          },
          error: error => {
            setIsLoading(false)
            return {
              title: t('registerToast.error.title'),
              description:
                error?.message ?? t('registerToast.error.description')
            }
          }
        }
      )
    } catch (error) {
      toast({
        title: t('registerToast.error.title'),
        description: t('registerToast.error.description'),
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
          {t('register.heading')}
        </Heading>
        <Text fontSize={['md', 'lg']} color="gray.600">
          {t('register.text.one')}{' '}
          <Text as="span" fontWeight="bold" color="primary.600">
            {t('register.text.two')}
          </Text>
          {t('register.text.three')}{' '}
        </Text>
      </Stack>
      <Box as="form" method="post" onSubmit={handleSubmit(onSubmit)} mt={4}>
        <Stack spacing={4}>
          <FormControl>
            <FormLabel>{t('register.form.labelFirstName')}</FormLabel>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <Input
                  type="text"
                  autoComplete="given-name"
                  {...field}
                  placeholder="John"
                />
              )}
            />
            {errors.name && <Text color="red">{errors.name.message}</Text>}
          </FormControl>
          <FormControl id="lastName">
            <FormLabel>{t('register.form.labelLastName')}</FormLabel>
            <Controller
              control={control}
              name="lastName"
              render={({ field }) => (
                <Input
                  type="text"
                  autoComplete="family-name"
                  {...field}
                  placeholder="Doe"
                />
              )}
            />

            {errors.lastName && (
              <Text color="red">{errors.lastName.message}</Text>
            )}
          </FormControl>
          <FormControl>
            <FormLabel>{t('register.form.labelUsername')}</FormLabel>
            <Controller
              control={control}
              name="userName"
              render={({ field }) => (
                <Input
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  {...field}
                  placeholder="johnDoe"
                />
              )}
            />
            {errors.userName && (
              <Text color="red">{errors.userName.message}</Text>
            )}
          </FormControl>
          <FormControl id="email">
            <FormLabel>{t('register.form.labelEmail')}</FormLabel>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input
                  colorScheme="primary.500"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  {...field}
                />
              )}
            />
            {errors.email && <Text color="red">{errors.email.message}</Text>}
          </FormControl>
          <FormControl id="password">
            <FormLabel>{t('register.form.labelPassword')}</FormLabel>
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <PasswordInput
                  size={['md', 'md', 'lg']}
                  autoComplete="new-password"
                  {...field}
                />
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
            {t('register.backLink')}
          </Link>
          <Stack spacing={6}>
            <Button
              type="submit"
              bg="primary.400"
              color="white"
              _hover={{ bg: 'primary.500' }}
              isLoading={isLoading}
            >
              {t('register.submit')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Container>
  )
}
