import { ProsperoLayout } from '@/components/layouts'
import { ChemicalStructure, CustomStat, QrComponent } from '@/components/ui'
import { activate2FA } from '@/services'
import {
  Button,
  Container,
  Divider,
  Flex,
  Heading,
  Stack,
  Text
} from '@chakra-ui/react'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import React, { FC } from 'react'
import { IoHelpBuoyOutline } from 'react-icons/io5'

type Props = {
  data: {
    qr: string
    secret: string
  }
}

const TwoFA: FC<Props> = ({ data: { qr, secret } }) => {
  const router = useRouter()
  const handleSubmit = async () => {
    router.push('/profile/verify-2fa')
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
          <QrComponent qr={qr} />
          <ChemicalStructure />
        </Stack>
        <Stack display={'flex'} alignItems={'center'} mb="3.188rem">
          <CustomStat borderColor="primary.500">
            <Text fontWeight={'bold'} color="primary.500">
              {secret}
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
    return {
      props: {
        ...(await serverSideTranslations(locale as string, [
          'common',
          'sidebar',
          'mobileNav',
          'budgetCalculator'
        ])),
        data
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
