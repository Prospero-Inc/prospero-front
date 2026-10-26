import { AuthLayout } from '@/components/layouts'
import { VerifyAccountView } from '@/components/views/auth'
import { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'

const verifyAccount = () => {
  return (
    <AuthLayout title="Verify account" pageDescription="Account verification">
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
