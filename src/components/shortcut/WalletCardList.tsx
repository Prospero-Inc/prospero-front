import { BankBadge, Help } from '@/components/design/settings'
import { TrashIcon } from '@/components/icons/app'
import { ChoiceButton } from '@/components/ui/ChoiceButton'
import type { BudgetCategory } from '@/services/transactions'
import type { WalletCard } from '@/services/walletCards'
import { Box, Flex, IconButton, SimpleGrid, Text } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'

/** What a card's expenses become; `null` = "según el comercio". */
export type WalletCardCategory = BudgetCategory | null

const OPTIONS: { value: WalletCardCategory; color: string }[] = [
  { value: 'Necesidad', color: 'category.Necesidad' },
  { value: 'Deseo', color: 'category.Deseo' },
  { value: 'Ahorro', color: 'category.Ahorro' },
  { value: null, color: 'text.secondary' }
]

/** "Necesidad", "Deseo", "Ahorro" or "Según el comercio". */
export const useWalletCategoryLabel = () => {
  const { t } = useTranslation('settings')
  const { t: tCommon } = useTranslation('common')
  return (value: WalletCardCategory) =>
    value === null
      ? t('shortcut.cards.byMerchant')
      : tCommon(`quickAdd.categories.${value}`)
}

interface WalletCardListProps {
  cards: WalletCard[]
  /** Card being deleted right now. */
  deletingId: number | null
  onChangeCategory: (_card: WalletCard, _category: WalletCardCategory) => void
  onDelete: (_card: WalletCard) => void
}

/** "Tus tarjetas de Wallet": each detected card with its four choices. */
export const WalletCardList = ({
  cards,
  deletingId,
  onChangeCategory,
  onDelete
}: WalletCardListProps) => {
  const { t } = useTranslation('settings')
  const optionLabel = useWalletCategoryLabel()

  if (cards.length === 0) return <Help>{t('shortcut.cards.empty')}</Help>

  return (
    <>
      {cards.map(card => (
        <Box key={card.id} as="article" layerStyle="bankCard">
          <Flex align="center" gap="12px">
            <BankBadge name={card.institutionName ?? card.name} />
            <Box flex={1} minW={0}>
              <Text
                fontSize="15px"
                fontWeight={650}
                color="text.primary"
                noOfLines={1}
              >
                {card.name}
              </Text>
              {card.institutionName && (
                <Text textStyle="rowHint" noOfLines={1}>
                  {card.institutionName}
                </Text>
              )}
            </Box>
            <IconButton
              aria-label={t('shortcut.cards.deleteLabel', { name: card.name })}
              icon={<TrashIcon boxSize="18px" />}
              variant="ghost"
              color="icon.subtle"
              boxSize="44px"
              minW="44px"
              mr="-10px"
              isLoading={deletingId === card.id}
              onClick={() => onDelete(card)}
            />
          </Flex>
          <SimpleGrid
            columns={2}
            spacing="8px"
            mt="12px"
            role="group"
            aria-label={t('shortcut.cards.categoryLabel', { name: card.name })}
          >
            {OPTIONS.map(option => (
              <ChoiceButton
                key={option.value ?? 'merchant'}
                label={optionLabel(option.value)}
                color={option.color}
                isSelected={card.defaultCategory === option.value}
                onClick={() => {
                  if (card.defaultCategory !== option.value)
                    onChangeCategory(card, option.value)
                }}
              />
            ))}
          </SimpleGrid>
        </Box>
      ))}
    </>
  )
}
