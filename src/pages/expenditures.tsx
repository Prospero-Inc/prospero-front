import { ProsperoLayout } from '@/components/layouts'
import { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'

const expenditures = () => {
  return (
    <ProsperoLayout
      title="Gastos"
      pageDescription="Pagina de Gastos de Prospero"
    ></ProsperoLayout>
  )
}
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale as string, [
        'common',
        'sidebar',
        'mobileNav'
      ]))
    }
  }
}

export default expenditures
