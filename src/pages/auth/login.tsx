import { LoginView } from '@/components/views/auth'
import { Box, Image, Text } from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import React from 'react'

/**
 * Login (docs/diseno-mobile.html, 04): a brand-colored header with the logo
 * and a greeting instead of the old 10 MB illustrations, then the form.
 */
const login = () => {
  const { t } = useTranslation('common')
  return (
    <Box minH="100dvh" bg="bg.surface">
      <Head>
        <title>{t('authPages.login.title')}</title>
        <meta name="description" content={t('authPages.login.description')} />
        <meta name="og:title" content={t('authPages.login.title')} />
        <meta
          name="og:description"
          content={t('authPages.login.description')}
        />
      </Head>
      <Box
        as="header"
        bg="hero.bg"
        color="white"
        borderBottomRadius="32px"
        px="24px"
        pt="calc(14px + env(safe-area-inset-top))"
        pb="72px"
      >
        <Box maxW="md" mx="auto">
          <Box
            display="inline-block"
            bg="white"
            borderRadius="22px"
            p="5px"
            mt="14px"
          >
            <Image
              src="/assets/authBrand.svg"
              alt="Prospero"
              w="130px"
              display="block"
            />
          </Box>
          <Text as="h1" fontSize="28px" fontWeight="bold" mt="26px">
            {t('login.welcome')}
          </Text>
          <Text fontSize="14px" opacity={0.85} mt="6px">
            {t('login.tagline')}
          </Text>
        </Box>
      </Box>
      <Box as="main" maxW="md" mx="auto" px="20px" pt="24px" pb="32px">
        <LoginView />
      </Box>
    </Box>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale as string, ['common']))
    }
  }
}

export default login
