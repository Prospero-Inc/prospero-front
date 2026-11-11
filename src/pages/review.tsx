import { formatRelativeDay } from '@/components/dashboard/periodText'
import { BankBadge } from '@/components/design/settings'
import { AppleIcon, CheckIcon } from '@/components/icons/app'
import { ProsperoLayout } from '@/components/layouts'
import { useEditMovement } from '@/components/quick-add'
import { LoadError } from '@/components/states/LoadError'
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
import { Trans, useTranslation } from 'next-i18next'
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

/** The row when it came from the iPhone Shortcut, else null. */
const shortcutItem = (entry: ReviewItem): TransactionListItem | null =>
  entry.kind === 'expense' && entry.item.source === 'Shortcut'
    ? entry.item
    : null

/** "10:38 a. m.": dates are stored as the local wall clock in UTC fields. */
const timeOf = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale === 'es' ? 'es-SV' : locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC'
  }).format(new Date(iso))

/** design 20: black square with the Apple logo (iPhone Shortcut rows). */
const AppleBadge = () => (
  <Flex
    boxSize="40px"
    flexShrink={0}
    borderRadius="12px"
    bg="black"
    color="white"
    align="center"
    justify="center"
    aria-hidden
  >
    <AppleIcon boxSize="18px" />
  </Flex>
)

/** design .learn/.chk: "Recordar para <comercio>", ticked by default. */
const RememberMerchant = ({
  merchant,
  isOn,
  onToggle
}: {
  merchant: string
  isOn: boolean
  onToggle: () => void
}) => {
  const { t } = useTranslation('common')
  return (
    <Flex
      as="button"
      type="button"
      role="checkbox"
      aria-checked={isOn}
      onClick={onToggle}
      w="full"
      align="center"
      gap="10px"
      minH="44px"
      mt="10px"
      px="12px"
      py="10px"
      borderRadius="12px"
      bg="choice.onBg"
      fontSize="12.5px"
      lineHeight="1.4"
      color="text.primary"
      textAlign="left"
      _focusVisible={{ boxShadow: 'outline', outline: 'none' }}
    >
      <Flex
        boxSize="20px"
        flexShrink={0}
        borderRadius="6px"
        align="center"
        justify="center"
        bg={isOn ? 'brand.solid' : 'transparent'}
        borderWidth={isOn ? 0 : '2px'}
        borderColor="radio.off"
        color="white"
        aria-hidden
      >
        {isOn && <CheckIcon boxSize="12px" />}
      </Flex>
      <Box as="span">
        <Trans
          t={t}
          i18nKey="review.remember"
          values={{ merchant }}
          components={{ b: <Text as="b" fontWeight={700} /> }}
        />
      </Box>
    </Flex>
  )
}

const money = (value: number) =>
  `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

/** `.rev .opts div`: 44 px outlined choice. */
// design .rev .opts .sug: the suggested category, outlined in its color.
const SUGGESTED_STYLE: Record<BudgetCategory, { border: string; bg: string }> =
  {
    Necesidad: { border: 'category.Necesidad', bg: 'brand.subtle' },
    Deseo: { border: 'category.Deseo', bg: 'notice.bg' },
    Ahorro: { border: 'category.Ahorro', bg: 'tint.Ahorro' }
  }

const OptionButton = ({
  label,
  suggested,
  onClick
}: {
  label: string
  /** Shown as the design's `.sug` (backend's suggestedCategory). */
  suggested?: BudgetCategory
  onClick: () => void
}) => (
  <Button
    data-suggested={suggested ? 'true' : undefined}
    variant="unstyled"
    flex="1 1 0"
    minW="calc(33.333% - 6px)"
    h="44px"
    borderRadius="12px"
    borderWidth="1.5px"
    borderColor={
      suggested ? SUGGESTED_STYLE[suggested].border : 'border.subtle'
    }
    bg={suggested ? SUGGESTED_STYLE[suggested].bg : undefined}
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
  const editMovement = useEditMovement()
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

  // iPhone Shortcut rows whose "Recordar para …" was unticked.
  const [forgetMerchant, setForgetMerchant] = useState<ReadonlySet<number>>(
    new Set()
  )
  const toggleRemember = (id: number) =>
    setForgetMerchant(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

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
            ? {
                category: choice,
                ...(shortcutItem(entry)
                  ? { rememberMerchant: !forgetMerchant.has(entry.item.id) }
                  : {})
              }
            : { incomeCategory: choice },
        headers: authorization
      })
    )

  // Only expenses here; a detected income is deleted from its edit sheet.
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
      {(expenses.error && !expenses.data) ||
      (incomes.error && !incomes.data) ? (
        <LoadError
          what={t('states.what.review')}
          onRetry={() => {
            expenses.mutate()
            incomes.mutate()
          }}
          isRetrying={expenses.isValidating || incomes.isValidating}
        />
      ) : items.length === 0 ? (
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
            const shortcut = shortcutItem(entry)
            const options =
              entry.kind === 'expense' ? CATEGORIES : INCOME_CATEGORIES
            return (
              <Box
                key={`${entry.kind}-${item.id}`}
                as="article"
                bg="bg.surface"
                borderRadius="20px"
                p="14px"
              >
                <Flex align="center" gap="12px">
                  {shortcut ? (
                    <AppleBadge />
                  ) : (
                    <BankBadge name={item.institutionName} />
                  )}
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
                      {shortcut ? (
                        [
                          t('review.iphone'),
                          shortcut.walletCard?.name,
                          timeOf(item.date, locale)
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      ) : (
                        <>
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
                        </>
                      )}
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
                    shortcut
                      ? 'review.newMerchantQuestion'
                      : entry.kind === 'expense'
                      ? 'review.expenseQuestion'
                      : 'review.incomeQuestion'
                  )}
                </Text>
                <Flex gap="8px" wrap="wrap">
                  {options.map(option => {
                    const label = t(
                      entry.kind === 'expense'
                        ? `quickAdd.categories.${option}`
                        : `review.incomeCategories.${option}`
                    )
                    return (
                      <OptionButton
                        key={option}
                        label={label}
                        suggested={
                          entry.kind === 'expense' &&
                          entry.item.category === null &&
                          entry.item.suggestedCategory === option
                            ? entry.item.suggestedCategory
                            : undefined
                        }
                        onClick={() => confirm(entry, option)}
                      />
                    )
                  })}
                </Flex>
                {shortcut?.description && (
                  <RememberMerchant
                    merchant={shortcut.description}
                    isOn={!forgetMerchant.has(shortcut.id)}
                    onToggle={() => toggleRemember(shortcut.id)}
                  />
                )}
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
                    variant="unstyled"
                    h="44px"
                    fontSize="13px"
                    fontWeight={600}
                    color="brand.text"
                    onClick={() =>
                      editMovement({ ...entry, title: titleOf(entry) })
                    }
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
