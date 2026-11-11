import { StoreIcon } from '@/components/icons/app'
import type { BudgetCategory } from '@/services/transactions'
import { Box } from '@chakra-ui/react'
import type { ReactElement } from 'react'

/** What a card's expenses become; `null` = "según el comercio". */
export type WalletCardCategory = BudgetCategory | null

/** i18n key suffix of each choice. */
export const categoryKey = (value: WalletCardCategory) => value ?? 'merchant'

// The design's card art gradients (18 · "Tus tarjetas de Wallet").
const CARD_ART = [
  'linear-gradient(135deg,#C2410C,#E8590C)',
  'linear-gradient(135deg,#3F3FC8,#5352ED)',
  'linear-gradient(135deg,#A86B00,#F59F00)'
] as const

/** Same card, same art. */
export const cardArt = (id: number): string =>
  CARD_ART[Math.abs(id) % CARD_ART.length]

const Dot = ({ color }: { color: string }) => (
  <Box as="span" boxSize="9px" borderRadius="full" bg={color} flexShrink={0} />
)

/** design .catpill colors and leading mark, per choice. */
export const CATEGORY_PILL: Record<
  ReturnType<typeof categoryKey>,
  { bg: string; color: string; mark: ReactElement }
> = {
  merchant: {
    bg: 'button.soft',
    color: 'text.primary',
    mark: <StoreIcon boxSize="14px" />
  },
  Necesidad: {
    bg: 'brand.subtle',
    color: 'brand.text',
    mark: <Dot color="category.Necesidad" />
  },
  Deseo: {
    bg: 'tint.Deseo',
    color: 'bank.aText',
    mark: <Dot color="category.Deseo" />
  },
  Ahorro: {
    bg: 'tint.Ahorro',
    color: 'money.incomeText',
    mark: <Dot color="category.Ahorro" />
  }
}
