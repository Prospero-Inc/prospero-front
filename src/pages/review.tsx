import { formatRelativeDay } from '@/components/dashboard/periodText'
import { BankBadge } from '@/components/design/settings'
import { ProsperoLayout } from '@/components/layouts'
import { EmptyState } from '@/components/ui/EmptyState'
import { getPageSkeleton } from '@/components/ui/PageSkeletons'
import { HttpMethod } from '@/enums'
import { useUndoableCommit } from '@/hooks/useUndoableCommit'
import { localApiService } from '@/lib'
import { useApi, useRevalidateApi } from '@/lib/useApi'
import type { IncomeCategory, SalaryListItem } from '@/services/salary'
import type {
  BudgetCategory,
  TransactionListItem
} from '@/services/transactions'
import { Box, Button, Flex, Stack, Text, useToast } from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { MdDoneAll } from 'react-icons/md'

const PENDING_STATUSES = 'Detected,PendingReview'
const CATEGORIES: BudgetCategory[] = ['Necesidad', 'Deseo', 'Ahorro']
const INCOME_CATEGORIES: IncomeCategory[] = [
  'Payroll',
  'Extra',
  'Transfer',
  'Reimbursement',
  'Deposit',
  'Other'
]

type ReviewItem =
  | { kind: 'expense'; item: TransactionListItem }
  | { kind: 'income'; item: SalaryListItem }

const money = (value: number) =>
  `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

/** `.rev .opts div`: 44 px outlined choice. */
const OptionButton = ({
  label,
  onClick
}: {
  label: string
  onClick: () => void
}) => (
  <Button
    variant="unstyled"
    flex="1 1 0"
    minW="calc(33.333% - 6px)"
    h="44px"
    borderRadius="12px"
    borderWidth="1.5px"
    borderColor="border.subtle"
    fontSize="13px"
    fontWeight={650}
    color="text.primary"
    px={1}
    whiteSpace="normal"
    lineHeight="1.15"
    sx={{
      '@media (hover: hover)': { _hover: { borderColor: 'brand.solid' } }
    }}
    _active={{ bg: 'brand.subtle' }}
    onClick={onClick}
  >
    {label}
  </Button>
)

/**
 * "Por revisar" (docs/diseno-mobile.html, 02): the movements Gmail
 * detected, as cards. One tap on a category confirms it; the card leaves
 * at once with "Deshacer" for a few seconds — no confirmation dialogs, no
 * page reloads.
 */
export default function ReviewPage() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const toast = useToast()
  const { data: session } = useSession()
  const expenses = useApi<TransactionListItem[]>('transactions', {
    reviewStatus: PENDING_STATUSES
  })
  const incomes = useApi<SalaryListItem[]>('salary', {
    status: PENDING_STATUSES
  })
  const revalidateApi = useRevalidateApi()
  const scheduleCommit = useUndoableCommit()
  // Cards confirmed but still inside their undo window (or being sent).
  // Kept here rather than edited out of the SWR cache: a refetch meanwhile
  // (e.g. undoing another card) would otherwise bring them back.
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set())
  // Reviewed on this visit, for "1 de 4 revisados".
  const [reviewed, setReviewed] = useState<ReadonlySet<string>>(new Set())
  const toggle = (setter: typeof setHidden) => (key: string, isOn: boolean) =>
    setter(current => {
      const next = new Set(current)
      if (isOn) next.add(key)
      else next.delete(key)
      return next
    })
  const setHiddenKey = toggle(setHidden)
  const setReviewedKey = toggle(setReviewed)
  const locale = router.locale ?? 'es'

  const items: ReviewItem[] = [
    ...(expenses.data ?? []).map(item => ({ kind: 'expense' as const, item })),
    ...(incomes.data ?? []).map(item => ({ kind: 'income' as const, item }))
  ]
    .filter(entry => !hidden.has(`${entry.kind}-${entry.item.id}`))
    .sort((a, b) => b.item.date.localeCompare(a.item.date))

  const titleOf = (entry: ReviewItem) =>
    entry.item.description ||
    t(
      entry.kind === 'expense'
        ? 'review.untitledExpense'
        : 'review.untitledIncome'
    )

  /** Hide the card now; send `request` once the undo window passes. */
  const resolve = (
    entry: ReviewItem,
    message: string,
    request: () => Promise<unknown>
  ) => {
    const cardKey = `${entry.kind}-${entry.item.id}`
    setHiddenKey(cardKey, true)
    setReviewedKey(cardKey, true)

    scheduleCommit({
      key: `review-${cardKey}`,
      message,
      onUndo: () => {
        setHiddenKey(cardKey, false)
        setReviewedKey(cardKey, false)
      },
      commit: async () => {
        try {
          await request()
        } catch (error) {
          toast({
            title: t('review.error'),
            description: error instanceof Error ? error.message : undefined,
            status: 'error'
          })
          setHiddenKey(cardKey, false) // failed: show the card again
          setReviewedKey(cardKey, false)
          return
        }
        await revalidateApi('periods', 'transactions', 'salary', 'review-queue')
        setHiddenKey(cardKey, false) // gone from the refetched list anyway
      }
    })
  }

  const authorization = { Authorization: `Bearer ${session?.accessToken}` }

  const confirm = (entry: ReviewItem, choice: string) =>
    resolve(entry, t('review.confirmedItem', { name: titleOf(entry) }), () =>
      localApiService.request({
        method: HttpMethod.PATCH,
        endPoint:
          entry.kind === 'expense'
            ? `/proxy/update-transaction?id=${entry.item.id}`
            : `/proxy/update-salary?id=${entry.item.id}`,
        data:
          entry.kind === 'expense'
            ? { category: choice }
            : { incomeCategory: choice },
        headers: authorization
      })
    )

  // Only expenses: the backend has no way to delete a detected income.
  const discard = (entry: ReviewItem) =>
    resolve(entry, t('review.discardedItem', { name: titleOf(entry) }), () =>
      localApiService.request({
        method: HttpMethod.DELETE,
        endPoint: `/proxy/delete-transaction?id=${entry.item.id}`,
        headers: authorization
      })
    )

  const layout = (children: React.ReactNode) => (
    <ProsperoLayout
      title={t('review.title')}
      pageDescription={t('review.title')}
      topBarTrailing={{ closeHref: '/movements' }}
    >
      {children}
    </ProsperoLayout>
  )

  const PageSkeleton = getPageSkeleton(router.pathname)
  if (
    (expenses.data === undefined || incomes.data === undefined) &&
    !expenses.error &&
    !incomes.error &&
    PageSkeleton
  )
    return layout(<PageSkeleton />)

  const total = reviewed.size + items.length

  return layout(
    <Stack spacing="12px" maxW="lg" pb={4}>
      {items.length === 0 ? (
        <EmptyState
          icon={MdDoneAll}
          title={t('review.empty.title')}
          description={t('review.empty.description')}
          action={
            <Button as={NextLink} href="/movements" colorScheme="primary">
              {t('review.empty.action')}
            </Button>
          }
        />
      ) : (
        <>
          <Flex
            align="center"
            gap="10px"
            fontSize="13px"
            color="text.secondary"
          >
            <Text as="span" flexShrink={0}>
              {t('review.progress', { done: reviewed.size, total })}
            </Text>
            <Box
              flex={1}
              h="6px"
              borderRadius="full"
              bg="track.bg"
              overflow="hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={reviewed.size}
              aria-label={t('review.progress', {
                done: reviewed.size,
                total
              })}
            >
              <Box
                h="full"
                w={`${(reviewed.size / total) * 100}%`}
                bg="brand.solid"
                borderRadius="full"
                transition="width .3s"
              />
            </Box>
          </Flex>
          {items.map(entry => {
            const { item } = entry
            const options =
              entry.kind === 'expense' ? CATEGORIES : INCOME_CATEGORIES
            const editHref =
              entry.kind === 'expense'
                ? `/expenditures?edit=${item.id}`
                : `/entries?edit=${item.id}`
            return (
              <Box
                key={`${entry.kind}-${item.id}`}
                as="article"
                bg="bg.surface"
                borderRadius="20px"
                p="14px"
              >
                <Flex align="center" gap="12px">
                  <BankBadge name={item.institutionName} />
                  <Box minW={0} flex={1}>
                    <Text
                      fontSize="14.5px"
                      fontWeight={650}
                      color="text.primary"
                      noOfLines={1}
                    >
                      {titleOf(entry)}
                    </Text>
                    <Text
                      fontSize="12px"
                      color="text.secondary"
                      mt="2px"
                      noOfLines={1}
                    >
                      {t(
                        entry.kind === 'expense'
                          ? 'review.purchase'
                          : 'review.possibleIncome'
                      )}
                      {' · '}
                      {formatRelativeDay(item.date, locale, {
                        today: t('review.today'),
                        yesterday: t('review.yesterday')
                      })}
                    </Text>
                  </Box>
                  <Text
                    fontSize="16px"
                    fontWeight="bold"
                    flexShrink={0}
                    sx={{ fontVariantNumeric: 'tabular-nums' }}
                    color={
                      entry.kind === 'income'
                        ? 'money.incomeText'
                        : 'text.primary'
                    }
                  >
                    {entry.kind === 'income' && '+'}
                    {money(item.amount)}
                  </Text>
                </Flex>
                <Text fontSize="12px" color="text.secondary" mt="12px" mb="8px">
                  {t(
                    entry.kind === 'expense'
                      ? 'review.expenseQuestion'
                      : 'review.incomeQuestion'
                  )}
                </Text>
                <Flex gap="8px" wrap="wrap">
                  {options.map(option => (
                    <OptionButton
                      key={option}
                      label={t(
                        entry.kind === 'expense'
                          ? `quickAdd.categories.${option}`
                          : `review.incomeCategories.${option}`
                      )}
                      onClick={() => confirm(entry, option)}
                    />
                  ))}
                </Flex>
                <Flex
                  justify={
                    entry.kind === 'expense' ? 'space-between' : 'flex-end'
                  }
                  // 44 px tap targets, laid out as the design's 10 px gap.
                  mt="0"
                  mb="-10px"
                  fontSize="13px"
                  fontWeight={600}
                >
                  {entry.kind === 'expense' && (
                    <Button
                      variant="unstyled"
                      h="44px"
                      fontSize="13px"
                      fontWeight={600}
                      color="text.secondary"
                      onClick={() => discard(entry)}
                    >
                      {t('review.discard')}
                    </Button>
                  )}
                  <Button
                    as={NextLink}
                    href={editHref}
                    variant="unstyled"
                    display="inline-flex"
                    alignItems="center"
                    h="44px"
                    fontSize="13px"
                    fontWeight={600}
                    color="brand.text"
                  >
                    {t('review.editFirst')}
                  </Button>
                </Flex>
              </Box>
            )
          })}
        </>
      )}
    </Stack>
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
