import { AuthLayout } from '@/components/layouts'
import { VerifyTwoFactorView } from '@/components/views/auth'
import { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'

const verifyTwoFactor = () => {
  return (
    <AuthLayout title="Verify 2FA" pageDescription="Two-factor login step">
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
