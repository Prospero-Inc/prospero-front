import { CATEGORY_COLORS } from '@/components/ui/CategoryBudgetBars'
import { formatSignedCurrency } from '@/components/ui/DashboardSummaryCard'
import { PeriodRecentTransaction } from '@/services/periods'
import {
  Box,
  Button,
  Flex,
  Icon,
  Skeleton,
  Stack,
  Text,
  useColorModeValue
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { MdReceiptLong } from 'react-icons/md'

interface RecentActivityListProps {
  transactions: PeriodRecentTransaction[]
  isLoading?: boolean
}

const MAX_ITEMS = 5

const CategoryDot = ({
  category
}: {
  category: PeriodRecentTransaction['category']
}) => {
  const colorScheme = category ? CATEGORY_COLORS[toColorKey(category)] : 'gray'
  return (
    <Box
      boxSize="10px"
      borderRadius="full"
      bg={`${colorScheme}.500`}
      flexShrink={0}
      aria-hidden="true"
    />
  )
}

// `PeriodRecentTransaction.category` llega en PascalCase ('Necesidad') desde
// el backend; `CATEGORY_COLORS`/las claves de traducción `categoryBudget.*`
// usan minúsculas ('necesidad').
const toColorKey = (
  category: NonNullable<PeriodRecentTransaction['category']>
): keyof typeof CATEGORY_COLORS =>
  category.toLowerCase() as keyof typeof CATEGORY_COLORS

export const RecentActivityListSkeleton = () => (
  <Stack spacing={3}>
    {Array.from({ length: MAX_ITEMS }).map((_, index) => (
      <Skeleton key={index} height="20px" borderRadius="md" />
    ))}
  </Stack>
)

export const RecentActivityList = ({
  transactions,
  isLoading
}: RecentActivityListProps) => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const mutedColor = useColorModeValue('gray.600', 'gray.400')
  const borderColor = useColorModeValue('gray.100', 'gray.600')

  if (isLoading) return <RecentActivityListSkeleton />

  const confirmed = transactions
    .filter(transaction => transaction.reviewStatus === 'Confirmed')
    .slice(0, MAX_ITEMS)

  if (confirmed.length === 0)
    return (
      <Flex direction="column" align="center" gap={2} py={8} textAlign="center">
        <Icon
          as={MdReceiptLong}
          boxSize={8}
          color="gray.400"
          aria-hidden="true"
        />
        <Text fontWeight="semibold">
          {t('dashboard.recentActivity.empty.heading')}
        </Text>
        <Text fontSize="sm" color={mutedColor}>
          {t('dashboard.recentActivity.empty.description')}
        </Text>
        <Button
          as={NextLink}
          href="/expenditures"
          colorScheme="primary"
          size="sm"
          mt={2}
        >
          {t('dashboard.recentActivity.empty.cta')}
        </Button>
      </Flex>
    )

  // El locale de next-i18next también vale como tag de Intl (es/en); se evita
  // repetir el bug de hardcodear 'es' que rompía la UI en inglés.
  const dateFormatter = new Intl.DateTimeFormat(router.locale ?? 'es', {
    day: '2-digit',
    month: 'short'
  })

  return (
    <Stack
      spacing={0}
      divider={<Box borderBottomWidth="1px" borderColor={borderColor} />}
    >
      {confirmed.map(transaction => {
        const categoryLabel = transaction.category
          ? t(`categoryBudget.${toColorKey(transaction.category)}`)
          : '—'
        const description = transaction.description?.trim() || categoryLabel

        return (
          <Flex key={transaction.id} align="center" py={3} gap={3}>
            <CategoryDot category={transaction.category} />
            <Box flex="1">
              <Text fontWeight="medium">{description}</Text>
              <Text fontSize="xs" color={mutedColor}>
                {dateFormatter.format(new Date(transaction.date))}
              </Text>
            </Box>
            <Text fontWeight="semibold">
              {formatSignedCurrency(-Math.abs(transaction.amount))}
            </Text>
          </Flex>
        )
      })}
    </Stack>
  )
}
