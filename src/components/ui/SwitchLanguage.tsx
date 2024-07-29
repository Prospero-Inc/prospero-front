import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import React from 'react'

export const SwitchLanguage = () => {
  const { i18n } = useTranslation('common')
  const handleChangeLanguage = (lang: string) => {
    console.log(`Attempting to change language to: ${lang}`)
    i18n
      .changeLanguage(lang)
      .then(() => {
        console.log(`Language successfully changed to ${lang}`)
      })
      .catch(error => {
        console.error(`Error changing language: ${error}`)
      })
  }
  return (
    <Menu isLazy>
      <MenuButton>Language</MenuButton>
      <MenuList>
        {/* MenuItems are not rendered unless Menu is open */}
        <MenuItem onClick={() => handleChangeLanguage('en')}>English</MenuItem>
        <MenuItem onClick={() => handleChangeLanguage('es')}>Spanish</MenuItem>
      </MenuList>
    </Menu>
  )
}
