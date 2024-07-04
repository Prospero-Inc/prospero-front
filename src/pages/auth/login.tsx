import { AuthLayout } from '@/components/layouts'
import { MotionDiv } from '@/components/ui/MotionDiv'
import { LoginView } from '@/components/views/auth'
import { Grid, GridItem, Image } from '@chakra-ui/react'
import React from 'react'
const login = () => {
  return (
    <AuthLayout title="Login" pageDescription="Login page">
      <Grid templateColumns="repeat(12, 1fr)" gap={4}>
        <GridItem colSpan={[12, 8]}>
          <MotionDiv>
            <Image src={'/assets/Saly-1.svg'} alt="Sali-1" />
          </MotionDiv>
        </GridItem>
        <GridItem colSpan={[12, 4]} display={'flex'} w="100%">
          <LoginView />
        </GridItem>
      </Grid>
    </AuthLayout>
  )
}

export default login
