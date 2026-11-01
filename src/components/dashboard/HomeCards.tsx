import { CartIcon, CupIcon, MailIcon, PiggyIcon } from '@/components/icons/app'
import { formatMoney } from '@/lib/formatMoney'
import type { PeriodRecentTransaction, PeriodSummary } from '@/services/periods'
import type { ReviewQueueSummary } from '@/services/reviewQueue'
import type { BudgetCategory } from '@/services/transactions'
import { Box, Button, Flex, type IconProps, Link, Text } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import type { ComponentType, ReactNode } from 'react'

import { formatPeriodRange, formatRelativeDay } from './periodText'

// Inicio, as drawn in docs/diseno-mobile.html (01): hero with what's left,
// compact review alert, split bars, latest movement. Sizes, radii and
// colors are the design's own.

const money = (value: number, locale?: string) => formatMoney(value, locale)
const tabular = { fontVariantNumeric: 'tabular-nums' }

export const HomeHero = ({ period }: { period: PeriodSummary }) => {
  const { t } = useTranslation('common')
  const { locale = 'es' } = useRouter()
  const isOver = period.balance < 0
  const daysLeft = period.estimatedDaysRemaining
  const overdue = daysLeft !== null && daysLeft < 0

  const parts = [
    formatPeriodRange(period, locale),
    daysLeft === null
      ? null
      : overdue
      ? t('dashboard.home.paymentDue')
      : daysLeft === 0
      ? t('dashboard.home.payday')
      : t('dashboard.home.daysLeft', { count: daysLeft }),
    !isOver && daysLeft !== null && daysLeft > 0
      ? t('dashboard.home.perDay', {
          amount: money(Math.floor(period.balance / daysLeft), locale).replace(
            /\.00$/,
            ''
          )
        })
      : null
  ].filter(Boolean)

  return (
    <Box bg="hero.bg" color="white" borderRadius="24px" p="18px" pb="16px">
      <Text fontSize="13px" fontWeight="medium" opacity={0.85}>
        {t(isOver ? 'dashboard.home.over' : 'dashboard.home.left')}
      </Text>
      <Text
        as="p"
        fontSize="40px"
        fontWeight="bold"
        letterSpacing="-0.02em"
        lineHeight="1.15"
        my="2px"
        sx={tabular}
      >
        {money(Math.abs(period.balance), locale)}
      </Text>
      {parts.length > 0 && (
        <Text fontSize="13px" opacity={0.9}>
          {parts.join(' · ')}
        </Text>
      )}
      <Flex gap="10px" mt="14px">
        {[
          { label: t('dashboard.home.income'), value: period.income },
          { label: t('dashboard.home.spent'), value: period.totalSpent }
        ].map(pill => (
          <Box
            key={pill.label}
            flex={1}
            bg="whiteAlpha.300"
            sx={{ backgroundColor: 'rgba(255,255,255,.14)' }}
            borderRadius="14px"
            py="9px"
            px="12px"
          >
            <Text fontSize="11.5px" opacity={0.85}>
              {pill.label}
            </Text>
            <Text fontSize="16px" fontWeight={650} mt="2px" sx={tabular}>
              {money(pill.value, locale)}
            </Text>
          </Box>
        ))}
      </Flex>
    </Box>
  )
}

export const ReviewAlertCard = ({
  summary
}: {
  summary: ReviewQueueSummary
}) => {
  const { t } = useTranslation('common')
  const total = summary.pendingTransactions + summary.pendingSalaries
  if (total === 0) return null

  return (
    <Flex
      align="center"
      gap="12px"
      bg="status.pendingBg"
      borderRadius="16px"
      py="12px"
      px="14px"
    >
      <Box
        w="36px"
        h="36px"
        borderRadius="12px"
        bg="alert.iconBg"
        display="grid"
        placeItems="center"
        flex="none"
        color="status.pendingSolid"
      >
        <MailIcon boxSize="20px" />
      </Box>
      <Box minW={0}>
        <Text fontSize="14px" fontWeight={650} color="text.primary">
          {t('dashboard.home.toReview', { count: total })}
        </Text>
        <Text fontSize="12px" color="text.secondary" mt="1px">
          {t('dashboard.home.fromGmail')}
        </Text>
      </Box>
      <Button
        as={NextLink}
        href="/review"
        ml="auto"
        flex="none"
        h="40px"
        minH="40px"
        px="14px"
        borderRadius="12px"
        bg="status.pendingSolid"
        color="white"
        fontSize="13px"
        fontWeight={650}
        _hover={{ bg: 'status.pendingSolid', opacity: 0.9 }}
      >
        {t('dashboard.home.review')}
      </Button>
    </Flex>
  )
}

const Card = ({ children }: { children: ReactNode }) => (
  <Box bg="bg.surface" borderRadius="20px" p="16px">
    {children}
  </Box>
)

const CardHeader = ({ title, aside }: { title: string; aside: ReactNode }) => (
  <Flex justify="space-between" align="baseline" mb="10px">
    <Text as="h2" fontSize="15px" fontWeight="bold" color="text.primary">
      {title}
    </Text>
    {aside}
  </Flex>
)

const SPLIT_ROWS: {
  category: BudgetCategory
  key: keyof PeriodSummary['budget']
  label: string
}[] = [
  { category: 'Necesidad', key: 'necesidad', label: 'needs' },
  { category: 'Deseo', key: 'deseo', label: 'wants' },
  { category: 'Ahorro', key: 'ahorro', label: 'savings' }
]

export const SplitCard = ({
  budget,
  income
}: {
  budget: PeriodSummary['budget']
  income: number
}) => {
  const { t } = useTranslation('common')
  const { locale } = useRouter()
  const split = SPLIT_ROWS.map(({ key }) =>
    income > 0 ? Math.round((budget[key].budgeted / income) * 100) : 0
  )

  return (
    <Card>
      <CardHeader
        title={t('dashboard.split.title')}
        aside={
          <Text fontSize="13px" fontWeight="semibold" color="brand.text">
            {split.join(' · ')}
          </Text>
        }
      />
      {SPLIT_ROWS.map(({ category, key, label }, index) => {
        const { spent, budgeted, remaining } = budget[key]
        const isOver = remaining < 0
        return (
          <Box key={key} mt={index === 0 ? 0 : '12px'}>
            <Flex justify="space-between" fontSize="13px" mb="6px">
              <Flex
                align="center"
                gap="7px"
                fontWeight="semibold"
                color="text.primary"
              >
                <Box
                  w="9px"
                  h="9px"
                  borderRadius="full"
                  bg={`category.${category}`}
                />
                {t(`welcome.split.${label}`)}
              </Flex>
              <Text color="text.secondary" sx={tabular}>
                <Text
                  as="b"
                  fontWeight={650}
                  color={isOver ? 'money.expenseText' : 'text.primary'}
                >
                  {money(spent, locale)}
                </Text>{' '}
                {t('dashboard.split.of')}{' '}
                {money(budgeted, locale).replace(/\.00$/, '')}
              </Text>
            </Flex>
            <Box h="10px" borderRadius="5px" bg="track.bg" overflow="hidden">
              <Box
                h="full"
                borderRadius="5px"
                w={`${
                  budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0
                }%`}
                bg={isOver ? 'money.expense' : `category.${category}`}
              />
            </Box>
          </Box>
        )
      })}
    </Card>
  )
}

const CATEGORY_ICON: Record<BudgetCategory, ComponentType<IconProps>> = {
  Necesidad: CartIcon,
  Deseo: CupIcon,
  Ahorro: PiggyIcon
}

const CATEGORY_LABEL: Record<BudgetCategory, string> = {
  Necesidad: 'needs',
  Deseo: 'wants',
  Ahorro: 'savings'
}

export const RecentCard = ({
  transactions
}: {
  transactions: PeriodRecentTransaction[]
}) => {
  const { t } = useTranslation('common')
  const { locale = 'es' } = useRouter()
  const latest = transactions[0]

  return (
    <Card>
      <CardHeader
        title={t('dashboard.home.recent')}
        aside={
          <Link
            as={NextLink}
            href="/movements"
            fontSize="13px"
            fontWeight="semibold"
            color="brand.text"
          >
            {t('dashboard.home.seeAll')}
          </Link>
        }
      />
      {latest ? (
        <Flex align="center" gap="12px" py="10px">
          {(() => {
            const CategoryIcon = latest.category
              ? CATEGORY_ICON[latest.category]
              : CartIcon
            return (
              <Box
                w="40px"
                h="40px"
                borderRadius="13px"
                bg="brand.subtle"
                color="brand.text"
                display="grid"
                placeItems="center"
                flex="none"
              >
                <CategoryIcon boxSize="20px" />
              </Box>
            )
          })()}
          <Box flex={1} minW={0}>
            <Text
              fontSize="14px"
              fontWeight="semibold"
              color="text.primary"
              noOfLines={1}
            >
              {latest.description || t('review.untitledExpense')}
            </Text>
            <Text fontSize="12px" color="text.secondary" mt="2px">
              {[
                latest.category
                  ? t(`welcome.split.${CATEGORY_LABEL[latest.category]}`)
                  : t('dashboard.home.toClassify'),
                formatRelativeDay(latest.date, locale, {
                  today: t('dashboard.home.today'),
                  yesterday: t('dashboard.home.yesterday')
                })
              ].join(' · ')}
            </Text>
          </Box>
          <Text
            fontSize="14.5px"
            fontWeight={650}
            color="text.primary"
            sx={tabular}
          >
            {money(-Math.abs(latest.amount), locale).replace('-', '−')}
          </Text>
        </Flex>
      ) : (
        <Text fontSize="13px" color="text.secondary" py="10px">
          {t('dashboard.home.noRecent')}
        </Text>
      )}
    </Card>
  )
}
