import { FirstSteps, NoMovementsCard } from '@/components/dashboard/FirstSteps'
import {
  HomeHero,
  RecentCard,
  ReviewAlertCard,
  SplitCard
} from '@/components/dashboard/HomeCards'
import { ProsperoLayout } from '@/components/layouts'
import { LoadError } from '@/components/states/LoadError'
import { getPageSkeleton } from '@/components/ui/PageSkeletons'
import { Profile } from '@/interfaces'
import { useApi } from '@/lib/useApi'
import { PeriodSummary } from '@/services/periods'
import { ReviewQueueSummary } from '@/services/reviewQueue'
import { Stack } from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'

/**
 * Inicio (docs/diseno-mobile.html, 01): what's left to spend this period
 * first, then pending Gmail movements, the split as bars and the latest
 * movement.
 */
const Dashboard = () => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { data: session } = useSession()
  // Client-side data (SWR), each part independent: if the review queue
  // fails, the rest of the dashboard still shows.
  const periodQuery = useApi<PeriodSummary>('periods/current')
  const reviewQueueQuery = useApi<ReviewQueueSummary>('review-queue/summary')
  const { data: profileData } = useApi<{ user: Profile }>('auth/profile')
  const period = periodQuery.data ?? null
  const reviewQueue = reviewQueueQuery.data ?? null

  const firstName =
    profileData?.user.firstName || session?.user?.name?.split(' ')[0] || ''
  const greeting = firstName
    ? t('dashboard.home.greeting', { name: firstName })
    : undefined

  const layout = (children: React.ReactNode) => (
    <ProsperoLayout
      title={t('dashboard.pageTitle')}
      pageDescription={t('dashboard.pageDescription')}
      greeting={greeting}
    >
      {children}
    </ProsperoLayout>
  )

  // First load: the dashboard's skeleton, not the empty state.
  const PageSkeleton = getPageSkeleton(router.pathname)
  if (periodQuery.data === undefined && !periodQuery.error && PageSkeleton)
    return layout(<PageSkeleton />)

  if (!period)
    return layout(
      <Stack spacing="12px" maxW="lg" pb={4}>
        <LoadError
          what={t('states.what.period')}
          onRetry={() => periodQuery.mutate()}
          isRetrying={periodQuery.isValidating}
        />
      </Stack>
    )

  // First use: no income this period yet (design 13, "Inicio vacío").
  if (period.income === 0)
    return layout(
      <Stack spacing="12px" maxW="lg" pb={4}>
        <FirstSteps />
        {reviewQueue && <ReviewAlertCard summary={reviewQueue} />}
        {period.recentTransactions.length > 0 ? (
          <RecentCard transactions={period.recentTransactions} />
        ) : (
          <NoMovementsCard />
        )}
      </Stack>
    )

  return layout(
    <Stack spacing="12px" maxW="lg" pb={4}>
      <HomeHero period={period} />
      {reviewQueue && <ReviewAlertCard summary={reviewQueue} />}
      <SplitCard budget={period.budget} income={period.income} />
      <RecentCard transactions={period.recentTransactions} />
    </Stack>
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
