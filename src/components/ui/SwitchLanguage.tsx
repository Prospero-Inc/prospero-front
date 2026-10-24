import { CookiesEnum } from '@/enums'
import { cookiesPlugin } from '@/plugins'
import { Icon, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React from 'react'
import { HiMiniLanguage } from 'react-icons/hi2'
export const SwitchLanguage = () => {
  const router = useRouter()
  const { t, i18n } = useTranslation('common')

  const handleChangeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang)
    // Un año: la preferencia sobrevive a cerrar el navegador. El middleware
    // la usa para servir cada página directo en este idioma.
    cookiesPlugin.setName(CookiesEnum.NEXT_LOCALE, lang, 365)
    router.push(router.asPath, router.asPath, { locale: lang })
  }
  return (
    <Menu isLazy>
      <MenuButton mx={3}>
        <Icon as={HiMiniLanguage} size={'lg'} />
        {t('switchLanguage.text')}
      </MenuButton>
      <MenuList>
        {/* MenuItems are not rendered unless Menu is open */}
        <MenuItem onClick={() => handleChangeLanguage('en')}>
          {t('switchLanguage.english')}
        </MenuItem>
        <MenuItem onClick={() => handleChangeLanguage('es')}>
          {t('switchLanguage.spanish')}
        </MenuItem>
      </MenuList>
    </Menu>
  )
}
