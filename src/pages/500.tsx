import { AlertIcon } from '@/components/icons/app'
import { FullScreenState } from '@/components/states/FullScreenState'
import { Button } from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

/** Server error (docs/diseno-mobile.html, 15): a human message, retry and
 * a way home — no technical details. */
const ServerError = () => {
  const { t } = useTranslation('common')
  return (
    <FullScreenState
      pageTitle={t('states.serverError.pageTitle')}
      icon={<AlertIcon boxSize="42px" />}
      tone="error"
      title={t('states.serverError.title')}
      text={t('states.serverError.text')}
    >
      <Button
        variant="brand"
        size="cta"
        w="full"
        onClick={() => window.location.reload()}
      >
        {t('states.retry')}
      </Button>
      <Button as="a" href="/dashboard" variant="soft" size="cta" w="full">
        {t('states.loadError.home')}
      </Button>
    </FullScreenState>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale as string, ['common']))
  }
})

export default ServerError
