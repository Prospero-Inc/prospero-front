import { ProsperoLayout } from '@/components/layouts'
import { Center, Heading, Stack, Text } from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'

const goals = () => {
  const { t } = useTranslation('goals')

  return (
    <ProsperoLayout title={t('title')} pageDescription={t('title')}>
      <Center minH="60vh">
        <Stack spacing={3} textAlign="center" maxW="md">
          <Heading size="lg">{t('comingSoon.heading')}</Heading>
          <Text color="GrayText">{t('comingSoon.description')}</Text>
        </Stack>
      </Center>
    </ProsperoLayout>
  )
}
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale as string, [
        'common',
        'sidebar',
        'mobileNav',
        'goals'
      ]))
    }
  }
}

export default goals
