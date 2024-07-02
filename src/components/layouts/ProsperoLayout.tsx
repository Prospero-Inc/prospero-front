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

      <nav>{/* <Navbar /> */}</nav>

      <SidebarWithHeader>
        <main
          style={{
            // margin: '0px auto',
            maxWidth: '1440px',
            padding: '20px'
          }}
        >
          {children}
        </main>
      </SidebarWithHeader>

      {/* Footer */}
      <footer>{/* TODO: mi custom footer */}</footer>
    </>
  )
}
