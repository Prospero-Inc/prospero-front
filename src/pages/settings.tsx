import { ProsperoLayout } from '@/components/layouts'
import { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'

export default function settings() {
  return (
    <ProsperoLayout
      title="Configuraciones"
      pageDescription="Pagina de configuraciones de Prospero"
    >
      <h1>Settings</h1>
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
