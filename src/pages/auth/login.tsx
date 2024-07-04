import { AuthLayout } from '@/components/layouts'
import { MotionDiv } from '@/components/ui/MotionDiv'
import { LoginView } from '@/components/views/auth'
import { Grid, GridItem, Image, Show } from '@chakra-ui/react'
import React from 'react'
const login = () => {
  return (
    <AuthLayout title="Login" pageDescription="Login page">
      <Grid
        w={'90%'}
        height={'calc(100vh-200px)'}
        templateColumns="repeat(12, 1fr)"
        gap={2}
      >
        <GridItem
          colSpan={[12, 12, 8]}
          display={'flex'}
          justifyContent={'center'}
          mt={'2em'}
        >
          <Show above="md">
            <MotionDiv>
              <Image
                h={500}
                zIndex={-1}
                src={'/assets/Saly-1.svg'}
                alt="Sali-1"
              />
            </MotionDiv>
          </Show>
        </GridItem>
        <GridItem colSpan={[12, 12, 4]} display={'flex'}>
          <LoginView />
        </GridItem>
      </Grid>
    </AuthLayout>
  )
}

export default login
