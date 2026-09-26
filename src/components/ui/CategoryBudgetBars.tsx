import { PeriodCategoryBudget } from '@/services/periods'
import {
  CircularProgress,
  CircularProgressLabel,
  Flex,
  SimpleGrid,
  Text
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'

interface CategoryBudgetBarsProps {
  necesidad: PeriodCategoryBudget
  deseo: PeriodCategoryBudget
  ahorro: PeriodCategoryBudget
}

// Necesidad/Deseo/Ahorro deben distinguirse entre sí en daltonismo (deuteranopia/
// protanopia): el par azul/púrpura falla el chequeo de contraste de color, por eso
// Deseo usa naranja en vez de púrpura. Ver validación mencionada en la tarea.
const CATEGORY_COLORS: Record<keyof CategoryBudgetBarsProps, string> = {
  necesidad: 'blue',
  deseo: 'orange',
  ahorro: 'green'
}

const CategoryGauge = ({
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
  const isOverBudget = percent > 100
  const effectiveColor = isOverBudget ? 'red' : colorScheme

  return (
    <Flex direction="column" align="center" gap={2}>
      <CircularProgress
        value={Math.min(percent, 100)}
        color={`${effectiveColor}.500`}
        trackColor={`${effectiveColor}.100`}
        thickness="10px"
        size="120px"
        capIsRound
        aria-label={`${label}: ${percent.toFixed(0)}%`}
      >
        <CircularProgressLabel fontWeight="bold" fontSize="lg">
          {percent.toFixed(0)}%
        </CircularProgressLabel>
      </CircularProgress>
      <Text fontWeight="bold">{label}</Text>
      <Text fontSize="sm" color="GrayText">
        ${budget.spent.toFixed(2)} / ${budget.budgeted.toFixed(2)}
      </Text>
    </Flex>
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
    <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={6}>
      {budgets.map(([key, budget]) => (
        <CategoryGauge
          key={key}
          label={t(`categoryBudget.${key}`)}
          budget={budget}
          colorScheme={CATEGORY_COLORS[key]}
        />
      ))}
    </SimpleGrid>
  )
}
