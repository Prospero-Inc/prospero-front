import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import Head from 'next/head'
import type { ReactElement, ReactNode } from 'react'

/**
 * A whole-screen state (docs/diseno-mobile.html, 15 · "Sin conexión"):
 * white screen, a soft square with an icon, a centered title, a short
 * explanation and the actions. No session or user data: it must render
 * even when nothing else can.
 */
export const FullScreenState = ({
  pageTitle,
  icon,
  tone = 'neutral',
  title,
  text,
  children
}: {
  pageTitle: string
  icon: ReactElement
  tone?: 'neutral' | 'error'
  title: string
  text: string
  /** The buttons. */
  children: ReactNode
}) => (
  <Box minH="100dvh" bg="bg.surface">
    <Head>
      <title>{pageTitle}</title>
    </Head>
    <Stack
      spacing="14px"
      maxW="sm"
      mx="auto"
      px="28px"
      pt="calc(110px + env(safe-area-inset-top))"
      pb="calc(32px + env(safe-area-inset-bottom))"
    >
      <Flex
        boxSize="96px"
        mx="auto"
        borderRadius="30px"
        bg={tone === 'error' ? 'tint.expense' : 'button.soft'}
        color={tone === 'error' ? 'money.expenseText' : 'text.secondary'}
        align="center"
        justify="center"
        aria-hidden
      >
        {icon}
      </Flex>
      <Text
        as="h1"
        textAlign="center"
        fontSize="24px"
        fontWeight="bold"
        lineHeight="1.25"
        letterSpacing="-0.01em"
        color="text.primary"
      >
        {title}
      </Text>
      <Text
        textAlign="center"
        fontSize="14.5px"
        lineHeight="1.5"
        color="text.secondary"
      >
        {text}
      </Text>
      <Stack spacing="10px" pt="10px">
        {children}
      </Stack>
    </Stack>
  </Box>
)
