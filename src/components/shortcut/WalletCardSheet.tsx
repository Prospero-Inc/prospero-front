import { Help } from '@/components/design/settings'
import { CartIcon, CupIcon, PiggyIcon, StoreIcon } from '@/components/icons/app'
import { BottomSheet } from '@/components/ui/BottomSheet'
import type { WalletCard } from '@/services/walletCards'
import { Box, Button, Flex, Text } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { type ReactElement, useEffect, useState } from 'react'

import { categoryKey, type WalletCardCategory } from './walletCardStyle'

const OPTIONS: {
  value: WalletCardCategory
  icon: ReactElement
  bg: string
  color: string
}[] = [
  {
    value: null,
    icon: <StoreIcon boxSize="20px" />,
    bg: 'button.soft',
    color: 'text.primary'
  },
  {
    value: 'Necesidad',
    icon: <CartIcon boxSize="20px" />,
    bg: 'brand.subtle',
    color: 'category.Necesidad'
  },
  {
    value: 'Deseo',
    icon: <CupIcon boxSize="20px" />,
    bg: 'tint.Deseo',
    color: 'category.Deseo'
  },
  {
    value: 'Ahorro',
    icon: <PiggyIcon boxSize="20px" />,
    bg: 'tint.income',
    color: 'category.Ahorro'
  }
]

interface WalletCardSheetProps {
  card: WalletCard | null
  isSaving: boolean
  onClose: () => void
  onSave: (_card: WalletCard, _category: WalletCardCategory) => void
}

/** design 19 · "Categoría de una tarjeta": four .opt with a radio; saved
 * with "Guardar". */
export const WalletCardSheet = ({
  card,
  isSaving,
  onClose,
  onSave
}: WalletCardSheetProps) => {
  const { t } = useTranslation('settings')
  const [choice, setChoice] = useState<WalletCardCategory>(null)

  useEffect(() => {
    if (card) setChoice(card.defaultCategory)
  }, [card])

  return (
    <BottomSheet
      isOpen={card !== null}
      onClose={onClose}
      title={
        <Box>
          <Text noOfLines={1}>{card?.name}</Text>
          <Text
            fontSize="12.5px"
            fontWeight="normal"
            color="text.secondary"
            mt="2px"
          >
            {t('shortcut.cards.question')}
          </Text>
        </Box>
      }
      footer={
        <Button
          variant="brand"
          size="cta"
          w="full"
          isLoading={isSaving}
          onClick={() => card && onSave(card, choice)}
        >
          {t('shortcut.cards.save')}
        </Button>
      }
    >
      <Box role="radiogroup" aria-label={t('shortcut.cards.question')}>
        {OPTIONS.map(option => {
          const key = categoryKey(option.value)
          const isOn = choice === option.value
          return (
            <Flex
              key={key}
              as="button"
              type="button"
              role="radio"
              aria-checked={isOn}
              onClick={() => setChoice(option.value)}
              w="full"
              align="center"
              gap="12px"
              minH="60px"
              py="8px"
              px={isOn ? '13.5px' : '14px'}
              mb="8px"
              borderRadius="16px"
              borderWidth={isOn ? '2px' : '1.5px'}
              borderColor={isOn ? 'brand.solid' : 'border.subtle'}
              bg={isOn ? 'choice.onBg' : 'transparent'}
              textAlign="left"
              _focusVisible={{ boxShadow: 'outline', outline: 'none' }}
            >
              <Flex
                boxSize="36px"
                flexShrink={0}
                borderRadius="11px"
                align="center"
                justify="center"
                bg={option.bg}
                color={option.color}
              >
                {option.icon}
              </Flex>
              <Box flex={1} minW={0}>
                <Text fontSize="15px" fontWeight={650} color="text.primary">
                  {t(`shortcut.cards.pill.${key}`)}
                </Text>
                <Text fontSize="12px" color="text.secondary" mt="2px">
                  {t(`shortcut.cards.option.${key}`)}
                </Text>
              </Box>
              <Box
                boxSize="22px"
                flexShrink={0}
                borderRadius="full"
                borderWidth={isOn ? '7px' : '2px'}
                borderColor={isOn ? 'brand.solid' : 'radio.off'}
                aria-hidden
              />
            </Flex>
          )
        })}
      </Box>
      <Box mx="2px" mt="6px">
        <Help>{t('shortcut.cards.sheetHelp')}</Help>
      </Box>
    </BottomSheet>
  )
}
