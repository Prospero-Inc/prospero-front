import { categoryIcon } from '@/components/design'
import { ChevronRightIcon } from '@/components/icons/app'
import type { BudgetCategory } from '@/services/transactions'
import { Box, Flex, Input, Text } from '@chakra-ui/react'
import type { ReactNode, RefObject } from 'react'

// Pieces of the design's bottom sheets for money (docs/diseno-mobile.html,
// 01 · "Nuevo movimiento"): the big amount (.amount-in), the three
// category buttons (.cats3) and the tappable rows (.field).

export const CATEGORIES: BudgetCategory[] = ['Necesidad', 'Deseo', 'Ahorro']

/** Design .cats3 button: 64 px, icon over label; selected = 2 px colored
 * border on the category's tint. */
export const OptionTile = ({
  icon,
  label,
  isSelected,
  color,
  tint,
  onClick
}: {
  icon: ReactNode
  label: string
  isSelected: boolean
  color: string
  tint: string
  onClick: () => void
}) => (
  <Flex
    as="button"
    type="button"
    onClick={onClick}
    aria-pressed={isSelected}
    flex={1}
    h="64px"
    borderRadius="16px"
    borderWidth={isSelected ? '2px' : '1.5px'}
    borderColor={isSelected ? color : 'border.subtle'}
    bg={isSelected ? tint : 'transparent'}
    direction="column"
    align="center"
    justify="center"
    gap="5px"
    fontSize="13px"
    fontWeight={650}
    color="text.primary"
  >
    <Box color={color}>{icon}</Box>
    {label}
  </Flex>
)

/** The three budget categories as .cats3 buttons. */
export const CategoryTiles = ({
  label,
  value,
  onChange,
  labelOf
}: {
  label: string
  value: BudgetCategory | null
  onChange: (_value: BudgetCategory) => void
  labelOf: (_category: BudgetCategory) => string
}) => (
  <Flex gap="10px" role="group" aria-label={label}>
    {CATEGORIES.map(option => {
      const CategoryIcon = categoryIcon(option)
      return (
        <OptionTile
          key={option}
          icon={<CategoryIcon boxSize="20px" />}
          label={labelOf(option)}
          isSelected={value === option}
          color={`category.${option}`}
          tint={`tint.${option}`}
          onClick={() => onChange(option)}
        />
      )
    })}
  </Flex>
)

/** .amount-in: "$" and a 52 px amount with a decimal keyboard. */
export const AmountField = ({
  value,
  onChange,
  label,
  error,
  inputRef
}: {
  value: string
  onChange: (_value: string) => void
  label: string
  /** Shown under the amount when what's typed isn't a valid amount. */
  error?: string | null
  inputRef?: RefObject<HTMLInputElement>
}) => (
  <>
    <Flex
      as="label"
      justify="center"
      align="baseline"
      pt="16px"
      pb="10px"
      fontSize="52px"
      fontWeight="bold"
      letterSpacing="-0.02em"
      lineHeight="1.1"
    >
      <Text
        as="span"
        color="text.secondary"
        fontWeight="semibold"
        opacity={0.7}
      >
        $
      </Text>
      <Input
        ref={inputRef}
        aria-label={label}
        value={value}
        onChange={event => onChange(event.target.value)}
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        variant="unstyled"
        textAlign="left"
        fontSize="52px"
        fontWeight="bold"
        h="auto"
        w={`${Math.max(value.length, 4) + 0.5}ch`}
        maxW="70%"
        color="text.primary"
        sx={{
          fontVariantNumeric: 'tabular-nums',
          caretColor: 'var(--chakra-colors-brand-solid)'
        }}
      />
    </Flex>
    {error && (
      <Text color="money.expenseText" fontSize="sm" textAlign="center" mb={2}>
        {error}
      </Text>
    )}
  </>
)

/** .field: 52 px soft row with a label, the value and a chevron. The
 * native control (`children`) covers it invisibly, so tapping anywhere opens
 * the system picker. */
export const PickerField = ({
  label,
  value,
  children
}: {
  label: string
  value: ReactNode
  children: ReactNode
}) => (
  <Flex
    as="label"
    position="relative"
    h="52px"
    borderRadius="14px"
    bg="field.bg"
    align="center"
    px="14px"
    gap="10px"
    fontSize="16px"
    cursor="pointer"
  >
    <Text
      as="span"
      color="text.secondary"
      fontSize="14px"
      w="84px"
      flexShrink={0}
    >
      {label}
    </Text>
    <Text as="span" fontWeight="semibold" color="text.primary" noOfLines={1}>
      {value}
    </Text>
    <ChevronRightIcon boxSize="18px" ml="auto" color="text.secondary" />
    {children}
  </Flex>
)

/** .field holding a text input instead of a picker. */
export const TextField = ({
  label,
  children
}: {
  label: string
  children: ReactNode
}) => (
  <Flex
    as="label"
    h="52px"
    borderRadius="14px"
    bg="field.bg"
    align="center"
    px="14px"
    gap="10px"
  >
    <Text
      as="span"
      color="text.secondary"
      fontSize="14px"
      w="84px"
      flexShrink={0}
    >
      {label}
    </Text>
    {children}
  </Flex>
)

/** Native control stretched invisibly over a PickerField. */
export const PICKER_OVERLAY = {
  position: 'absolute',
  inset: 0,
  h: 'full',
  w: 'full',
  opacity: 0,
  cursor: 'pointer'
} as const
