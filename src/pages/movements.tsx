import {
  formatDayTitle,
  formatShortRange
} from '@/components/dashboard/periodText'
import {
  CategoryIconBox,
  Chip,
  DayHeader,
  ListCard,
  MovementRow,
  SegmentedControl
} from '@/components/design'
import { FilterIcon, MailIcon } from '@/components/icons/app'
import { ProsperoLayout } from '@/components/layouts'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { EmptyState } from '@/components/ui/EmptyState'
import { usePeriodLabel } from '@/components/ui/MovementFiltersBar'
import { getPageSkeleton } from '@/components/ui/PageSkeletons'
import { formatMoney } from '@/lib/formatMoney'
import { useApi } from '@/lib/useApi'
import type { PeriodSummary } from '@/services/periods'
import type { ReviewQueueSummary } from '@/services/reviewQueue'
import type { SalaryListItem } from '@/services/salary'
import type {
  BudgetCategory,
  TransactionListItem
} from '@/services/transactions'
import { Box, Button, Flex, Input, Stack, Text } from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { MdSwapVert } from 'react-icons/md'

type Kind = 'expense' | 'income'
type Filter = 'all' | Kind
type Source = 'all' | 'Manual' | 'Gmail'

const FILTERS: Filter[] = ['all', 'expense', 'income']
const SOURCES: Source[] = ['all', 'Manual', 'Gmail']
const CATEGORIES: BudgetCategory[] = ['Necesidad', 'Deseo', 'Ahorro']
const PENDING = ['Detected', 'PendingReview']
const PLURAL: Record<BudgetCategory, string> = {
  Necesidad: 'needs',
  Deseo: 'wants',
  Ahorro: 'savings'
}

interface Row {
  kind: Kind
  id: number
  date: string
  title: string
  subtitle: string
  amount: number
  category: BudgetCategory | null
  source: string
  /** Where the movement is edited. */
  href: string
}

const pick = <T extends string>(value: unknown, allowed: T[], fallback: T): T =>
  allowed.find(option => option === value) ?? fallback

/**
 * "Movimientos" (docs/diseno-mobile.html, 02): expenses and income of a
 * period in one list grouped by day; Todos · Gastos · Ingresos; period,
 * filters and search behind chips; the Gmail queue on top.
 */
export default function MovementsPage() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const locale = router.locale ?? 'es'
  const periodLabel = usePeriodLabel()
  const [sheet, setSheet] = useState<'period' | 'filters' | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const query = router.query
  const period = typeof query.period === 'string' ? query.period : undefined
  const filter = pick(query.kind, FILTERS, 'all')
  const source = pick(query.source, SOURCES, 'all')
  const category = CATEGORIES.find(option => option === query.category)
  const search = typeof query.q === 'string' ? query.q : ''

  const setQuery = (next: Record<string, string | undefined>) => {
    const merged: Record<string, string | undefined> = {
      period,
      kind: filter === 'all' ? undefined : filter,
      source: source === 'all' ? undefined : source,
      category,
      q: search || undefined,
      ...next
    }
    router.replace(
      {
        pathname: router.pathname,
        query: Object.fromEntries(
          Object.entries(merged).filter(
            (entry): entry is [string, string] => !!entry[1]
          )
        )
      },
      undefined,
      { shallow: true, scroll: false }
    )
  }

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

  const sourceLabel = (item: {
    institutionName: string | null
    source: string
  }) =>
    item.institutionName ??
    (item.source === 'Manual' ? t('movements.manual') : item.source)

  // Pending ones live in the review queue, not in the list.
  const rows: Row[] = [
    ...(filter === 'income' ? [] : expenses.data ?? [])
      .filter(item => !PENDING.includes(item.reviewStatus))
      .map(
        (item): Row => ({
          kind: 'expense',
          id: item.id,
          date: item.date,
          title:
            item.description ||
            item.fixedExpenseName ||
            t('review.untitledExpense'),
          subtitle: [
            item.category ? t(`welcome.split.${PLURAL[item.category]}`) : null,
            sourceLabel(item)
          ]
            .filter(Boolean)
            .join(' · '),
          amount: item.amount,
          category: item.category,
          source: item.source,
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
          title: item.description || t('review.untitledIncome'),
          subtitle: [
            item.type ? t(`movements.incomeTypes.${item.type}`) : null,
            item.institutionName
          ]
            .filter(Boolean)
            .join(' · '),
          amount: item.amount,
          category: null,
          source: item.source,
          href: `/entries?edit=${item.id}`
        })
      )
  ]
    .filter(row => source === 'all' || row.source === source)
    .filter(row => !category || row.category === category)
    .filter(row => {
      if (!search) return true
      const needle = search.toLowerCase()
      return (
        row.title.toLowerCase().includes(needle) ||
        row.amount.toFixed(2).includes(needle)
      )
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  const groups = rows.reduce<{ day: string; rows: Row[] }[]>((acc, row) => {
    const day = row.date.slice(0, 10)
    const last = acc[acc.length - 1]
    if (last && last.day === day) last.rows.push(row)
    else acc.push({ day, rows: [row] })
    return acc
  }, [])

  const activeFilters = (source !== 'all' ? 1 : 0) + (category ? 1 : 0)
  const currentPeriod = periods.data?.find(item => item.isOpen)
  const selectedPeriod =
    periods.data?.find(item => item.key === period) ?? currentPeriod
  const dayLabels = {
    today: t('movements.today'),
    yesterday: t('movements.yesterday')
  }

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

  return (
    <ProsperoLayout
      title={t('movements.title')}
      pageDescription={t('movements.title')}
    >
      <Stack spacing="12px" maxW="lg" pb={4}>
        <SegmentedControl
          label={t('movements.filterLabel')}
          value={filter}
          onChange={value =>
            setQuery({ kind: value === 'all' ? undefined : value })
          }
          options={FILTERS.map(option => ({
            value: option,
            label: t(`movements.filters.${option}`)
          }))}
        />

        <Flex gap="8px" overflowX="auto" sx={{ scrollbarWidth: 'none' }}>
          {selectedPeriod && (
            <Chip isOn onClick={() => setSheet('period')}>
              {formatShortRange(selectedPeriod, locale) ??
                periodLabel(selectedPeriod)}
            </Chip>
          )}
          <Chip
            isOn={false}
            icon={<FilterIcon boxSize="16px" />}
            onClick={() => setSheet('filters')}
          >
            {activeFilters > 0
              ? t('movements.filtersCount', { count: activeFilters })
              : t('movements.filtersChip')}
          </Chip>
          <Chip
            isOn={isSearching || !!search}
            onClick={() => setIsSearching(open => !open)}
          >
            {t('movements.search')}
          </Chip>
        </Flex>

        {(isSearching || search) && (
          <Input
            autoFocus
            value={search}
            onChange={event => setQuery({ q: event.target.value || undefined })}
            placeholder={t('movementFilters.searchPlaceholder')}
            aria-label={t('movementFilters.searchLabel')}
            h="44px"
            borderRadius="14px"
            bg="field.bg"
            border="none"
          />
        )}

        {pendingCount > 0 && (
          <Flex
            align="center"
            gap="12px"
            bg="status.pendingBg"
            borderRadius="16px"
            py="10px"
            px="12px"
          >
            <Box
              w="32px"
              h="32px"
              borderRadius="12px"
              bg="alert.iconBg"
              color="status.pendingSolid"
              display="grid"
              placeItems="center"
              flex="none"
            >
              <MailIcon boxSize="18px" />
            </Box>
            <Text fontSize="13.5px" fontWeight={650} color="text.primary">
              {t('movements.pending', { count: pendingCount })}
            </Text>
            <Button
              as={NextLink}
              href="/review"
              ml="auto"
              h="36px"
              minH="36px"
              px="14px"
              borderRadius="12px"
              bg="status.pendingSolid"
              color="white"
              fontSize="13px"
              fontWeight={650}
              _hover={{ bg: 'status.pendingSolid', opacity: 0.9 }}
            >
              {t('movements.review')}
            </Button>
          </Flex>
        )}

        {rows.length === 0 ? (
          <EmptyState
            icon={MdSwapVert}
            title={t('movements.empty.title')}
            description={t('movements.empty.description')}
          />
        ) : (
          groups.map(group => (
            <Stack key={group.day} spacing="12px">
              <DayHeader>
                {formatDayTitle(group.day, locale, dayLabels)}
              </DayHeader>
              <ListCard>
                {group.rows.map(row => (
                  <Box
                    key={`${row.kind}-${row.id}`}
                    as={NextLink}
                    href={row.href}
                    display="block"
                    aria-label={row.title}
                  >
                    <MovementRow
                      icon={
                        <CategoryIconBox
                          category={row.category}
                          isIncome={row.kind === 'income'}
                        />
                      }
                      title={row.title}
                      subtitle={row.subtitle}
                      isIncome={row.kind === 'income'}
                      amount={
                        row.kind === 'income'
                          ? `+${formatMoney(row.amount, locale)}`
                          : formatMoney(-row.amount, locale).replace('-', '−')
                      }
                    />
                  </Box>
                ))}
              </ListCard>
            </Stack>
          ))
        )}
      </Stack>

      <BottomSheet
        isOpen={sheet === 'period'}
        onClose={() => setSheet(null)}
        title={t('movementFilters.periodLabel')}
      >
        <ListCard>
          {(periods.data ?? []).map(item => (
            <Box
              key={item.key}
              as="button"
              type="button"
              w="full"
              textAlign="left"
              py="14px"
              fontWeight={item.key === selectedPeriod?.key ? 'bold' : 'medium'}
              color={
                item.key === selectedPeriod?.key ? 'brand.text' : 'text.primary'
              }
              onClick={() => {
                setQuery({ period: item.isOpen ? undefined : item.key })
                setSheet(null)
              }}
            >
              {periodLabel(item)}
            </Box>
          ))}
        </ListCard>
      </BottomSheet>

      <BottomSheet
        isOpen={sheet === 'filters'}
        onClose={() => setSheet(null)}
        title={t('movements.filtersChip')}
        footer={
          <Button
            w="full"
            h="54px"
            borderRadius="16px"
            colorScheme="primary"
            onClick={() => setSheet(null)}
          >
            {t('movements.showResults', { count: rows.length })}
          </Button>
        }
      >
        <Stack spacing={5}>
          <Box>
            <Text
              fontSize="13px"
              fontWeight="bold"
              color="text.secondary"
              mb={2}
            >
              {t('movementFilters.sourceLabel')}
            </Text>
            <Flex gap="8px" wrap="wrap">
              {SOURCES.map(option => (
                <Chip
                  key={option}
                  isOn={source === option}
                  onClick={() =>
                    setQuery({ source: option === 'all' ? undefined : option })
                  }
                >
                  {t(`movementFilters.source.${option}`)}
                </Chip>
              ))}
            </Flex>
          </Box>
          {filter !== 'income' && (
            <Box>
              <Text
                fontSize="13px"
                fontWeight="bold"
                color="text.secondary"
                mb={2}
              >
                {t('quickAdd.category')}
              </Text>
              <Flex gap="8px" wrap="wrap">
                <Chip
                  isOn={!category}
                  onClick={() => setQuery({ category: undefined })}
                >
                  {t('movements.allCategories')}
                </Chip>
                {CATEGORIES.map(option => (
                  <Chip
                    key={option}
                    isOn={category === option}
                    onClick={() => setQuery({ category: option })}
                  >
                    {t(`welcome.split.${PLURAL[option]}`)}
                  </Chip>
                ))}
              </Flex>
            </Box>
          )}
          {activeFilters > 0 && (
            <Button
              variant="ghost"
              onClick={() =>
                setQuery({ source: undefined, category: undefined })
              }
            >
              {t('movementFilters.clear')}
            </Button>
          )}
        </Stack>
      </BottomSheet>
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
