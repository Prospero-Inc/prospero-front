import { formatMoney } from '@/lib/formatMoney'
import { PeriodCategoryBudget } from '@/services/periods'
import {
  CircularProgress,
  CircularProgressLabel,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  SkeletonCircle,
  Text,
  useColorModeValue
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { MdWarningAmber } from 'react-icons/md'

interface CategoryBudgetBarsProps {
  necesidad: PeriodCategoryBudget
  deseo: PeriodCategoryBudget
  ahorro: PeriodCategoryBudget
}

// Necesidad/Deseo/Ahorro deben distinguirse entre sí en daltonismo (deuteranopia/
// protanopia): el par azul/púrpura falla el chequeo de contraste de color, por eso
// Deseo usa naranja en vez de púrpura. Ver validación mencionada en la tarea.
export const CATEGORY_COLORS: Record<keyof CategoryBudgetBarsProps, string> = {
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
  const { t } = useTranslation('common')
  const { locale } = useRouter()
  const percent =
    budget.budgeted > 0 ? (budget.spent / budget.budgeted) * 100 : 0
  const isOverBudget = percent > 100
  const effectiveColor = isOverBudget ? 'red' : colorScheme
  const remainingAmount = Math.abs(budget.spent - budget.budgeted)

  // No depender solo del color del aro para comunicar "sobre presupuesto"
  // (WCAG 1.4.1): el texto bajo el gauge lleva el mensaje + ícono de
  // advertencia en el caso negativo.
  const normalTextColor = useColorModeValue('gray.600', 'gray.400')
  const overBudgetTextColor = useColorModeValue('red.600', 'red.300')

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
        {formatMoney(budget.spent, locale)} /{' '}
        {formatMoney(budget.budgeted, locale)}
      </Text>
      {isOverBudget ? (
        <Flex align="center" gap={1} color={overBudgetTextColor}>
          <Icon as={MdWarningAmber} boxSize={4} aria-hidden="true" />
          <Text fontSize="sm" fontWeight="semibold">
            {t('categoryBudget.overBudget', {
              amount: formatMoney(remainingAmount, locale)
            })}
          </Text>
        </Flex>
      ) : (
        <Text fontSize="sm" color={normalTextColor}>
          {t('categoryBudget.remaining', {
            amount: formatMoney(remainingAmount, locale)
          })}
        </Text>
      )}
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

/** Para un futuro refresh client-side; el SSR actual nunca entra en estado
 * de carga para esta sección, pero se deja listo el placeholder. */
export const CategoryBudgetBarsSkeleton = () => (
  <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={6}>
    {Array.from({ length: 3 }).map((_, index) => (
      <Flex key={index} direction="column" align="center" gap={2}>
        <SkeletonCircle size="120px" />
        <Skeleton height="16px" width="80px" />
        <Skeleton height="14px" width="100px" />
      </Flex>
    ))}
  </SimpleGrid>
)
