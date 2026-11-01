import { FlagIcon } from '@/components/icons/app'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { Button, Flex, Stack, Text } from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import NextLink from 'next/link'

/**
 * Metas (docs/diseno-mobile.html, 14 · "Metas: próximamente"): out of the
 * navigation until it exists (the spec leaves savings goals post-MVP); an
 * old link lands here and sees what's coming.
 */
export default function GoalsPage() {
  const { t } = useTranslation('goals')
  return (
    <SettingsLayout title={t('title')}>
      <Stack spacing="14px" pt="40px" px="12px" textAlign="center">
        <Flex
          boxSize="96px"
          mx="auto"
          borderRadius="30px"
          bg="brand.subtle"
          color="brand.text"
          align="center"
          justify="center"
          aria-hidden
        >
          <FlagIcon boxSize="44px" />
        </Flex>
        <Text
          as="h2"
          fontSize="22px"
          fontWeight="bold"
          lineHeight="1.25"
          color="text.primary"
        >
          {t('comingSoon.heading')}
        </Text>
        <Text fontSize="14.5px" lineHeight="1.5" color="text.secondary">
          {t('comingSoon.description')}
        </Text>
        <Button
          as={NextLink}
          href="/dashboard"
          variant="soft"
          size="cta"
          mt="10px"
        >
          {t('comingSoon.back')}
        </Button>
      </Stack>
    </SettingsLayout>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale as string, [
      'common',
      'sidebar',
      'mobileNav',
      'goals'
    ]))
  }
})
