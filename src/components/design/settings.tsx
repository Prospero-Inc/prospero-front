import { ChevronRightIcon } from '@/components/icons/app'
import {
  Box,
  Button,
  Flex,
  type FlexProps,
  HStack,
  PinInput,
  PinInputField,
  Stack,
  Text
} from '@chakra-ui/react'
import NextLink from 'next/link'
import type { ReactElement, ReactNode } from 'react'

// Rows, cards and controls of "Más" and the settings screens
// (docs/diseno-mobile.html, 03 and 06–09): .list/.li, .frm/.frow, .sw-row,
// .toggle, .grp, .help, .status-card, .seg-2 and .stepper.

/** `.li .ic`: 32 px soft square holding an 18 px icon. */
export const IconBox = ({
  icon,
  bg = 'button.soft',
  color = 'text.primary',
  size = '32px'
}: {
  icon: ReactElement
  bg?: string
  color?: string
  size?: string
}) => (
  <Flex
    boxSize={size}
    flexShrink={0}
    borderRadius={size === '32px' ? '10px' : '13px'}
    bg={bg}
    color={color}
    align="center"
    justify="center"
  >
    {icon}
  </Flex>
)

export const Chevron = () => (
  <ChevronRightIcon boxSize="16px" color="icon.subtle" />
)

/** One `.li` row: 56 px, icon box, 15 px label, muted value on the right.
 * A link when `href` is given, a button when `onClick` is. */
export const ListRow = ({
  icon,
  label,
  value,
  href,
  onClick,
  color = 'text.primary',
  ...rest
}: {
  icon: ReactElement
  label: string
  value?: ReactNode
  href?: string
  onClick?: () => void
  color?: string
  role?: 'switch'
  'aria-checked'?: boolean
  'aria-current'?: 'true'
}) => (
  <Flex
    as={href ? NextLink : 'button'}
    {...(href ? { href } : { type: 'button', onClick })}
    {...rest}
    w="full"
    align="center"
    gap="12px"
    h="56px"
    fontSize="15px"
    fontWeight={550}
    color={color}
    textAlign="left"
    _focusVisible={{ boxShadow: 'outline', outline: 'none' }}
  >
    {icon}
    <Box as="span" flex={1} minW={0} noOfLines={1}>
      {label}
    </Box>
    {value !== undefined && (
      <Flex
        as="span"
        align="center"
        gap="6px"
        fontSize="13.5px"
        fontWeight="normal"
        color="text.secondary"
        flexShrink={0}
      >
        {value}
      </Flex>
    )}
  </Flex>
)

/** `.list` / `.frm`: white card, radius 18, hairlines between rows. */
export const ListCard = ({
  children,
  py = 0
}: {
  children: ReactNode
  py?: string | number
}) => (
  <Stack
    spacing={0}
    layerStyle="card"
    py={py}
    divider={<Box borderTopWidth="1px" borderColor="border.subtle" />}
  >
    {children}
  </Stack>
)

/** `.grp`: 12 px uppercase section label. */
export const Group = ({
  children,
  action
}: {
  children: ReactNode
  action?: ReactNode
}) => (
  <Flex align="center" justify="space-between" mx="4px" mt="6px" mb="-4px">
    <Text as="h2" textStyle="group">
      {children}
    </Text>
    {action}
  </Flex>
)

/** `.help`: muted note under a card. */
export const Help = ({ children }: { children: ReactNode }) => (
  <Text textStyle="help" mx="4px" mt="-4px">
    {children}
  </Text>
)

/** `.toggle`: 46 × 28 green pill (the row itself is the switch). */
export const Toggle = ({ isOn }: { isOn: boolean }) => (
  <Box
    as="span"
    position="relative"
    flexShrink={0}
    w="46px"
    h="28px"
    borderRadius="14px"
    bg={isOn ? 'money.income' : 'toggle.off'}
    transition="background .2s"
  >
    <Box
      as="span"
      position="absolute"
      top="3px"
      left={isOn ? '21px' : '3px'}
      boxSize="22px"
      borderRadius="full"
      bg="white"
      transition="left .2s"
    />
  </Box>
)

/** `.sw-row`: title, optional hint and a toggle; the whole row is the
 * switch. */
export const SwitchRow = ({
  title,
  hint,
  icon,
  isOn,
  isDisabled = false,
  onToggle
}: {
  title: string
  hint?: string
  icon?: ReactElement
  isOn: boolean
  isDisabled?: boolean
  onToggle: () => void
}) => (
  <Flex
    as="button"
    type="button"
    role="switch"
    aria-checked={isOn}
    aria-label={title}
    disabled={isDisabled}
    onClick={onToggle}
    w="full"
    align="center"
    gap="12px"
    minH="60px"
    py="8px"
    textAlign="left"
    _disabled={{ opacity: 0.55, cursor: 'not-allowed' }}
    _focusVisible={{ boxShadow: 'outline', outline: 'none' }}
  >
    {icon}
    <Box flex={1} minW={0}>
      <Text textStyle="rowTitle">{title}</Text>
      {hint && (
        <Text textStyle="rowHint" mt="2px">
          {hint}
        </Text>
      )}
    </Box>
    <Toggle isOn={isOn} />
  </Flex>
)

/** `.frow`: muted 96 px label on the left and the value (or field). */
export const FieldRow = ({
  label,
  htmlFor,
  children,
  ...rest
}: {
  label: string
  htmlFor?: string
  children: ReactNode
} & FlexProps) => (
  <Flex align="center" minH="56px" gap="12px" fontSize="15px" {...rest}>
    <Text
      as={htmlFor ? 'label' : 'span'}
      {...(htmlFor ? { htmlFor } : {})}
      textStyle="rowLabel"
      w="96px"
      flex="none"
    >
      {label}
    </Text>
    {children}
  </Flex>
)

/** `.pill-ok` / `.pill-off`. */
export const StatusPill = ({
  isOn,
  children
}: {
  isOn: boolean
  children: ReactNode
}) => (
  <Box as="span" layerStyle={isOn ? 'pillOn' : 'pillOff'}>
    {isOn && (
      <Box as="span" boxSize="7px" borderRadius="full" bg="money.incomeText" />
    )}
    {children}
  </Box>
)

/** `.status-card .hd`: icon, title and a status pill. */
export const StatusCardHeader = ({
  icon,
  title,
  status
}: {
  icon: ReactElement
  title: string
  status: ReactNode
}) => (
  <Flex align="center" gap="12px">
    {icon}
    <Box flex={1} minW={0}>
      <Text fontSize="15px" fontWeight={650} color="text.primary" noOfLines={1}>
        {title}
      </Text>
      <Box mt="4px">{status}</Box>
    </Box>
  </Flex>
)

/** `.choice` (onboarding) / `.seg-2` (Presupuesto): title, hint and, in the
 * onboarding list, a radio dot; 2 px brand border when chosen. */
export const ChoiceCard = ({
  title,
  hint,
  isSelected,
  onClick,
  showRadio = true
}: {
  title: string
  hint: string
  isSelected: boolean
  onClick: () => void
  showRadio?: boolean
}) => (
  <Flex
    as="button"
    type="button"
    aria-pressed={isSelected}
    onClick={onClick}
    flex={1}
    align="center"
    gap="14px"
    p={
      showRadio
        ? isSelected
          ? '15.5px'
          : '16px'
        : isSelected
        ? '13.5px'
        : '14px'
    }
    borderRadius={showRadio ? '18px' : '16px'}
    borderWidth={isSelected ? '2px' : '1.5px'}
    borderColor={isSelected ? 'brand.solid' : 'choice.border'}
    bg={isSelected ? 'choice.onBg' : 'bg.surface'}
    textAlign="left"
    _focusVisible={{ boxShadow: 'outline', outline: 'none' }}
  >
    <Box flex={1} minW={0}>
      <Text
        fontSize={showRadio ? '15.5px' : '15px'}
        fontWeight={showRadio ? 650 : 'bold'}
        color="text.primary"
      >
        {title}
      </Text>
      <Text
        fontSize={showRadio ? '12.5px' : '12px'}
        color="text.secondary"
        mt="3px"
        lineHeight="1.4"
      >
        {hint}
      </Text>
    </Box>
    {showRadio && (
      <Box
        boxSize="22px"
        flexShrink={0}
        borderRadius="full"
        borderWidth={isSelected ? '7px' : '2px'}
        borderColor={isSelected ? 'brand.solid' : 'radio.off'}
        aria-hidden
      />
    )}
  </Flex>
)

/** `.stepper .b`: 40 px soft square with − / +, inside a 44 px touch
 * target (place them 6 px apart to get the design's 10 px between squares). */
export const StepperButton = ({
  label,
  isDisabled,
  onClick,
  children
}: {
  label: string
  isDisabled: boolean
  onClick: () => void
  children: string
}) => (
  <Button
    aria-label={label}
    variant="unstyled"
    boxSize="44px"
    minW="44px"
    p={0}
    display="grid"
    placeItems="center"
    color="text.primary"
    _active={{ opacity: 0.8 }}
    isDisabled={isDisabled}
    onClick={onClick}
  >
    <Box
      as="span"
      boxSize="40px"
      borderRadius="12px"
      bg="button.soft"
      display="grid"
      placeItems="center"
      fontSize="20px"
      fontWeight={600}
      aria-hidden
    >
      {children}
    </Box>
  </Button>
)

/** "BAC", "Banco Agrícola" → "BAC", "AGR": the design's 3-letter badge
 * (a leading "Banco" says nothing about which bank it is). */
export const bankInitials = (name: string) =>
  name
    .replace(/^banco\s+/i, '')
    .normalize('NFD')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase()

// The design's colors for the two banks it shows; others get a stable pick.
const KNOWN_BANK_PALETTES: Record<string, 'a' | 'b'> = { BAC: 'a', AGR: 'b' }

/** Same bank, same palette: a stable pick between the two badge colors. */
const bankPalette = (name: string) =>
  KNOWN_BANK_PALETTES[bankInitials(name)] ??
  (name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 2 === 0
    ? 'a'
    : 'b')

/** 40 px (32 px in sheets) square with the bank's initials. */
export const BankBadge = ({
  name,
  size = '40px'
}: {
  name: string | null
  size?: '40px' | '32px'
}) => {
  const palette = name ? bankPalette(name) : 'a'
  return (
    <Flex
      boxSize={size}
      flexShrink={0}
      borderRadius={size === '40px' ? '12px' : '10px'}
      bg={`bank.${palette}Bg`}
      color={`bank.${palette}Text`}
      fontSize={size === '40px' ? '12px' : '10px'}
      fontWeight={800}
      align="center"
      justify="center"
      aria-hidden
    >
      {name ? bankInitials(name) : '·'}
    </Flex>
  )
}

const CODE_LENGTH = 6

/** design .otp: six 46 × 56 boxes, 24 px digits, a wider gap after the
 * third; numeric keyboard and the OS's one-time-code autofill. `onComplete`
 * fires with the sixth digit. */
export const CodeInput = ({
  value,
  onChange,
  onComplete,
  digitLabel,
  isInvalid = false,
  isDisabled = false,
  autoFocus = true
}: {
  value: string
  onChange: (_value: string) => void
  onComplete?: (_value: string) => void
  /** Accessible name of each box, e.g. position => `Dígito ${position}`. */
  digitLabel: (_position: number) => string
  isInvalid?: boolean
  isDisabled?: boolean
  autoFocus?: boolean
}) => (
  <HStack justify="center" spacing="8px">
    <PinInput
      otp
      type="number"
      placeholder=""
      autoFocus={autoFocus}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      isInvalid={isInvalid}
      isDisabled={isDisabled}
    >
      {Array.from({ length: CODE_LENGTH }, (_, index) => (
        <PinInputField
          key={index}
          aria-label={digitLabel(index + 1)}
          {...(index === 0 ? { autoComplete: 'one-time-code' } : {})}
          ml={index === 3 ? '8px' : undefined}
          w="46px"
          h="56px"
          borderRadius="14px"
          border="1.5px solid"
          borderColor="field.border"
          bg="bg.surface"
          fontSize="24px"
          fontWeight="bold"
          color="text.primary"
          _focusVisible={{ borderColor: 'brand.solid', borderWidth: '2px' }}
          _invalid={{ borderColor: 'money.expenseText' }}
        />
      ))}
    </PinInput>
  </HStack>
)

/** design .stepnum: numbered brand circle and the step's title. */
export const StepTitle = ({
  number,
  children
}: {
  number: number
  children: ReactNode
}) => (
  <Flex
    as="h2"
    align="center"
    gap="10px"
    fontSize="14px"
    fontWeight="bold"
    color="text.primary"
  >
    <Flex
      as="span"
      boxSize="26px"
      flexShrink={0}
      borderRadius="full"
      bg="brand.solid"
      color="white"
      fontSize="13px"
      align="center"
      justify="center"
    >
      {number}
    </Flex>
    {children}
  </Flex>
)

/** design .steps: one 5 px bar per step, filled up to the current one. */
export const StepBars = ({
  current,
  total
}: {
  current: number
  total: number
}) => (
  <Flex gap="6px" my="8px" aria-hidden>
    {Array.from({ length: total }, (_, index) => (
      <Box
        key={index}
        flex={1}
        h="5px"
        borderRadius="3px"
        bg={index < current ? 'brand.solid' : 'steps.off'}
      />
    ))}
  </Flex>
)
