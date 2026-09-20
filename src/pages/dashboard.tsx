import { FlameIcon } from '@/components/icons/FlameIcon'
import { TotalMoneyIcon } from '@/components/icons/TotalMoneyIcon'
import { ProsperoLayout } from '@/components/layouts'
import { GenericSection } from '@/components/layouts/GenericSection'
import { AmountCard } from '@/components/ui/AmountCard'
import { CategoryBudgetBars } from '@/components/ui/CategoryBudgetBars'
import { MotionDiv } from '@/components/ui/MotionDiv'
import { entryAsset, expendituresAsset, walletAsset } from '@/config'
import { getCurrentPeriod, PeriodSummary } from '@/services/periods'
import { Flex, Text } from '@chakra-ui/react'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'

interface DashboardProps {
  period: PeriodSummary | null
}

const dashboard = ({ period }: DashboardProps) => {
  const { t } = useTranslation('common')
  const income = period?.income ?? 0
  const totalSpent = period?.totalSpent ?? 0
  const balance = period?.balance ?? 0

  return (
    <ProsperoLayout
      title={'DashBoard'}
      pageDescription={'Pagina de inicio de Prospero'}
    >
      <Flex gap={10} flexWrap={'wrap'} justifyContent={'space-around'} mb={3}>
        <MotionDiv>
          <AmountCard
            bgColor="walletCard"
            title="Total"
            image={walletAsset}
            totalAmount={balance}
            comparisonAmount={0}
            icon={TotalMoneyIcon}
            breakpointsImage={{
              base: '6.36em',
              md: '10em',
              lg: '10em',
              xl: '10em'
            }}
            breakpointsLeftImage={{
              base: '12.8em',
              md: '20.5em',
              lg: '20.5em',
              xl: '20.5em'
            }}
            breakpointsTopImage={{
              base: '1.5em',
              md: '1.5em',
              lg: '1.5em',
              xl: '1.5em'
            }}
          />
        </MotionDiv>

        <MotionDiv>
          <AmountCard
            bgColor="entryCard"
            title="Ingreso del Período"
            totalAmount={income}
            comparisonAmount={0}
            icon={TotalMoneyIcon}
            image={entryAsset}
            breakpointsImage={{
              base: '6.36em',
              md: '7.5em',
              lg: '7.5em',
              xl: '7.5em'
            }}
            breakpointsLeftImage={{
              base: '12.8em',
              md: '22.2em',
              lg: '22.2em',
              xl: '22.2em'
            }}
            breakpointsTopImage={{
              base: '0.2em',
              md: '1.5em',
              lg: '1.5em',
              xl: '1.5em'
            }}
          />{' '}
        </MotionDiv>
        <MotionDiv>
          <AmountCard
            bgColor="expenditureCard"
            title="Gastos del Período"
            totalAmount={totalSpent}
            comparisonAmount={0}
            icon={FlameIcon}
            image={expendituresAsset}
            breakpointsImage={{
              base: '6.36em',
              md: '10em',
              lg: '10em',
              xl: '10em'
            }}
            breakpointsLeftImage={{
              base: '12.8em',
              md: '20.8em',
              lg: '20.8em',
              xl: '20.8em'
            }}
            breakpointsTopImage={{
              base: '3.5em',
              md: '4.5em',
              lg: '4.5em',
              xl: '4.5em'
            }}
          />{' '}
        </MotionDiv>
      </Flex>

      {period && (
        <Text color="GrayText" mb={4}>
          {period.daysElapsed !== null &&
            t('dashboard.daysElapsed', { count: period.daysElapsed })}
          {period.estimatedDaysRemaining !== null &&
            ` · ${t('dashboard.daysRemaining', {
              count: period.estimatedDaysRemaining
            })}`}
        </Text>
      )}

      <GenericSection title={t('dashboard.budgetTitle')}>
        <MotionDiv>
          <CategoryBudgetBars
            necesidad={
              period?.budget.necesidad ?? {
                budgeted: 0,
                spent: 0,
                remaining: 0
              }
            }
            deseo={
              period?.budget.deseo ?? { budgeted: 0, spent: 0, remaining: 0 }
            }
            ahorro={
              period?.budget.ahorro ?? { budgeted: 0, spent: 0, remaining: 0 }
            }
          />
        </MotionDiv>
      </GenericSection>
    </ProsperoLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  locale
}) => {
  const session = await getSession({ req })
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

export default dashboard
