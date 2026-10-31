import { RegisterView } from '@/components/views/auth'
import { Flex } from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'

const register = () => {
  return (
    <Flex minH={'100vh'} justify="center" p={{ base: 4, md: 6 }}>
      <RegisterView />
    </Flex>
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
