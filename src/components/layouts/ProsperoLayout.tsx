import { Container } from '@chakra-ui/react'
import Head from 'next/head'
import { FC, PropsWithChildren } from 'react'

import {
  type TopBarBack,
  type TopBarTrailing,
  useSetAppShellTitle
} from './shell/AppShellTitle'

interface Props {
  title: string
  pageDescription: string
  imageFullUrl?: string
  /** Shown above the title in the phone top bar (e.g. "Hola, Ana"). */
  greeting?: string
  /** Right side of the phone top bar (see AppShellTitle). */
  topBarTrailing?: TopBarTrailing
  /** Back link on the left of the top bar (see AppShellTitle). */
  topBarBack?: TopBarBack
}

export const ProsperoLayout: FC<PropsWithChildren<Props>> = ({
  children,
  title,
  pageDescription,
  imageFullUrl,
  greeting,
  topBarTrailing,
  topBarBack
}) => {
  // The shell (menus, tab bar) lives in _app so it persists across pages;
  // here only the title and the page container.
  useSetAppShellTitle(title, greeting, topBarTrailing, topBarBack)

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
        my={{ base: 2, md: 5 }}
      >
        {children}
      </Container>

      {/* Footer */}
      <footer>{/* TODO: mi custom footer */}</footer>
    </>
  )
}
