import { ProsperoLayout } from '@/components/layouts'
import { GenericSection } from '@/components/layouts/GenericSection'
import { CategoryBudgetBars } from '@/components/ui/CategoryBudgetBars'
import { DashboardSummaryCard } from '@/components/ui/DashboardSummaryCard'
import { RecentActivityList } from '@/components/ui/RecentActivityList'
import { getValidSession } from '@/lib'
import { getCurrentPeriod, PeriodSummary } from '@/services/periods'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
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
  MdCalendarToday
} from 'react-icons/md'

interface DashboardProps {
  period: PeriodSummary | null
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

const Dashboard = ({ period }: DashboardProps) => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const captionColor = useColorModeValue('gray.600', 'gray.400')

  const hasPeriodCaption =
    !!period &&
    (period.daysElapsed !== null || period.estimatedDaysRemaining !== null)

  const periodCaption = hasPeriodCaption && (
    <Flex align="center" gap={1.5} color={captionColor} fontSize="sm">
      <Icon as={MdCalendarToday} boxSize={4} aria-hidden="true" />
      <Text as="span" fontSize="sm">
        {period?.daysElapsed !== null &&
          t('dashboard.daysElapsed', { count: period?.daysElapsed })}
        {period?.estimatedDaysRemaining !== null &&
          ` · ${t('dashboard.daysRemaining', {
            count: period?.estimatedDaysRemaining
          })}`}
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

  if (session?.accessToken)
    try {
      period = await getCurrentPeriod(null, {
        authorization: `Bearer ${session.accessToken}`,
        lang: locale
      })
    } catch (error) {
      period = null
    }

  return {
    props: {
      ...(await serverSideTranslations(locale as string, [
        'common',
        'sidebar',
        'mobileNav'
      ])),
      period
    }
  }
}

export default Dashboard
