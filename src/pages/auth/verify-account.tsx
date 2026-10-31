import { AuthLayout } from '@/components/layouts'
import { VerifyAccountView } from '@/components/views/auth'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'

const verifyAccount = () => {
  const { t } = useTranslation('common')
  return (
    <AuthLayout
      title={t('authPages.verifyAccount.title')}
      pageDescription={t('authPages.verifyAccount.description')}
    >
      <VerifyAccountView />
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

export default verifyAccount
