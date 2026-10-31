import { Amount } from '@/components/ui/Amount'
import { formatMoney } from '@/lib/formatMoney'
import type { PeriodSummary } from '@/services/periods'
import { Box, Flex, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import type { ReactNode } from 'react'

/**
 * The first thing on the dashboard (docs/diseno-mobile.html): how much is
 * left to spend this period, how long it has to last, and roughly how much
 * that is per day — then income vs. spent.
 */
export const BalanceHero = ({
  period,
  caption
}: {
  period: PeriodSummary
  /** Days elapsed / remaining / overdue payment line, built by the page. */
  caption?: ReactNode
}) => {
  const { t } = useTranslation('common')
  const { locale } = useRouter()
  const isOver = period.balance < 0
  const daysLeft = period.estimatedDaysRemaining
  const perDay =
    !isOver && daysLeft !== null && daysLeft > 0
      ? Math.floor(period.balance / daysLeft)
      : null

  return (
    <Box
      bg="bg.surface"
      borderRadius="20px"
      borderWidth="1px"
      borderColor="border.subtle"
      p={{ base: 5, md: 6 }}
      mb={6}
    >
      <Text color="text.secondary" fontWeight="semibold">
        {t(isOver ? 'dashboard.hero.over' : 'dashboard.hero.left')}
      </Text>
      <Amount
        as="p"
        value={isOver ? Math.abs(period.balance) : period.balance}
        fontSize={{ base: '4xl', md: '5xl' }}
        fontWeight="bold"
        lineHeight="short"
        color={isOver ? 'money.expenseText' : 'text.primary'}
      />
      <Stack spacing={1} mt={1} color="text.secondary" fontSize="sm">
        {caption}
        {perDay !== null && (
          <Text>
            {t('dashboard.hero.perDay', {
              amount: formatMoney(perDay, locale).replace(/\.00$/, '')
            })}
          </Text>
        )}
      </Stack>
      <SimpleGrid
        columns={2}
        spacing={4}
        mt={5}
        pt={4}
        borderTopWidth="1px"
        borderColor="border.subtle"
      >
        <Flex direction="column">
          <Text fontSize="sm" color="text.secondary">
            {t('dashboard.hero.income')}
          </Text>
          <Amount value={period.income} kind="neutral" fontSize="lg" />
        </Flex>
        <Flex direction="column">
          <Text fontSize="sm" color="text.secondary">
            {t('dashboard.hero.spent')}
          </Text>
          <Amount value={period.totalSpent} kind="neutral" fontSize="lg" />
        </Flex>
      </SimpleGrid>
    </Box>
  )
}
