import { ProsperoLayout } from '@/components/layouts'
import { Amount } from '@/components/ui/Amount'
import { EmptyState } from '@/components/ui/EmptyState'
import { MovementDayList } from '@/components/ui/MovementDayList'
import { usePeriodLabel } from '@/components/ui/MovementFiltersBar'
import { getPageSkeleton } from '@/components/ui/PageSkeletons'
import { useApi } from '@/lib/useApi'
import type { PeriodSummary } from '@/services/periods'
import type { ReviewQueueSummary } from '@/services/reviewQueue'
import type { SalaryListItem } from '@/services/salary'
import type { TransactionListItem } from '@/services/transactions'
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormLabel,
  LinkBox,
  LinkOverlay,
  Select,
  Stack,
  Td,
  Text,
  Th,
  Tr
} from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { MdMarkEmailUnread, MdSwapVert } from 'react-icons/md'

type Kind = 'expense' | 'income'
type Filter = 'all' | Kind

const FILTERS: Filter[] = ['all', 'expense', 'income']
const PENDING = ['Detected', 'PendingReview']

interface Row {
  kind: Kind
  id: number
  date: string
  description: string
  /** Category (expense) or income type, already translated. */
  label: string
  source: string
  amount: number
  /** Where the movement is edited. */
  href: string
}

/**
 * "Movimientos" tab (docs/diseno-mobile.html, 02): expenses and income of a
 * period in one list grouped by day, with Todos · Gastos · Ingresos and the
 * Gmail review queue on top. Tapping a row edits it in its own screen.
 */
export default function MovementsPage() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const periodLabel = usePeriodLabel()
  const period =
    typeof router.query.period === 'string' ? router.query.period : undefined
  const filter: Filter = FILTERS.includes(router.query.kind as Filter)
    ? (router.query.kind as Filter) // validated by the includes above
    : 'all'

  const ready = router.isReady
  const expenses = useApi<TransactionListItem[]>(
    ready ? 'periods/transactions' : null,
    { period }
  )
  const incomes = useApi<SalaryListItem[]>(ready ? 'periods/salary' : null, {
    period
  })
  const periods = useApi<PeriodSummary[]>('periods')
  const { data: review } = useApi<ReviewQueueSummary>('review-queue/summary')
  const pendingCount =
    (review?.pendingTransactions ?? 0) + (review?.pendingSalaries ?? 0)

  const setQuery = (next: { period?: string; kind?: Filter }) =>
    router.push(
      {
        pathname: router.pathname,
        query: {
          ...(next.period !== undefined
            ? next.period && { period: next.period }
            : period && { period }),
          ...((next.kind ?? filter) !== 'all' && { kind: next.kind ?? filter })
        }
      },
      undefined,
      { shallow: true, scroll: false }
    )

  // Pending ones live in the review queue, not in the list.
  const rows: Row[] = [
    ...(filter === 'income' ? [] : expenses.data ?? [])
      .filter(item => !PENDING.includes(item.reviewStatus))
      .map(
        (item): Row => ({
          kind: 'expense',
          id: item.id,
          date: item.date,
          description:
            item.description ||
            item.fixedExpenseName ||
            t('review.untitledExpense'),
          label: item.category ? t(`quickAdd.categories.${item.category}`) : '',
          source: item.institutionName ?? item.source,
          amount: item.amount,
          href: `/expenditures?edit=${item.id}`
        })
      ),
    ...(filter === 'expense' ? [] : incomes.data ?? [])
      .filter(item => !PENDING.includes(item.status))
      .map(
        (item): Row => ({
          kind: 'income',
          id: item.id,
          date: item.date,
          description: item.description || t('review.untitledIncome'),
          label: item.type ? t(`quickAdd.incomeTypes.${item.type}`) : '',
          source: item.institutionName ?? item.source,
          amount: item.amount,
          href: `/entries?edit=${item.id}`
        })
      )
  ].sort((a, b) => b.date.localeCompare(a.date))

  const meta = (row: Row) =>
    [row.label, row.source === 'Manual' ? t('movements.manual') : row.source]
      .filter(Boolean)
      .join(' · ')

  const PageSkeleton = getPageSkeleton(router.pathname)
  if (periods.data === undefined && !periods.error && PageSkeleton)
    return (
      <ProsperoLayout
        title={t('movements.title')}
        pageDescription={t('movements.title')}
      >
        <PageSkeleton />
      </ProsperoLayout>
    )

  const currentKey = periods.data?.find(item => item.isOpen)?.key

  return (
    <ProsperoLayout
      title={t('movements.title')}
      pageDescription={t('movements.title')}
    >
      <Stack spacing={4} pb={4}>
        {pendingCount > 0 && (
          <LinkBox
            as={Flex}
            align="center"
            gap={3}
            p={4}
            borderRadius="16px"
            bg="status.pendingBg"
          >
            <Box as={MdMarkEmailUnread} boxSize={6} color="status.pending" />
            <Box flex={1}>
              <LinkOverlay as={NextLink} href="/review">
                <Text fontWeight="semibold" color="text.primary">
                  {t('movements.pending', { count: pendingCount })}
                </Text>
              </LinkOverlay>
              <Text fontSize="sm" color="text.secondary">
                {t('movements.pendingHint')}
              </Text>
            </Box>
            <Text fontWeight="semibold" color="status.pending">
              {t('movements.review')}
            </Text>
          </LinkBox>
        )}

        <ButtonGroup
          isAttached
          w="full"
          role="group"
          aria-label={t('movements.filterLabel')}
        >
          {FILTERS.map(option => (
            <Button
              key={option}
              flex={1}
              aria-pressed={filter === option}
              variant={filter === option ? 'solid' : 'outline'}
              colorScheme={filter === option ? 'primary' : 'gray'}
              onClick={() => setQuery({ kind: option })}
            >
              {t(`movements.filters.${option}`)}
            </Button>
          ))}
        </ButtonGroup>

        {(periods.data?.length ?? 0) > 1 && (
          <FormControl>
            <FormLabel fontSize="sm" color="text.secondary">
              {t('movementFilters.periodLabel')}
            </FormLabel>
            <Select
              value={period ?? currentKey ?? ''}
              onChange={event =>
                setQuery({
                  period:
                    event.target.value === currentKey ? '' : event.target.value
                })
              }
            >
              {periods.data?.map(item => (
                <option key={item.key} value={item.key}>
                  {periodLabel(item)}
                </option>
              ))}
            </Select>
          </FormControl>
        )}

        {rows.length === 0 ? (
          <EmptyState
            icon={MdSwapVert}
            title={t('movements.empty.title')}
            description={t('movements.empty.description')}
          />
        ) : (
          <MovementDayList
            items={rows}
            getKey={row => (row.kind === 'expense' ? row.id : -row.id)}
            getDate={row => row.date}
            getAmount={row =>
              row.kind === 'expense' ? -row.amount : row.amount
            }
            resetKey={`${period}-${filter}`}
            columnCount={3}
            tableHead={
              <Tr>
                <Th>{t('movements.columns.concept')}</Th>
                <Th>{t('movements.columns.type')}</Th>
                <Th isNumeric>{t('movements.columns.amount')}</Th>
              </Tr>
            }
            renderTableRow={row => (
              <Tr key={`${row.kind}-${row.id}`}>
                <Td>
                  <Text as={NextLink} href={row.href} color="text.primary">
                    {row.description}
                  </Text>
                </Td>
                <Td color="text.secondary">{meta(row)}</Td>
                <Td isNumeric>
                  <Amount value={row.amount} kind={row.kind} />
                </Td>
              </Tr>
            )}
            renderCard={row => (
              <LinkBox
                key={`${row.kind}-${row.id}`}
                as={Flex}
                align="center"
                gap={3}
                minH="56px"
                py={2}
              >
                <Box flex={1} minW={0}>
                  <LinkOverlay as={NextLink} href={row.href}>
                    <Text
                      fontWeight="semibold"
                      color="text.primary"
                      noOfLines={1}
                    >
                      {row.description}
                    </Text>
                  </LinkOverlay>
                  <Text fontSize="sm" color="text.secondary" noOfLines={1}>
                    {meta(row)}
                  </Text>
                </Box>
                <Amount value={row.amount} kind={row.kind} />
              </LinkBox>
            )}
          />
        )}
      </Stack>
    </ProsperoLayout>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale as string, [
      'common',
      'sidebar',
      'mobileNav'
    ]))
  }
})
