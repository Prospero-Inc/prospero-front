export const getLocalizedUrl = (locale: string, path: string): string => {
  const validLocales = ['en', 'es']

  const chosenLocale = validLocales.includes(locale) ? locale : 'en'

  return chosenLocale === 'es' ? `/${path}` : `/${chosenLocale}/${path}`
}
