import { AuthLayout } from '@/components/layouts'
import { MotionDiv } from '@/components/ui/MotionDiv'
import { LoginView } from '@/components/views/auth'
import { Grid, GridItem, Image, Show } from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'

const login = () => {
  return (
    <AuthLayout title="Login" pageDescription="Login page">
      <Grid templateColumns="repeat(12, 1fr)" gap={2}>
        <GridItem
          colSpan={[12, 12, 6]}
          display={'flex'}
          justifyContent={'center'}
          mt={'2em'}
        >
          <Show above="md">
            <MotionDiv>
              <Image src={'/assets/Saly-1.svg'} alt="Sali-1" />
            </MotionDiv>
          </Show>
        </GridItem>
        <GridItem colSpan={[12, 12, 6]} display={'flex'}>
          <LoginView />
        </GridItem>
      </Grid>
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
