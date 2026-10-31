import { AuthLayout } from '@/components/layouts'
import { VerifyTwoFactorView } from '@/components/views/auth'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'

const verifyTwoFactor = () => {
  const { t } = useTranslation('common')
  return (
    <AuthLayout
      title={t('authPages.verify2fa.title')}
      pageDescription={t('authPages.verify2fa.description')}
    >
      <VerifyTwoFactorView />
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

export default verifyTwoFactor
