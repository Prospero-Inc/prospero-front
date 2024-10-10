import { ProsperoLayout } from '@/components/layouts'
import { ChemicalStructure, CustomStat, QrComponent } from '@/components/ui'
import { CookiesEnum, HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
import { cookiesPlugin } from '@/plugins'
import { activate2FA } from '@/services'
import {
  Button,
  Container,
  Divider,
  Flex,
  Heading,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react'
import { isAxiosError } from 'axios'
import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'
import { IoHelpBuoyOutline } from 'react-icons/io5'

const TwoFA = () => {
  const toast = useToast()
  const { data } = useSession()
  const handleSubmit = async () => {
    try {
      const lang = cookiesPlugin.getName(CookiesEnum.NEXT_LOCALE)
      const _response = await localApiService.request({
        method: HttpMethod.GET,
        endPoint: '/proxy/activate-2fa',
        headers: {
          'x-lang': `${lang}`,
          Authorization: `Bearer ${data?.accessToken}`
        }
      })
      toast({
        title: '2FA activated successfully',
        status: 'success',
        description: _response as string,
        duration: 9000,
        isClosable: true
      })
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: 'An error occurred.',
          description: error?.message,
          status: 'error',
          duration: 9000,
          isClosable: true
        })

      if (isAxiosError(error))
        toast({
          title: 'An error occurred.',
          description: error.response?.data?.message,
          status: 'error',
          duration: 9000,
          isClosable: true
        })
    }
  }
  return (
    <ProsperoLayout
      title="Activate 2FA"
      pageDescription="Page to Active the 2 Factor Authentication "
    >
      <Container>
        <Button colorScheme="primary" variant="ghost">
          Return{' '}
        </Button>
        <Flex justify={'center'} mb="3.188rem">
          <Heading as="h2">2FA Setup</Heading>
        </Flex>
        <Stack textAlign={'center'} mb="3.188rem">
          <Text>Scan the image below with your 2FA authenticator</Text>
        </Stack>
        <Stack display={'flex'} justify={'center'} alignItems={'center'}>
          <QrComponent />
          <ChemicalStructure />
        </Stack>
        <Stack display={'flex'} alignItems={'center'} mb="3.188rem">
          <CustomStat borderColor="primary.500">
            <Text fontWeight={'bold'} color="primary.500">
              LKS7 - 28HS -JHS2 - JSF9 - 72CA{' '}
            </Text>
          </CustomStat>
        </Stack>
        <Divider borderColor={'gray.300'} mb="1.188rem" />
        <Flex justify={'space-around'}>
          <Button colorScheme="primary" iconSpacing={'auto'}>
            <IoHelpBuoyOutline />
            Need Help?
          </Button>
          <Button colorScheme="primary" onClick={handleSubmit}>
            Continue
          </Button>
        </Flex>
      </Container>
    </ProsperoLayout>
  )
}

export default TwoFA
export const getServerSideProps: GetServerSideProps = async ({
  req,
  locale
}) => {
  try {
    const session = await getSession({ req })
    const data = await activate2FA(
      {},
      {
        lang: locale as string,
        authorization: `Bearer ${session?.accessToken}`
      }
    )
    console.log({ data })
    return {
      props: {
        ...(await serverSideTranslations(locale as string, [
          'common',
          'sidebar',
          'mobileNav',
          'budgetCalculator'
        ]))
      }
    }
  } catch (error) {
    return {
      redirect: {
        destination: '/profile',
        permanent: false
      }
    }
  }
}
