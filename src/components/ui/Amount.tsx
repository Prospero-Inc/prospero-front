import { formatMoney } from '@/lib/formatMoney'
import { Text, type TextProps } from '@chakra-ui/react'
import { useRouter } from 'next/router'

type AmountKind = 'income' | 'expense' | 'neutral'

interface AmountProps extends Omit<TextProps, 'children'> {
  value: number
  /** Colors and signs it: income +green, expense −red. */
  kind?: AmountKind
}

const COLOR: Record<AmountKind, string> = {
  income: 'money.incomeText',
  expense: 'money.expenseText',
  neutral: 'text.primary'
}

/**
 * A money amount: tabular figures so columns line up, the app's format
 * (formatMoney: $1,234.50) and one color per meaning.
 */
export const Amount = ({ value, kind = 'neutral', ...rest }: AmountProps) => {
  const { locale } = useRouter()
  const signed =
    kind === 'income'
      ? `+${formatMoney(Math.abs(value), locale)}`
      : kind === 'expense'
      ? formatMoney(-Math.abs(value), locale).replace('-', '−')
      : formatMoney(value, locale)

  return (
    <Text
      as="span"
      color={COLOR[kind]}
      fontWeight="semibold"
      sx={{ fontVariantNumeric: 'tabular-nums' }}
      whiteSpace="nowrap"
      {...rest}
    >
      {signed}
    </Text>
  )
}
