import { Button, Flex, Heading, Text } from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'

// Shown by the service worker (next-pwa's document fallback) when a page
// can't be loaded offline. Static on purpose: no session, no user data, so
// nothing personal is ever cached on the device.
const Offline = () => {
  const { t } = useTranslation('common')

  return (
    <Flex
      minH="100dvh"
      direction="column"
      align="center"
      justify="center"
      gap={4}
      px={4}
      textAlign="center"
    >
      <Head>
        <title>{t('offline.title')}</title>
      </Head>
      <Heading as="h1" size="lg">
        {t('offline.heading')}
      </Heading>
      <Text maxW="sm">{t('offline.text')}</Text>
      <Button colorScheme="primary" onClick={() => window.location.reload()}>
        {t('offline.retry')}
      </Button>
    </Flex>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale as string, ['common']))
  }
})

export default Offline
