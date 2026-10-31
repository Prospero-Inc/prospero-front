import { AuthLayout } from '@/components/layouts'
import { LoginView } from '@/components/views/auth'
import { Box } from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'

const login = () => {
  const { t } = useTranslation('common')
  return (
    <AuthLayout
      title={t('authPages.login.title')}
      pageDescription={t('authPages.login.description')}
    >
      <Box
        width={'100%'}
        display="flex"
        flexDirection={{ base: 'column', md: 'row' }}
        alignItems="center"
        justifyContent="center"
        p={4}
      >
        <Box w="full" maxW="md" display="flex" justifyContent="center">
          <LoginView />
        </Box>
      </Box>
    </AuthLayout>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale as string, ['common']))
    }
  }
}

export default login
