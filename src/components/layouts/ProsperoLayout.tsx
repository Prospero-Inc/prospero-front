import { Container } from '@chakra-ui/react'
import Head from 'next/head'
import { FC, PropsWithChildren } from 'react'

import SidebarWithHeader from '../ui/SideBar'

interface Props {
  title: string
  pageDescription: string
  imageFullUrl?: string
}

export const ProsperoLayout: FC<PropsWithChildren<Props>> = ({
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

      <SidebarWithHeader>
        <Container
          px={{ base: 4, md: 6, lg: 8 }}
          py={{ base: 0, md: 6, lg: 8 }}
          maxW="container.2xl"
          my={5}
        >
          {children}
        </Container>
      </SidebarWithHeader>

      {/* Footer */}
      <footer>{/* TODO: mi custom footer */}</footer>
    </>
  )
}
