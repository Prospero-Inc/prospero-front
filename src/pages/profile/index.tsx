import { ProsperoLayout } from '@/components/layouts'
import { PersonalInformation, Security } from '@/components/views/profile'
import { Container } from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'

const index = () => {
  return (
    <ProsperoLayout pageDescription="Profile Page" title="Profile">
      <Container maxW={'container.xl'}>
        <PersonalInformation />
        <Security />
      </Container>
    </ProsperoLayout>
  )
}
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale as string, [
        'common',
        'sidebar',
        'mobileNav',
        'budgetCalculator'
      ]))
    }
  }
}
export default index
