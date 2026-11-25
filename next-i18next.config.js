const path = require('path')

module.exports = {
  i18n: {
    defaultLocale: 'es',
    locales: ['en', 'es'],
    interpolation: {
      escapeValue: false
    },
    localeDetection: false
  },
  // es and en have the same keys (checked when this was set), so an English
  // page doesn't need the Spanish namespaces shipped alongside as fallback.
  // A key missing in en now shows the key itself: add it to both files.
  fallbackLng: false,
  localePath: path.resolve('./public/locales'),
  reloadOnPrerender: process.env.NODE_ENV === 'development'
}
