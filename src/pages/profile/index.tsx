import { ProsperoLayout } from '@/components/layouts'
import { PersonalInformation, Security } from '@/components/views/profile'
import { requestProfile } from '@/services/request-profile'
import { Container } from '@chakra-ui/react'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
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

export const getServerSideProps: GetServerSideProps = async ({
  req,
  locale
}) => {
  const session = await getSession({ req })
  const token = session?.accessToken

  let profile = null // Asegúrate de inicializar como null
  if (token) {
    profile = await requestProfile(null, {
      authorization: `Bearer ${token}`,
      lang: locale
    })

    if (profile === undefined) profile = null
  }

  return {
    props: {
      ...(await serverSideTranslations(locale as string, [
        'common',
        'sidebar',
        'mobileNav',
        'budgetCalculator'
      ])),
      profile // Pasa los datos del perfil si es necesario
    }
  }
}

export default index
