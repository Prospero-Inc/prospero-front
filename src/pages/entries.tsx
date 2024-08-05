import { ProsperoLayout } from '@/components/layouts'
import { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function entries() {
  return (
    <ProsperoLayout
      title="Entries"
      pageDescription="Pagina de inicio de Prospero"
    >
      <h1>O</h1>
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
