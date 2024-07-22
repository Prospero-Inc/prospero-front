import { AuthLayout } from '@/components/layouts'
import { MotionDiv } from '@/components/ui'
import { ForgotPasswordView } from '@/components/views/auth/ForgotPasswordView'
import { Grid, GridItem, Image, Show } from '@chakra-ui/react'
import React from 'react'

const forgotPassword = () => {
  return (
    <AuthLayout title="Login" pageDescription="Login page">
      <Grid templateColumns="repeat(12, 1fr)" gap={2}>
        <GridItem
          mx={'auto'}
          colSpan={[12, 12, 6]}
          display={'flex'}
          justifyContent={'center'}
          mt={'2em'}
        >
          <Show above="md">
            <MotionDiv>
              <Image src={'/assets/forgot-password.svg'} alt="Sali-1" />
            </MotionDiv>
          </Show>
        </GridItem>
        <GridItem mx={'auto'} colSpan={[12, 12, 6]} display={'flex'}>
          <ForgotPasswordView />
        </GridItem>
      </Grid>
    </AuthLayout>
  )
}

export default forgotPassword