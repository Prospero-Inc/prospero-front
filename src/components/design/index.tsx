import {
  ArrowDownIcon,
  CartIcon,
  CupIcon,
  PiggyIcon
} from '@/components/icons/app'
import type { BudgetCategory } from '@/services/transactions'
import {
  Box,
  Flex,
  type FlexProps,
  type IconProps,
  Text
} from '@chakra-ui/react'
import type { ComponentType, ReactNode } from 'react'

// Building blocks of docs/diseno-mobile.html, with its sizes and colors:
// segmented control (.seg), chips (.chip), category icon (.cat), list row
// (.row), day header (.day) and grouped list card (.card).

const tabular = { fontVariantNumeric: 'tabular-nums' }

export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  label
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (_value: T) => void
  label: string
}) => (
  <Flex bg="seg.bg" borderRadius="14px" p="4px" role="group" aria-label={label}>
    {options.map(option => {
      const on = option.value === value
      return (
        <Box
          key={option.value}
          as="button"
          type="button"
          aria-pressed={on}
          onClick={() => onChange(option.value)}
          flex={1}
          h="38px"
          borderRadius="11px"
          fontSize="14px"
          fontWeight="semibold"
          color={on ? 'text.primary' : 'text.secondary'}
          bg={on ? 'seg.on' : 'transparent'}
          boxShadow={on ? '0 1px 3px rgba(0,0,0,.08)' : 'none'}
          transition="background 0.15s"
        >
          {option.label}
        </Box>
      )
    })}
  </Flex>
)

export const Chip = ({
  children,
  isOn = false,
  icon,
  onClick,
  ...rest
}: {
  children: ReactNode
  isOn?: boolean
  icon?: ReactNode
  onClick?: () => void
} & Omit<FlexProps, 'onClick'>) => (
  <Flex
    as="button"
    type="button"
    onClick={onClick}
    aria-pressed={isOn}
    h="36px"
    borderRadius="18px"
    px="14px"
    align="center"
    gap="6px"
    fontSize="13px"
    fontWeight="semibold"
    whiteSpace="nowrap"
    borderWidth="1px"
    borderColor={isOn ? 'text.primary' : 'border.subtle'}
    bg={isOn ? 'text.primary' : 'bg.surface'}
    color={isOn ? 'bg.surface' : 'text.primary'}
    {...rest}
  >
    {icon}
    {children}
  </Flex>
)

const CATEGORY_ICON: Record<BudgetCategory, ComponentType<IconProps>> = {
  Necesidad: CartIcon,
  Deseo: CupIcon,
  Ahorro: PiggyIcon
}

/** 40 px tinted square with the category's icon (or ↓ for income). */
export const CategoryIconBox = ({
  category,
  isIncome = false
}: {
  category?: BudgetCategory | null
  isIncome?: boolean
}) => {
  const MovementIcon = isIncome
    ? ArrowDownIcon
    : CATEGORY_ICON[category ?? 'Necesidad']
  return (
    <Box
      w="40px"
      h="40px"
      borderRadius="13px"
      bg={isIncome ? 'tint.income' : `tint.${category ?? 'Necesidad'}`}
      color={isIncome ? 'money.income' : `category.${category ?? 'Necesidad'}`}
      display="grid"
      placeItems="center"
      flex="none"
    >
      <MovementIcon boxSize="20px" />
    </Box>
  )
}

export const categoryIcon = (category: BudgetCategory) =>
  CATEGORY_ICON[category]

/** One movement: icon, title + subtitle, amount (+green income / −ink expense). */
export const MovementRow = ({
  icon,
  title,
  subtitle,
  amount,
  isIncome = false,
  trailing
}: {
  icon: ReactNode
  title: string
  subtitle: string
  amount: string
  isIncome?: boolean
  trailing?: ReactNode
}) => (
  <Flex align="center" gap="12px" py="10px">
    {icon}
    <Box flex={1} minW={0}>
      <Text
        fontSize="14px"
        fontWeight="semibold"
        color="text.primary"
        noOfLines={1}
      >
        {title}
      </Text>
      <Text fontSize="12px" color="text.secondary" mt="2px" noOfLines={1}>
        {subtitle}
      </Text>
    </Box>
    {trailing ?? (
      <Text
        fontSize="14.5px"
        fontWeight={650}
        color={isIncome ? 'money.incomeText' : 'text.primary'}
        sx={tabular}
        whiteSpace="nowrap"
      >
        {amount}
      </Text>
    )}
  </Flex>
)

export const DayHeader = ({ children }: { children: ReactNode }) => (
  <Text
    as="h2"
    fontSize="12px"
    fontWeight="bold"
    color="text.secondary"
    textTransform="uppercase"
    letterSpacing="0.06em"
    mx="2px"
    mt="4px"
    mb="-4px"
  >
    {children}
  </Text>
)

/** White rounded card holding rows separated by hairlines. */
export const ListCard = ({ children }: { children: ReactNode }) => (
  <Box
    bg="bg.surface"
    borderRadius="20px"
    py="4px"
    px="14px"
    sx={{
      '& > * + *': { borderTop: '1px solid', borderColor: 'border.subtle' }
    }}
  >
    {children}
  </Box>
)
