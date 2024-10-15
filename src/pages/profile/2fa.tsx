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
import { useTranslation } from 'next-i18next'
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
  const { t } = useTranslation('2fa')

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
          {t('returnButton')}
        </Button>
        <Flex justify={'center'} mb="3.188rem">
          <Heading as="h2">{t('heading')}</Heading>
        </Flex>
        <Stack textAlign={'center'} mb="3.188rem">
          <Text>{t('text')}</Text>
        </Stack>
        <Stack display={'flex'} justify={'center'} alignItems={'center'}>
          <QrComponent qr={qr} />
          <ChemicalStructure text={t('dividerText')} />
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
            {t('helpButton')}
          </Button>
          <Button colorScheme="primary" onClick={handleSubmit}>
            {t('nextStep')}
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
        ...(await serverSideTranslations(
          locale as string,
          ['common', 'sidebar', 'mobileNav', '2fa'],
          null,
          ['en', 'es']
        )),
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
