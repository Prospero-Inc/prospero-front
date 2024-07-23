import { Container } from '@chakra-ui/react'
import Head from 'next/head'
import { FC, PropsWithChildren } from 'react'

import { AuthNav } from '../ui/AuthNav'

interface Props {
  title: string
  pageDescription: string
  imageFullUrl?: string
}

export const AuthLayout: FC<PropsWithChildren<Props>> = ({
  children,
  title,
  pageDescription,
  imageFullUrl
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={pageDescription} />

        <meta name="og:title" content={title} />
        <meta name="og:description" content={pageDescription} />
        {imageFullUrl && <meta name="og:image" content={imageFullUrl} />}
      </Head>
      <AuthNav px={[5, 20]} py={[5, 10]} mb={[10, 0]} />
      <Container
        maxW={'container.2xl'}
        as="main"
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH={['80vh', '90vh']}
      >
        {children}
      </Container>
    </>
  )
}
