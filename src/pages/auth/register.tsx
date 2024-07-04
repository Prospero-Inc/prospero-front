import { MotionDiv } from '@/components/ui'
import { RegisterView } from '@/components/views/RegisterView'
import { Container, Grid, GridItem, Image, Show } from '@chakra-ui/react'
import React from 'react'
import * as yup from 'yup'
const validationSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters long')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d])(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/,
      'Password must contain at least one lowercase letter, one uppercase letter, one digit, one special character, and one dot'
    )
})
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
