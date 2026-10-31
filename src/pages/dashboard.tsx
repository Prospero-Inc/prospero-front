import { BalanceHero } from '@/components/dashboard/BalanceHero'
import { BudgetSplitCard } from '@/components/dashboard/BudgetSplitCard'
import { ProsperoLayout } from '@/components/layouts'
import { GenericSection } from '@/components/layouts/GenericSection'
import { DashboardSummaryCard } from '@/components/ui/DashboardSummaryCard'
import { getPageSkeleton } from '@/components/ui/PageSkeletons'
import { RecentActivityList } from '@/components/ui/RecentActivityList'
import { useApi } from '@/lib/useApi'
import { MonthSummary, PeriodSummary } from '@/services/periods'
import { ReviewQueueSummary } from '@/services/reviewQueue'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  ButtonGroup,
  Flex,
  Icon,
  Link,
  SimpleGrid,
  Text,
  useColorModeValue
} from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import {
  MdAccountBalanceWallet,
  MdArrowDownward,
  MdArrowUpward,
  MdCalendarToday,
  MdMarkEmailUnread
} from 'react-icons/md'

/** Movimientos que Gmail detectó y esperan confirmación (spec §6): arriba
 * de todo. Ya suman en los totales (el backend no los excluye), pero sin
 * categoría no entran en las barras por categoría hasta confirmarlos. */
const PendingReviewAlert = ({ summary }: { summary: ReviewQueueSummary }) => {
  const { t } = useTranslation('common')
  const total = summary.pendingTransactions + summary.pendingSalaries
  if (total === 0) return null

  return (
    <Alert
      status="warning"
      borderRadius="md"
      mb={8}
      flexDirection={{ base: 'column', sm: 'row' }}
      alignItems={{ base: 'flex-start', sm: 'center' }}
      gap={3}
    >
      <AlertIcon as={MdMarkEmailUnread} />
      <Box flex="1">
        <AlertTitle>
          {t('dashboard.pendingReview.title', { count: total })}
        </AlertTitle>
        <AlertDescription display="block" fontSize="sm">
          {t('dashboard.pendingReview.description')}
        </AlertDescription>
      </Box>
      <ButtonGroup size="sm" flexShrink={0} flexWrap="wrap" gap={2} spacing={0}>
        {summary.pendingTransactions > 0 && (
          <Button as={NextLink} href="/review" colorScheme="orange" minH="44px">
            {t('dashboard.pendingReview.expenses', {
              count: summary.pendingTransactions
            })}
          </Button>
        )}
        {summary.pendingSalaries > 0 && (
          <Button
            as={NextLink}
            href="/review"
            colorScheme="orange"
            variant="outline"
            minH="44px"
          >
            {t('dashboard.pendingReview.income', {
              count: summary.pendingSalaries
            })}
          </Button>
        )}
      </ButtonGroup>
    </Alert>
  )
}

/** Usuario nuevo / sin ingreso registrado para este período: estado vacío
 * legítimo, distinto de un error real de carga (ver `period === null` más
 * abajo) — no deben verse igual. */
const BudgetEmptyState = () => {
  const { t } = useTranslation('common')
  const descriptionColor = useColorModeValue('gray.600', 'gray.400')

  return (
    <Flex direction="column" align="center" gap={2} py={8} textAlign="center">
      <Icon
        as={MdAccountBalanceWallet}
        boxSize={8}
        color="gray.400"
        aria-hidden="true"
      />
      <Text fontWeight="semibold">{t('dashboard.budgetEmpty.heading')}</Text>
      <Text fontSize="sm" color={descriptionColor}>
        {t('dashboard.budgetEmpty.description')}
      </Text>
      <Button
        as={NextLink}
        href="/entries"
        colorScheme="primary"
        size="sm"
        mt={2}
      >
        {t('dashboard.budgetEmpty.cta')}
      </Button>
    </Flex>
  )
}

const Dashboard = () => {
  const { t } = useTranslation('common')
  const router = useRouter()
  // Client-side data (SWR), each part independent: if the month summary or
  // the review queue fails, the rest of the dashboard still shows (only the
  // current period is essential). No current period yet (no payroll) is a
  // 404 and shows the empty state.
  const periodQuery = useApi<PeriodSummary>('periods/current')
  const monthQuery = useApi<MonthSummary>('periods/month')
  const reviewQueueQuery = useApi<ReviewQueueSummary>('review-queue/summary')
  const period = periodQuery.data ?? null
  /** `null` si falló: la sección del mes simplemente no se muestra. */
  const month = monthQuery.data ?? null
  const reviewQueue = reviewQueueQuery.data ?? null
  const captionColor = useColorModeValue('gray.600', 'gray.400')
  const locale = router.locale ?? 'es'
  // timeZone UTC: misma convención que el resto de las fechas de la app,
  // así SSR y navegador muestran el mismo día.
  const shortDate = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  })
  const monthName = month
    ? new Intl.DateTimeFormat(locale, {
        month: 'long',
        timeZone: 'UTC'
      }).format(new Date(Date.UTC(month.year, month.month - 1, 1)))
    : ''

  // El pago estimado ya pasó (no se registró el siguiente): en vez de
  // "-25 días estimados restantes", decir qué pasa y cómo resolverlo.
  const remaining = period?.estimatedDaysRemaining ?? null
  const paymentOverdue =
    remaining !== null && remaining < 0 && !!period?.estimatedNextPaymentDate

  const hasPeriodCaption =
    !!period &&
    (period.daysElapsed !== null || period.estimatedDaysRemaining !== null)

  // Un solo párrafo: si el aviso de pago vencido va en otro bloque del flex,
  // el texto se parte en dos columnas angostas.
  const periodCaption = hasPeriodCaption && (
    <Flex align="flex-start" gap={1.5} color={captionColor} fontSize="sm">
      <Icon as={MdCalendarToday} boxSize={4} mt={0.5} aria-hidden="true" />
      <Text fontSize="sm">
        {period?.daysElapsed !== null &&
          t('dashboard.daysElapsed', { count: period?.daysElapsed })}
        {remaining !== null &&
          !paymentOverdue &&
          ` · ${
            remaining === 0
              ? t('dashboard.paymentToday')
              : t('dashboard.daysRemaining', { count: remaining })
          }`}
        {paymentOverdue && period?.estimatedNextPaymentDate && (
          <>
            {' · '}
            {t('dashboard.paymentOverdue', {
              date: shortDate.format(new Date(period.estimatedNextPaymentDate))
            })}{' '}
            <Link as={NextLink} href="/entries" color="primary.500">
              {t('dashboard.registerPayment')}
            </Link>
          </>
        )}
      </Text>
    </Flex>
  )

  const recentActivityCaption = (
    <Link as={NextLink} href="/movements" color="primary.500" fontSize="sm">
      {t('dashboard.recentActivity.viewAll')} →
    </Link>
  )

  // First load: the dashboard's skeleton, not the "no period yet" state.
  const PageSkeleton = getPageSkeleton(router.pathname)
  if (periodQuery.data === undefined && !periodQuery.error && PageSkeleton)
    return (
      <ProsperoLayout
        title={t('dashboard.pageTitle')}
        pageDescription={t('dashboard.pageDescription')}
      >
        <PageSkeleton />
      </ProsperoLayout>
    )
  return (
    <ProsperoLayout
      title={t('dashboard.pageTitle')}
      pageDescription={t('dashboard.pageDescription')}
    >
      {!period ? (
        <Alert
          status="error"
          borderRadius="md"
          flexDirection={{ base: 'column', sm: 'row' }}
          alignItems={{ base: 'flex-start', sm: 'center' }}
          gap={3}
        >
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>{t('dashboard.error.heading')}</AlertTitle>
            <AlertDescription display="block">
              {t('dashboard.error.description')}
            </AlertDescription>
          </Box>
          <Button
            onClick={() => router.reload()}
            colorScheme="red"
            size="sm"
            flexShrink={0}
          >
            {t('dashboard.error.retry')}
          </Button>
        </Alert>
      ) : (
        <>
          {period.income === 0 ? (
            <GenericSection
              title={t('dashboard.budgetTitle')}
              caption={periodCaption}
            >
              <BudgetEmptyState />
            </GenericSection>
          ) : (
            <BalanceHero period={period} caption={periodCaption} />
          )}
          {reviewQueue && <PendingReviewAlert summary={reviewQueue} />}
          {period.income > 0 && (
            <BudgetSplitCard budget={period.budget} income={period.income} />
          )}
          {month && (
            <GenericSection
              title={t('dashboard.month.title', { month: monthName })}
            >
              <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={6}>
                <DashboardSummaryCard
                  label={t('dashboard.month.income')}
                  amount={month.income}
                  // Con pago quincenal un mes puede tener 1 o 3 pagos
                  // (spec §3.3): decirlo explica un total fuera de lo común.
                  helpText={t('dashboard.month.payrolls', {
                    count: month.payrollCount
                  })}
                  icon={MdArrowUpward}
                  accent="teal"
                />
                <DashboardSummaryCard
                  label={t('dashboard.month.spent')}
                  amount={month.totalSpent}
                  icon={MdArrowDownward}
                  accent="red"
                />
                <DashboardSummaryCard
                  label={t('dashboard.month.balance')}
                  amount={month.balance}
                  icon={MdAccountBalanceWallet}
                  accent={month.balance < 0 ? 'red' : 'primary'}
                />
              </SimpleGrid>
            </GenericSection>
          )}

          <GenericSection
            title={t('dashboard.recentActivity.title')}
            caption={recentActivityCaption}
          >
            <RecentActivityList transactions={period.recentTransactions} />
          </GenericSection>
        </>
      )}
    </ProsperoLayout>
  )
}

// Translations only: the data is loaded client-side (see useApi above) and
// the middleware already guards the route.
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale as string, [
      'common',
      'sidebar',
      'mobileNav'
    ]))
  }
})

export default Dashboard
