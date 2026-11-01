import { CloudOffIcon } from '@/components/icons/app'
import { useIsOnline } from '@/hooks/useIsOnline'
import { Flex } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'

/** design 15, "Aviso fino arriba": a thin dark bar while the connection is
 * down; the save buttons are disabled meanwhile (see useIsOnline). */
export const OfflineBanner = () => {
  const { t } = useTranslation('common')
  const isOnline = useIsOnline()
  if (isOnline) return null
  return (
    <Flex
      role="status"
      position="relative"
      zIndex="banner"
      minH="34px"
      pt="env(safe-area-inset-top)"
      px="16px"
      align="center"
      justify="center"
      gap="8px"
      bg="text.primary"
      color="bg.surface"
      fontSize="12.5px"
      fontWeight={600}
      textAlign="center"
    >
      <CloudOffIcon boxSize="16px" flex="none" />
      {t('states.offline.banner')}
    </Flex>
  )
}
