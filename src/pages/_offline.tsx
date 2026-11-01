import { CloudOffIcon } from '@/components/icons/app'
import { FullScreenState } from '@/components/states/FullScreenState'
import { Button } from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

// Shown by the service worker when a page can't be loaded offline
// (docs/diseno-mobile.html, 15 · "Sin conexión"). Static on purpose: no
// session, no user data, so nothing personal is ever cached on the device.
const Offline = () => {
  const { t } = useTranslation('common')
  return (
    <FullScreenState
      pageTitle={t('states.offline.pageTitle')}
      icon={<CloudOffIcon boxSize="46px" />}
      title={t('states.offline.title')}
      text={t('states.offline.text')}
    >
      <Button
        variant="brand"
        size="cta"
        w="full"
        onClick={() => window.location.reload()}
      >
        {t('states.retry')}
      </Button>
    </FullScreenState>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale as string, ['common']))
  }
})

export default Offline
