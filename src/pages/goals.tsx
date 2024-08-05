import { ProsperoLayout } from '@/components/layouts'
import { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'

const goals = () => {
  return (
    <ProsperoLayout
      title="Metas"
      pageDescription="Pagina de inicio de Prospero"
    >
      <h1>Goals</h1>
    </ProsperoLayout>
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

export default goals
