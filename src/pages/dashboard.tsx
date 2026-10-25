import { ProsperoLayout } from '@/components/layouts'
import { GenericSection } from '@/components/layouts/GenericSection'
import { CategoryBudgetBars } from '@/components/ui/CategoryBudgetBars'
import { DashboardSummaryCard } from '@/components/ui/DashboardSummaryCard'
import { RecentActivityList } from '@/components/ui/RecentActivityList'
import { getValidSession } from '@/lib'
import {
  getCurrentPeriod,
  getMonthSummary,
  MonthSummary,
  PeriodSummary
} from '@/services/periods'
import {
  getReviewQueueSummary,
  ReviewQueueSummary
} from '@/services/reviewQueue'
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
import { GetServerSideProps } from 'next'
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

interface DashboardProps {
  period: PeriodSummary | null
  /** `null` si falló: la sección del mes simplemente no se muestra. */
  month: MonthSummary | null
  reviewQueue: ReviewQueueSummary | null
}

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
          <Button
            as={NextLink}
            href="/expenditures"
            colorScheme="orange"
            minH="44px"
          >
            {t('dashboard.pendingReview.expenses', {
              count: summary.pendingTransactions
            })}
          </Button>
        )}
        {summary.pendingSalaries > 0 && (
          <Button
            as={NextLink}
            href="/entries"
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

const Dashboard = ({ period, month, reviewQueue }: DashboardProps) => {
  const { t } = useTranslation('common')
  const router = useRouter()
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
    <Link as={NextLink} href="/expenditures" color="primary.500" fontSize="sm">
      {t('dashboard.recentActivity.viewAll')} →
    </Link>
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
          {reviewQueue && <PendingReviewAlert summary={reviewQueue} />}

          <GenericSection
            title={t('dashboard.budgetTitle')}
            caption={periodCaption}
          >
            {period.income === 0 ? (
              <BudgetEmptyState />
            ) : (
              <CategoryBudgetBars
                necesidad={period.budget.necesidad}
                deseo={period.budget.deseo}
                ahorro={period.budget.ahorro}
              />
            )}
          </GenericSection>

          <GenericSection title={t('dashboard.summary.title')}>
            <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={6}>
              <DashboardSummaryCard
                label={t('dashboard.summary.income.label')}
                amount={period.income}
                icon={MdArrowUpward}
                accent="teal"
              />
              <DashboardSummaryCard
                label={t('dashboard.summary.spent.label')}
                amount={period.totalSpent}
                icon={MdArrowDownward}
                accent="red"
              />
              <DashboardSummaryCard
                label={t('dashboard.summary.balance.label')}
                amount={period.balance}
                helpText={t('dashboard.summary.balance.helpText')}
                icon={MdAccountBalanceWallet}
                accent={period.balance < 0 ? 'red' : 'primary'}
              />
            </SimpleGrid>
          </GenericSection>

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

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  locale
}) => {
  const { session, redirect } = await getValidSession(req, res)
  if (redirect) return redirect

  let period: PeriodSummary | null = null
  let month: MonthSummary | null = null
  let reviewQueue: ReviewQueueSummary | null = null

  if (session?.accessToken) {
    const params = {
      authorization: `Bearer ${session.accessToken}`,
      lang: locale
    }
    // allSettled: si falla el resumen del mes o el de pendientes, el resto
    // del dashboard igual se muestra (solo el período es imprescindible).
    const [periodResult, monthResult, reviewResult] = await Promise.allSettled([
      getCurrentPeriod(null, params),
      getMonthSummary(null, params),
      getReviewQueueSummary(null, params) as Promise<ReviewQueueSummary>
    ])
    period = periodResult.status === 'fulfilled' ? periodResult.value : null
    month = monthResult.status === 'fulfilled' ? monthResult.value : null
    reviewQueue =
      reviewResult.status === 'fulfilled' ? reviewResult.value : null
  }

  return {
    props: {
      ...(await serverSideTranslations(locale as string, [
        'common',
        'sidebar',
        'mobileNav'
      ])),
      period,
      month,
      reviewQueue
    }
  }
}

export default Dashboard
