import { PeriodCategoryBudget } from '@/services/periods'
import { Box, Flex, Progress, Stack, Text } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'

interface CategoryBudgetBarsProps {
  necesidad: PeriodCategoryBudget
  deseo: PeriodCategoryBudget
  ahorro: PeriodCategoryBudget
}

const CATEGORY_COLORS: Record<keyof CategoryBudgetBarsProps, string> = {
  necesidad: 'blue',
  deseo: 'purple',
  ahorro: 'green'
}

const CategoryBar = ({
  label,
  budget,
  colorScheme
}: {
  label: string
  budget: PeriodCategoryBudget
  colorScheme: string
}) => {
  const percent =
    budget.budgeted > 0 ? (budget.spent / budget.budgeted) * 100 : 0

  return (
    <Box>
      <Flex justify="space-between" mb={1}>
        <Text fontWeight="bold">{label}</Text>
        <Text fontSize="sm" color="GrayText">
          ${budget.spent.toFixed(2)} / ${budget.budgeted.toFixed(2)}
        </Text>
      </Flex>
      <Progress
        value={Math.min(percent, 100)}
        colorScheme={percent > 100 ? 'red' : colorScheme}
        borderRadius="md"
        size="sm"
      />
    </Box>
  )
}

export const CategoryBudgetBars = ({
  necesidad,
  deseo,
  ahorro
}: CategoryBudgetBarsProps) => {
  const { t } = useTranslation('common')
  const budgets: [keyof CategoryBudgetBarsProps, PeriodCategoryBudget][] = [
    ['necesidad', necesidad],
    ['deseo', deseo],
    ['ahorro', ahorro]
  ]

  return (
    <Stack spacing={4}>
      {budgets.map(([key, budget]) => (
        <CategoryBar
          key={key}
          label={t(`categoryBudget.${key}`)}
          budget={budget}
          colorScheme={CATEGORY_COLORS[key]}
        />
      ))}
    </Stack>
  )
}
