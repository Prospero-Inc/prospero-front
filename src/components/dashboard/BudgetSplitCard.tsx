import { Amount } from '@/components/ui/Amount'
import type { PeriodCategoryBudget, PeriodSummary } from '@/services/periods'
import type { BudgetCategory } from '@/services/transactions'
import { Box, Flex, Heading, Progress, Stack, Text } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'

const ROWS: { category: BudgetCategory; key: keyof PeriodSummary['budget'] }[] =
  [
    { category: 'Necesidad', key: 'necesidad' },
    { category: 'Deseo', key: 'deseo' },
    { category: 'Ahorro', key: 'ahorro' }
  ]

const percentOf = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0

/**
 * The period's split as bars in one card (~180 px) instead of three
 * 120 px rings stacked on a phone. Each row: spent of budgeted, in the
 * category's color; red once it goes over.
 */
export const BudgetSplitCard = ({
  budget,
  income
}: {
  budget: PeriodSummary['budget']
  income: number
}) => {
  const { t } = useTranslation('common')
  const split = ROWS.map(({ key }) => percentOf(budget[key].budgeted, income))

  const row = (
    category: BudgetCategory,
    { spent, budgeted, remaining }: PeriodCategoryBudget
  ) => {
    const isOver = remaining < 0
    return (
      <Box key={category}>
        <Flex justify="space-between" align="baseline" gap={2} mb={1.5}>
          <Text fontWeight="semibold" color="text.primary">
            {t(`categoryBudget.${category.toLowerCase()}`)}
          </Text>
          <Text fontSize="sm" color="text.secondary">
            <Amount
              value={spent}
              fontSize="sm"
              color={isOver ? 'money.expenseText' : 'text.primary'}
            />{' '}
            {t('dashboard.split.of')} <Amount value={budgeted} fontSize="sm" />
          </Text>
        </Flex>
        <Progress
          value={budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0}
          size="sm"
          borderRadius="full"
          bg="bg.subtle"
          sx={{
            '& > div': {
              bg: isOver ? 'money.expense' : `category.${category}`
            }
          }}
          aria-label={t(`categoryBudget.${category.toLowerCase()}`)}
        />
      </Box>
    )
  }

  return (
    <Box
      bg="bg.surface"
      borderRadius="20px"
      borderWidth="1px"
      borderColor="border.subtle"
      p={{ base: 5, md: 6 }}
      mb={6}
    >
      <Flex justify="space-between" align="baseline" mb={4}>
        <Heading as="h2" size="md" color="text.primary">
          {t('dashboard.split.title')}
        </Heading>
        <Text color="text.secondary" fontWeight="semibold">
          {split.join(' · ')}
        </Text>
      </Flex>
      <Stack spacing={4}>
        {ROWS.map(({ category, key }) => row(category, budget[key]))}
      </Stack>
    </Box>
  )
}
