import { HttpMethod } from '@/enums'
import { useYupValidationResolver } from '@/hooks/useYupValidationResolver'
import { LoginSuccessResponse, PRE_AUTH_TOKEN_STORAGE_KEY } from '@/interfaces'
import { localApiService } from '@/lib'
import {
  Button,
  Center,
  Flex,
  FormControl,
  FormErrorMessage,
  Heading,
  HStack,
  PinInput,
  PinInputField,
  Stack,
  useColorModeValue,
  useToast
} from '@chakra-ui/react'
import { signIn } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'

const validationSchema = yup.object().shape({
  ping: yup.string().required()
})

export const VerifyTwoFactorView = () => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const resolver = useYupValidationResolver(validationSchema)
  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm<{ ping: string }>({ resolver })

  useEffect(() => {
    if (!sessionStorage.getItem(PRE_AUTH_TOKEN_STORAGE_KEY))
      router.replace('/auth/login')
  }, [router])

  const onSubmit = async ({ ping }: { ping: string }) => {
    const preAuthToken = sessionStorage.getItem(PRE_AUTH_TOKEN_STORAGE_KEY)
    if (!preAuthToken) return router.replace('/auth/login')

    setIsLoading(true)
    try {
      const response = await localApiService.request<LoginSuccessResponse>({
        endPoint: '/proxy/login-verify-2fa',
        method: HttpMethod.POST,
        data: { preAuthToken, token: ping }
      })

      await signIn('credentials', {
        accessToken: response.accessToken,
        user: JSON.stringify(response.user),
        redirect: false,
        callbackUrl: '/dashboard'
      })

      sessionStorage.removeItem(PRE_AUTH_TOKEN_STORAGE_KEY)
      router.replace('/dashboard')
    } catch (error) {
      toast({
        title: t('verifyTwoFactor.toast.error.title'),
        description:
          error instanceof Error
            ? error.message
            : t('verifyTwoFactor.toast.error.description'),
        status: 'error',
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Flex
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}
    >
      <Stack
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        spacing={4}
        w={'full'}
        maxW={'sm'}
        bg={useColorModeValue('white', 'gray.700')}
        rounded={'xl'}
        boxShadow={'lg'}
        p={6}
        my={10}
      >
        <Center>
          <Heading lineHeight={1.1} fontSize={{ base: '2xl', md: '3xl' }}>
            {t('verifyTwoFactor.heading')}
          </Heading>
        </Center>
        <Center
          fontSize={{ base: 'sm', sm: 'md' }}
          color={useColorModeValue('gray.800', 'gray.400')}
        >
          {t('verifyTwoFactor.text')}
        </Center>
        <FormControl>
          <Center>
            <HStack>
              <Controller
                control={control}
                name="ping"
                render={({ field }) => (
                  <PinInput
                    {...field}
                    onComplete={ping => setValue('ping', ping)}
                  >
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                  </PinInput>
                )}
              />
              {errors.ping && (
                <FormErrorMessage>
                  {t('verifyTwoFactor.required')}
                </FormErrorMessage>
              )}
            </HStack>
          </Center>
        </FormControl>
        <Stack spacing={6}>
          <Button
            bg={'primary.400'}
            type="submit"
            color={'white'}
            isLoading={isLoading}
            _hover={{
              bg: 'primary.500'
            }}
          >
            {t('verifyTwoFactor.submit')}
          </Button>
        </Stack>
      </Stack>
    </Flex>
  )
}
