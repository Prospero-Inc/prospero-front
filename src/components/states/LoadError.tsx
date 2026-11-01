import { AlertIcon } from '@/components/icons/app'
import { Box, Button, Flex, Text } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import NextLink from 'next/link'

/**
 * "No pudimos cargar …" (docs/diseno-mobile.html, 15): when a screen's data
 * fails to load, say so plainly — never show its empty state instead, which
 * would read as "you have nothing" — with "Reintentar" and a way home.
 */
export const LoadError = ({
  what,
  onRetry,
  isRetrying = false
}: {
  /** "tus movimientos", "tus gastos fijos"… */
  what: string
  onRetry: () => void
  isRetrying?: boolean
}) => {
  const { t } = useTranslation('common')
  return (
    <Box
      role="alert"
      bg="bg.surface"
      borderRadius="20px"
      px="20px"
      py="28px"
      textAlign="center"
    >
      <Flex
        boxSize="64px"
        mx="auto"
        mb="14px"
        borderRadius="20px"
        bg="tint.expense"
        color="money.expenseText"
        align="center"
        justify="center"
        aria-hidden
      >
        <AlertIcon boxSize="30px" />
      </Flex>
      <Text fontSize="18px" fontWeight="bold" color="text.primary">
        {t('states.loadError.title', { what })}
      </Text>
      <Text
        fontSize="13.5px"
        lineHeight="1.5"
        color="text.secondary"
        mt="6px"
        mb="18px"
      >
        {t('states.loadError.text')}
      </Text>
      <Flex gap="10px">
        <Button
          as={NextLink}
          href="/dashboard"
          variant="soft"
          size="ctaSm"
          flex={1}
        >
          {t('states.loadError.home')}
        </Button>
        <Button
          variant="brand"
          size="ctaSm"
          flex={1}
          isLoading={isRetrying}
          onClick={onRetry}
        >
          {t('states.retry')}
        </Button>
      </Flex>
    </Box>
  )
}
