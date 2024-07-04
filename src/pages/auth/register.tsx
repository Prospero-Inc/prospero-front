import { AuthLayout } from '@/components/layouts'
import { MotionDiv } from '@/components/ui'
import { LoginView } from '@/components/views/auth'
import { RegisterView } from '@/components/views/RegisterView'
import { Container, Grid, GridItem, Image, Show } from '@chakra-ui/react'
import React from 'react'

const register = () => {
  return (
    <Container maxW={'container.1xl'}>
      <Grid templateColumns="repeat(12, 1fr)" gap={2}>
        <GridItem colSpan={[12, 12, 4]} display={'flex'}>
          <RegisterView />
        </GridItem>
        <GridItem
          colSpan={[12, 12, 8]}
          display={'flex'}
          justifyContent={'center'}
        >
          <Show above="md">
            <MotionDiv>
              <Image
                position={'relative'}
                src={'/assets/Saly-2.svg'}
                alt="Sali-1"
              />
            </MotionDiv>
          </Show>
        </GridItem>
      </Grid>
    </Container>
  )
}

export default register
