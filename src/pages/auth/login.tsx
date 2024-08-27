import { AuthLayout } from '@/components/layouts'
import { MotionDiv } from '@/components/ui/MotionDiv'
import { LoginView } from '@/components/views/auth'
import { Box, Image, Show } from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'

const login = () => {
  return (
    <AuthLayout title="Login" pageDescription="Login page">
      <Box
        width={'100%'}
        display="flex"
        flexDirection={{ base: 'column', md: 'row' }}
        alignItems="center"
        justifyContent="center"
        p={4}
      >
        <Box
          flex={{ base: 'none', md: 1 }}
          display="flex"
          justifyContent="center"
          mb={{ base: 4, md: 0 }}
        >
          <Show above="md">
            <MotionDiv>
              <Image src={'/assets/Saly-1.svg'} alt="Sali-1" />
            </MotionDiv>
          </Show>
        </Box>
        <Box
          flex={{ base: 'none', md: 1 }}
          display="flex"
          justifyContent="center"
        >
          <LoginView />
        </Box>
      </Box>
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

export default login
