import {
  HomeHero,
  RecentCard,
  ReviewAlertCard,
  SplitCard
} from '@/components/dashboard/HomeCards'
import { ProsperoLayout } from '@/components/layouts'
import { getPageSkeleton } from '@/components/ui/PageSkeletons'
import { Profile } from '@/interfaces'
import { useApi } from '@/lib/useApi'
import { PeriodSummary } from '@/services/periods'
import { ReviewQueueSummary } from '@/services/reviewQueue'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Stack,
  Text
} from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import NextLink from 'next/link'
import { useRouter } from 'next/router'

/** New user / no income logged for this period yet: a legitimate empty
 * state (not an error) that leads to the first steps. */
const BudgetEmptyCard = () => {
  const { t } = useTranslation('common')
  return (
    <Box bg="bg.surface" borderRadius="20px" p="16px" textAlign="center">
      <Text fontWeight="bold" fontSize="15px" color="text.primary">
        {t('dashboard.budgetEmpty.heading')}
      </Text>
      <Text fontSize="13px" color="text.secondary" mt={1}>
        {t('dashboard.budgetEmpty.description')}
      </Text>
      <Button
        as={NextLink}
        href="/welcome"
        colorScheme="primary"
        mt={4}
        borderRadius="12px"
      >
        {t('dashboard.budgetEmpty.cta')}
      </Button>
    </Box>
  )
}

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
      <Alert
        status="error"
        borderRadius="16px"
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
          onClick={() => periodQuery.mutate()}
          colorScheme="red"
          size="sm"
          flexShrink={0}
        >
          {t('dashboard.error.retry')}
        </Button>
      </Alert>
    )

  return layout(
    <Stack spacing="12px" maxW="lg" pb={4}>
      {period.income === 0 ? <BudgetEmptyCard /> : <HomeHero period={period} />}
      {reviewQueue && <ReviewAlertCard summary={reviewQueue} />}
      {period.income > 0 && (
        <SplitCard budget={period.budget} income={period.income} />
      )}
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
