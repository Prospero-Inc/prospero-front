import { GetServerSideProps } from 'next'

/**
 * El paso de verificación ahora vive en `/profile/2fa` (escanear y confirmar
 * en la misma pantalla). Se mantiene la ruta para no romper links viejos.
 */
export default function VerifyTwoFactorRedirect() {
  return null
}

export const getServerSideProps: GetServerSideProps = async ({
  locale,
  defaultLocale
}) => ({
  redirect: {
    destination: `${
      locale && locale !== defaultLocale ? `/${locale}` : ''
    }/profile/2fa`,
    permanent: false
  }
})
