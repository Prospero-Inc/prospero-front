import { ProsperoLayout } from '@/components/layouts'
import { ChemicalStructure, CustomStat, QrComponent } from '@/components/ui'
import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
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
import { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'
import { IoHelpBuoyOutline } from 'react-icons/io5'

const TwoFA = () => {
  const toast = useToast()
  const handleSubmit = async () => {
    try {
      const response = await localApiService.request({
        method: HttpMethod.GET,
        endPoint: '/proxy/activate-2fa'
      })

      console.log(response)
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
export const getStaticProps: GetStaticProps = async ({ locale }) => {
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
}
