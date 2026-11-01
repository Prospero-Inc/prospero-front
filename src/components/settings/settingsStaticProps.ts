import { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

// Kept apart from SettingsLayout: pages only use this in getStaticProps,
// which Next strips from the browser bundle together with its imports.
export const settingsStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale as string, [
      'common',
      'sidebar',
      'mobileNav',
      'settings'
    ]))
  }
})
