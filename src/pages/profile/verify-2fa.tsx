'use client'

import { CookiesEnum } from '@/enums'
import { useYupValidationResolver } from '@/hooks/useYupValidationResolver'
import { localApiService } from '@/lib'
import { cookiesPlugin } from '@/plugins'
import { Center, FormErrorMessage, Heading, useToast } from '@chakra-ui/react'
import {
  Button,
  FormControl,
  Flex,
  Stack,
  useColorModeValue,
  HStack
} from '@chakra-ui/react'
import { PinInput, PinInputField } from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useSession } from 'next-auth/react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'
const verifyTwoFactor = yup.object().shape({
  ping: yup.string().required()
})
export default function VerifyEmailForm() {
  const { data: session } = useSession()
  const toast = useToast()
  const router = useRouter()
  const resolver = useYupValidationResolver(verifyTwoFactor)
  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm<{ ping: string }>({
    resolver
  })

  const onSubmit = (data: { ping: string }) => {
    const lang = cookiesPlugin.getName(CookiesEnum.NEXT_LOCALE)
    toast.promise(
      localApiService.request({
        method: 'POST',
        endPoint: '/proxy/validate-2fa',
        headers: {
          'x-lang': `${lang}`,
          Authorization: `Bearer ${session?.accessToken}`
        },
        data: {
          token: data.ping
        }
      }),
      {
        loading: {
          title: 'Verifying 2FA',
          description: 'Please wait while we verify your 2FA'
        },
        success: _data => {
          router.replace('/profile')
          return {
            title: '2FA Verified',
            description: 'You have successfully verified your 2FA'
          }
        },
        error: err => {
          console.error(err)
          return {
            title: 'Error',
            description: 'An error occurred while verifying your 2FA'
          }
        }
      }
    )
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
            Verify your 2 Factor Authentication
          </Heading>
        </Center>
        <Center
          fontSize={{ base: 'sm', sm: 'md' }}
          color={useColorModeValue('gray.800', 'gray.400')}
        >
          Enter the 6 digit code of your authenticator app
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
                <FormErrorMessage>This field is required</FormErrorMessage>
              )}
            </HStack>
          </Center>
        </FormControl>
        <Stack spacing={6}>
          <Button
            bg={'primary.400'}
            type="submit"
            color={'white'}
            _hover={{
              bg: 'primary.500'
            }}
          >
            Verify
          </Button>
        </Stack>
      </Stack>
    </Flex>
  )
}
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale as string, [
        'common',
        'sidebar',
        'mobileNav'
      ]))
    }
  }
}
