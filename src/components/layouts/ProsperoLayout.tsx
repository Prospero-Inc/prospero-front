import { Container } from '@chakra-ui/react'
import Head from 'next/head'
import { FC, PropsWithChildren } from 'react'

import { useSetAppShellTitle } from './shell/AppShellTitle'

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
  // The shell (menus, tab bar) lives in _app so it persists across pages;
  // here only the title and the page container.
  useSetAppShellTitle(title)

  return (
    <>
      <Head>
        <title>{title}</title>

        <meta name="description" content={pageDescription} />

        <meta name="og:title" content={title} />
        <meta name="og:description" content={pageDescription} />

        {imageFullUrl && <meta name="og:image" content={imageFullUrl} />}
      </Head>

      <Container
        px={{ base: 4, md: 6, lg: 8 }}
        py={{ base: 0, md: 6, lg: 8 }}
        maxW="container.2xl"
        my={5}
      >
        {children}
      </Container>

      {/* Footer */}
      <footer>{/* TODO: mi custom footer */}</footer>
    </>
  )
}
