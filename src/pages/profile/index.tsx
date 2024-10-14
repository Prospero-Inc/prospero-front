import { ProsperoLayout } from '@/components/layouts'
import { PersonalInformation, Security } from '@/components/views/profile'
import { Profile } from '@/interfaces'
import { requestProfile } from '@/services/request-profile'
import { Container, Heading } from '@chakra-ui/react'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'
type ProfileProps = {
  profile: Profile
}

const index = ({ profile }: ProfileProps) => {
  return (
    <ProsperoLayout pageDescription="Profile Page" title="Profile">
      <Container maxW={'container.xl'}>
        <Heading>GOLA PERRO</Heading>
        <PersonalInformation {...profile} />
        <Security enable2FA={profile.enable2FA} />
      </Container>
    </ProsperoLayout>
  )
}

interface ProfileResponse {
  msg: string
  user: Profile
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  locale
}) => {
  const session = await getSession({ req })
  const token = session?.accessToken

  let profile: ProfileResponse | null = null
  if (token) {
    profile = (await requestProfile(null, {
      authorization: `Bearer ${token}`,
      lang: locale
    })) as ProfileResponse

    if (profile === undefined) profile = null
  }

  return {
    props: {
      ...(await serverSideTranslations(locale as string, [
        'common',
        'sidebar',
        'mobileNav',
        'budgetCalculator',
        'profile'
      ])),
      profile: profile?.user ?? null
    }
  }
}

export default index
