import { RegisterView } from '@/components/views/auth'
import { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

// The view draws the whole screen (docs/diseno-mobile.html, 11–12).
export default function Page() {
  return <RegisterView />
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale as string, ['common']))
  }
})
