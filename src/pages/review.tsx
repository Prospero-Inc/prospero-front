import { ProsperoLayout } from '@/components/layouts'
import { Amount } from '@/components/ui/Amount'
import { ChoiceButton } from '@/components/ui/ChoiceButton'
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
import {
  Badge,
  Box,
  Button,
  Flex,
  SimpleGrid,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react'
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

/**
 * "Por revisar" (docs/diseno-mobile.html, 02): the movements Gmail
 * detected, as cards. One tap on a category confirms it; the card leaves
 * at once with "Deshacer" for a few seconds — no confirmation dialogs, no
 * page reloads (it used to be ~3 taps and a reload per item).
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
  const setHiddenKey = (key: string, isHidden: boolean) =>
    setHidden(current => {
      const next = new Set(current)
      if (isHidden) next.add(key)
      else next.delete(key)
      return next
    })

  const items: ReviewItem[] = [
    ...(expenses.data ?? []).map(item => ({ kind: 'expense' as const, item })),
    ...(incomes.data ?? []).map(item => ({ kind: 'income' as const, item }))
  ]
    .filter(entry => !hidden.has(`${entry.kind}-${entry.item.id}`))
    .sort((a, b) => b.item.date.localeCompare(a.item.date))

  const confirm = (entry: ReviewItem, choice: string, label: string) => {
    const { id } = entry.item
    const cardKey = `${entry.kind}-${id}`
    setHiddenKey(cardKey, true)

    scheduleCommit({
      key: `review-${cardKey}`,
      message: t('review.confirmed', { label }),
      onUndo: () => setHiddenKey(cardKey, false),
      commit: async () => {
        try {
          await localApiService.request({
            method: HttpMethod.PATCH,
            endPoint:
              entry.kind === 'expense'
                ? `/proxy/update-transaction?id=${id}`
                : `/proxy/update-salary?id=${id}`,
            data:
              entry.kind === 'expense'
                ? { category: choice }
                : { incomeCategory: choice },
            headers: { Authorization: `Bearer ${session?.accessToken}` }
          })
        } catch (error) {
          toast({
            title: t('review.error'),
            description: error instanceof Error ? error.message : undefined,
            status: 'error'
          })
          setHiddenKey(cardKey, false) // failed: show the card again
          return
        }
        await revalidateApi('periods', 'transactions', 'salary', 'review-queue')
        setHiddenKey(cardKey, false) // gone from the refetched list anyway
      }
    })
  }

  const PageSkeleton = getPageSkeleton(router.pathname)
  if (
    (expenses.data === undefined || incomes.data === undefined) &&
    !expenses.error &&
    !incomes.error &&
    PageSkeleton
  )
    return (
      <ProsperoLayout
        title={t('review.title')}
        pageDescription={t('review.title')}
      >
        <PageSkeleton />
      </ProsperoLayout>
    )

  return (
    <ProsperoLayout
      title={t('review.title')}
      pageDescription={t('review.title')}
    >
      <Stack spacing={4} maxW="lg" pb={4}>
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
            <Text color="text.secondary">
              {t('review.count', { count: items.length })}
            </Text>
            {items.map(entry => {
              const { item } = entry
              const options =
                entry.kind === 'expense' ? CATEGORIES : INCOME_CATEGORIES
              return (
                <Box
                  key={`${entry.kind}-${item.id}`}
                  as="article"
                  bg="bg.surface"
                  borderRadius="16px"
                  borderWidth="1px"
                  borderColor="border.subtle"
                  p={4}
                >
                  <Flex justify="space-between" align="flex-start" gap={3}>
                    <Box minW={0}>
                      <Flex align="center" gap={2} mb={1}>
                        {item.institutionName && (
                          <Badge colorScheme="gray">
                            {item.institutionName}
                          </Badge>
                        )}
                        <Text fontSize="sm" color="text.secondary">
                          {new Intl.DateTimeFormat(router.locale ?? 'es', {
                            day: 'numeric',
                            month: 'short',
                            timeZone: 'UTC'
                          }).format(new Date(item.date))}
                        </Text>
                      </Flex>
                      <Text
                        fontWeight="semibold"
                        color="text.primary"
                        noOfLines={2}
                      >
                        {item.description ||
                          t(
                            entry.kind === 'expense'
                              ? 'review.untitledExpense'
                              : 'review.untitledIncome'
                          )}
                      </Text>
                    </Box>
                    <Amount
                      value={item.amount}
                      kind={entry.kind}
                      fontSize="lg"
                    />
                  </Flex>
                  <Text fontSize="sm" color="text.secondary" mt={3} mb={2}>
                    {t(
                      entry.kind === 'expense'
                        ? 'review.expenseQuestion'
                        : 'review.incomeQuestion'
                    )}
                  </Text>
                  <SimpleGrid columns={3} spacing={2}>
                    {options.map(option => {
                      const label = t(
                        entry.kind === 'expense'
                          ? `quickAdd.categories.${option}`
                          : `review.incomeCategories.${option}`
                      )
                      return (
                        <ChoiceButton
                          key={option}
                          label={label}
                          isSelected={false}
                          color={
                            entry.kind === 'expense'
                              ? `category.${option}`
                              : 'money.income'
                          }
                          onClick={() => confirm(entry, option, label)}
                        />
                      )
                    })}
                  </SimpleGrid>
                </Box>
              )
            })}
          </>
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
