import { RegisterView } from '@/components/views/auth'
import { Grid, GridItem, Image, Show } from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'

const register = () => {
  return (
    <Grid templateColumns="repeat(12, 1fr)" h={'100%'} minH={'100vh'}>
      <GridItem colSpan={[12, 12, 12, 6]} display={'flex'} p={6} zIndex={1}>
        <RegisterView />
      </GridItem>
      <GridItem
        colSpan={[12, 12, 12, 6]}
        display={'flex'}
        justifyContent={'center'}
        alignContent={'center'}
        bg={'gray.50'}
      >
        <Show above="lg">
          <Image
            position={'fixed'}
            display={'block'}
            height={'100%'}
            right={['-4%', '-1%', '-2%']}
            w={['90%', '60%', '62%', '75%']}
            src={'/assets/Saly-2.svg'}
            alt="Sali-1"
          />
        </Show>
      </GridItem>
    </Grid>
  )
}
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale as string, ['common']))
    }
  }
}
export default register
