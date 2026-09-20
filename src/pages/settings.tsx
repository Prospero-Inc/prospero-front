import { ProsperoLayout } from '@/components/layouts'
import { SwitchLanguage } from '@/components/ui'
import { requestProfile } from '@/services/request-profile'
import { Box, Button, Divider, Heading, Stack, Text } from '@chakra-ui/react'
import { GetServerSideProps } from 'next'
import { getSession, signOut } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

interface SettingsProps {
  account: { email: string; username: string } | null
}

export default function SettingsPage({ account }: SettingsProps) {
  const { t } = useTranslation('settings')

  return (
    <ProsperoLayout title={t('title')} pageDescription={t('title')}>
      <Stack spacing={8} maxW="lg">
        <Box>
          <Heading size="md" mb={3}>
            {t('account.title')}
          </Heading>
          <Text>
            {t('account.email')}: {account?.email ?? '-'}
          </Text>
          <Text>
            {t('account.username')}: {account?.username ?? '-'}
          </Text>
        </Box>

        <Divider />

        <Box>
          <Heading size="md" mb={3}>
            {t('language.title')}
          </Heading>
          <SwitchLanguage />
        </Box>

        <Divider />

        <Button
          alignSelf="flex-start"
          colorScheme="red"
          variant="outline"
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
        >
          {t('logout')}
        </Button>
      </Stack>
    </ProsperoLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  locale
}) => {
  const session = await getSession({ req })
  let account: SettingsProps['account'] = null

  if (session?.accessToken)
    try {
      const profile = (await requestProfile(null, {
        authorization: `Bearer ${session.accessToken}`,
        lang: locale
      })) as { user: { email: string; username: string } }
      account = profile?.user
        ? { email: profile.user.email, username: profile.user.username }
        : null
    } catch (error) {
      account = null
    }

  return {
    props: {
      ...(await serverSideTranslations(locale as string, [
        'common',
        'sidebar',
        'mobileNav',
        'settings'
      ])),
      account
    }
  }
}
