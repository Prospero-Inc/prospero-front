import { CheckIcon, ChevronRightIcon } from '@/components/icons/app'
import { Box, Flex, Input, type InputProps, Text } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import Head from 'next/head'
import NextLink from 'next/link'
import { forwardRef, type ReactElement, type ReactNode, useState } from 'react'

// The account screens of docs/diseno-mobile.html (11 · Crear cuenta, 12 ·
// Entrar y recuperar): white screen, a "‹ Iniciar sesión" bar, a 24 px
// title (.h-xl), muted lead (.p-m), labeled 54 px fields (.lfield) and the
// password rules that tick as you type (.rule-list).

/** White screen with an optional back link on top (design .navbar). */
export const AuthScreen = ({
  title,
  back,
  children
}: {
  /** <title> of the page. */
  title: string
  back?: { href: string; label: string }
  children: ReactNode
}) => (
  <Box minH="100dvh" bg="bg.surface">
    <Head>
      <title>{title}</title>
      <meta name="description" content={title} />
    </Head>
    <Box
      maxW="md"
      mx="auto"
      px="20px"
      pt="env(safe-area-inset-top)"
      pb="calc(32px + env(safe-area-inset-bottom))"
    >
      <Flex h="52px" align="center">
        {back && (
          <Flex
            as={NextLink}
            href={back.href}
            align="center"
            gap="2px"
            h="44px"
            ml="-10px"
            color="brand.text"
            fontSize="15px"
            fontWeight={600}
            _focusVisible={{ boxShadow: 'outline', outline: 'none' }}
          >
            <ChevronRightIcon boxSize="22px" transform="rotate(180deg)" />
            {back.label}
          </Flex>
        )}
      </Flex>
      {children}
    </Box>
  </Box>
)

/** .h-xl */
export const AuthTitle = ({
  children,
  center = false
}: {
  children: ReactNode
  center?: boolean
}) => (
  <Text
    as="h1"
    fontSize="24px"
    fontWeight="bold"
    lineHeight="1.25"
    letterSpacing="-0.01em"
    color="text.primary"
    textAlign={center ? 'center' : undefined}
  >
    {children}
  </Text>
)

/** .p-m */
export const AuthLead = ({
  children,
  center = false,
  fontSize = '14px'
}: {
  children: ReactNode
  center?: boolean
  fontSize?: string
}) => (
  <Text
    fontSize={fontSize}
    lineHeight="1.5"
    color="text.secondary"
    textAlign={center ? 'center' : undefined}
  >
    {children}
  </Text>
)

/** .big-ill: soft brand square with a big icon. */
export const AuthIllustration = ({
  icon,
  size = '96px'
}: {
  icon: ReactElement
  size?: '96px' | '72px'
}) => (
  <Flex
    boxSize={size}
    mx="auto"
    borderRadius={size === '96px' ? '30px' : '22px'}
    bg="brand.subtle"
    color="brand.text"
    align="center"
    justify="center"
    aria-hidden
  >
    {icon}
  </Flex>
)

/** .lfield: 13 px label over the field, and its error under it. */
export const AuthField = ({
  id,
  label,
  error,
  children,
  mb = '14px'
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
  mb?: string
}) => (
  <Box mb={mb} flex={1} minW={0}>
    <Text
      as="label"
      htmlFor={id}
      display="block"
      textStyle="fieldLabel"
      mb="6px"
    >
      {label}
    </Text>
    {children}
    {error && (
      <Text color="money.expenseText" fontSize="13px" mt="6px" role="alert">
        {error}
      </Text>
    )}
  </Box>
)

/** .lfield .box for a password, with "Mostrar" / "Ocultar" inside it. */
export const AuthPasswordInput = forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    const { t } = useTranslation('common')
    const [visible, setVisible] = useState(false)
    return (
      <Box position="relative">
        <Input
          ref={ref}
          variant="design"
          type={visible ? 'text' : 'password'}
          pr="88px"
          // Keep room for "Mostrar" also with the 2 px focus border.
          _focusVisible={{
            borderColor: 'brand.solid',
            borderWidth: '2px',
            pl: '13.5px',
            pr: '87.5px'
          }}
          {...props}
        />
        <Box
          as="button"
          type="button"
          position="absolute"
          right="6px"
          top="5px"
          h="44px"
          px="10px"
          zIndex={1}
          fontSize="13px"
          fontWeight={600}
          color="brand.text"
          aria-pressed={visible}
          onClick={() => setVisible(on => !on)}
        >
          {t(visible ? 'account.hidePassword' : 'account.showPassword')}
        </Box>
      </Box>
    )
  }
)
AuthPasswordInput.displayName = 'AuthPasswordInput'

/** The backend's password policy (password-policy.ts), one rule each. */
export const PASSWORD_RULES = [
  { key: 'length', test: (value: string) => value.length >= 8 },
  { key: 'upper', test: (value: string) => /[A-Z]/.test(value) },
  { key: 'lower', test: (value: string) => /[a-z]/.test(value) },
  { key: 'number', test: (value: string) => /\d/.test(value) },
  { key: 'symbol', test: (value: string) => /[^A-Za-z0-9]/.test(value) }
] as const

export const meetsPasswordPolicy = (value: string) =>
  PASSWORD_RULES.every(rule => rule.test(value))

/** .rule-list: each requirement ticks green as soon as it's met. `extra`
 * adds rules like "Coinciden" on the reset screen. */
export const PasswordRules = ({
  value,
  extra = []
}: {
  value: string
  extra?: { label: string; ok: boolean }[]
}) => {
  const { t } = useTranslation('common')
  const rules = [
    ...PASSWORD_RULES.map(rule => ({
      label: t(`account.rules.${rule.key}`),
      ok: rule.test(value)
    })),
    ...extra
  ]
  return (
    <Flex
      as="ul"
      listStyleType="none"
      wrap="wrap"
      columnGap="12px"
      rowGap="6px"
      mt="-6px"
      mb="18px"
      mx="2px"
      aria-live="polite"
    >
      {rules.map(rule => (
        <Flex
          as="li"
          key={rule.label}
          align="center"
          gap="4px"
          fontSize="12px"
          fontWeight={rule.ok ? 600 : 'normal'}
          color={rule.ok ? 'money.incomeText' : 'text.secondary'}
        >
          {rule.ok ? (
            <CheckIcon boxSize="13px" aria-hidden />
          ) : (
            <Box as="span" aria-hidden>
              ○
            </Box>
          )}
          <Box as="span">
            {rule.label}
            <Box as="span" srOnly>
              {rule.ok ? ` (${t('account.rules.met')})` : ''}
            </Box>
          </Box>
        </Flex>
      ))}
    </Flex>
  )
}

/** "Listo, revisá tu correo": the green confirmation box of design 12. */
export const SentNotice = ({
  title,
  children
}: {
  title: string
  children: ReactNode
}) => (
  <Flex
    role="status"
    gap="12px"
    mt="28px"
    p="14px"
    bg="tint.income"
    borderRadius="16px"
  >
    <CheckIcon boxSize="22px" color="money.incomeText" flex="none" />
    <Box>
      <Text fontSize="14px" fontWeight={650} color="text.primary">
        {title}
      </Text>
      <Text fontSize="13px" color="text.secondary" mt="3px" lineHeight="1.45">
        {children}
      </Text>
    </Box>
  </Flex>
)
