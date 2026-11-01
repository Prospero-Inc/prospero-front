import { DayHeader } from '@/components/design'
import { FixedExpenseSheet } from '@/components/fixed-expenses/FixedExpenseSheet'
import { CheckIcon, PlusIcon } from '@/components/icons/app'
import { ProsperoLayout } from '@/components/layouts'
import { LoadError } from '@/components/states/LoadError'
import { useConfirm } from '@/components/ui/ConfirmSheet'
import { EmptyState } from '@/components/ui/EmptyState'
import { useMovementFormatters } from '@/components/ui/MovementSummary'
import { getPageSkeleton } from '@/components/ui/PageSkeletons'
import { HttpMethod } from '@/enums'
import { getTodayLocalDate, localApiService } from '@/lib'
import { HttpError } from '@/lib/apiService'
import { DueStatus, dueDayOf, resolveDueStatus } from '@/lib/fixedExpenseDue'
import { useApi, useRevalidateApi, useUpdateApiCache } from '@/lib/useApi'
import { FixedExpenseData } from '@/services/fixedExpenses'
import {
  Box,
  Button,
  Flex,
  Stack,
  Text,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { MdEventRepeat } from 'react-icons/md'

interface FixedExpense extends FixedExpenseData {
  id: number
  paidThisCycle: boolean
}

const STATUS_ORDER: Record<DueStatus['kind'], number> = {
  overdue: 0,
  today: 1,
  upcoming: 2,
  paid: 3
}

/** "Hoy" solo en el navegador: el servidor corre en UTC y el usuario no, así
 * que calcularlo en el SSR podía mostrar otro día y romper la hidratación.
 * Hasta montar, el estado de vencimiento simplemente no se muestra. */
const useToday = () => {
  const [today, setToday] = useState<Date | null>(null)
  useEffect(() => setToday(new Date()), [])
  return today
}

export default function FixedExpensesPage() {
  const { t } = useTranslation('fixedExpenses')
  const router = useRouter()
  // Client-side data (SWR): saving or paying doesn't reload the page.
  // The local date, not the server's: in the evening UTC is already the next
  // day, and on the last day of the month that made last month's paid bills
  // show as unpaid. In the key, so it refetches when the day changes.
  const localToday = getTodayLocalDate()
  const fixedExpensesQuery = useApi<FixedExpense[]>('fixed-expenses', {
    today: localToday
  })
  const fixedExpenses = fixedExpensesQuery.data ?? []
  const revalidateApi = useRevalidateApi()
  const updateApiCache = useUpdateApiCache()
  /** Paying one creates a transaction, so periods and movements change too. */
  const refreshFixedExpenses = () =>
    revalidateApi('fixed-expenses', 'periods', 'transactions')
  const toast = useToast()
  const confirm = useConfirm()
  const { data: session } = useSession()
  const { formatAmount } = useMovementFormatters()
  const today = useToday()
  const [isLoading, setIsLoading] = useState(false)
  const [payingId, setPayingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const formDrawer = useDisclosure()
  const editingFixedExpense =
    fixedExpenses.find(item => item.id === editingId) ?? null

  const statusOf = (fixedExpense: FixedExpense): DueStatus | null =>
    today
      ? resolveDueStatus(
          dueDayOf(fixedExpense.dueDate),
          fixedExpense.paidThisCycle,
          today
        )
      : null

  // Lo que requiere atención primero (vencidos, hoy), lo pagado al final;
  // dentro de cada grupo, por día de cobro.
  const sorted = [...fixedExpenses].sort((a, b) => {
    const statusA = statusOf(a)
    const statusB = statusOf(b)
    const byStatus =
      statusA && statusB
        ? STATUS_ORDER[statusA.kind] - STATUS_ORDER[statusB.kind]
        : 0
    return byStatus || dueDayOf(a.dueDate) - dueDayOf(b.dueDate)
  })

  const total = fixedExpenses.reduce((sum, item) => sum + item.amount, 0)
  const paid = fixedExpenses
    .filter(item => item.paidThisCycle)
    .reduce((sum, item) => sum + item.amount, 0)
  const paidCount = fixedExpenses.filter(item => item.paidThisCycle).length

  const openCreate = () => {
    setEditingId(null)
    formDrawer.onOpen()
  }

  const startEdit = (fixedExpense: FixedExpense) => {
    setEditingId(fixedExpense.id)
    formDrawer.onOpen()
  }

  const closeForm = () => {
    formDrawer.onClose()
    setEditingId(null)
  }

  const onSubmit = async (payload: FixedExpenseData) => {
    setIsLoading(true)
    try {
      const headers = { Authorization: `Bearer ${session?.accessToken}` }
      if (editingId)
        await localApiService.request({
          endPoint: `/proxy/update-fixed-expense?id=${editingId}`,
          method: HttpMethod.PATCH,
          data: payload,
          headers
        })
      else
        await localApiService.request({
          endPoint: '/proxy/create-fixed-expense',
          method: HttpMethod.POST,
          data: payload,
          headers
        })

      toast({
        title: t('toast.success.title'),
        description: t('toast.success.description'),
        status: 'success',
        isClosable: true
      })
      closeForm()
      await refreshFixedExpenses()
    } catch (error) {
      toast({
        title: t('toast.error.title'),
        description:
          error instanceof Error ? error.message : t('toast.error.description'),
        status: 'error',
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onDelete = async (fixedExpense: FixedExpense) => {
    if (
      !(await confirm({
        title: t('list.confirmDeleteTitle', { name: fixedExpense.name }),
        description: t('list.confirmDeleteDescription'),
        confirmLabel: t('form.delete'),
        destructive: true
      }))
    )
      return

    // Gone from the list at once; the refresh restores it if the delete fails.
    updateApiCache<FixedExpense[]>('fixed-expenses', rows =>
      rows.filter(row => row.id !== fixedExpense.id)
    )

    try {
      await localApiService.request({
        endPoint: `/proxy/delete-fixed-expense?id=${fixedExpense.id}`,
        method: HttpMethod.DELETE,
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      })
      toast({
        title: t('toast.deleted.title'),
        description: t('toast.deleted.description'),
        status: 'success',
        isClosable: true
      })
      await refreshFixedExpenses()
    } catch (error) {
      toast({
        title: t('toast.error.title'),
        description:
          error instanceof Error ? error.message : t('toast.error.description'),
        status: 'error',
        isClosable: true
      })
    }
  }

  const onPay = async (id: number) => {
    setPayingId(id)
    try {
      await localApiService.request({
        endPoint: `/proxy/pay-fixed-expense?id=${id}&today=${getTodayLocalDate()}`,
        method: HttpMethod.POST,
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      })
      toast({
        title: t('toast.paid.title'),
        description: t('toast.paid.description'),
        status: 'success',
        isClosable: true
      })
      await refreshFixedExpenses()
    } catch (error) {
      if (error instanceof HttpError && error.status === 409) {
        toast({
          title: t('toast.alreadyPaid.title'),
          description: t('toast.alreadyPaid.description'),
          status: 'warning',
          isClosable: true
        })
        await refreshFixedExpenses()
      } else
        toast({
          title: t('toast.error.title'),
          description:
            error instanceof Error
              ? error.message
              : t('toast.error.description'),
          status: 'error',
          isClosable: true
        })
    } finally {
      setPayingId(null)
    }
  }

  const money = (value: number) => formatAmount(value)
  const monthLabel = today
    ? new Intl.DateTimeFormat(router.locale ?? 'es', { month: 'short' })
        .format(today)
        .replace('.', '')
    : ''

  /** "vence mañana", "venció el día 3": only when it's close or late, as
   * text next to the category (never color alone, WCAG 1.4.1). */
  const statusText = (status: DueStatus | null) => {
    if (!status) return null
    const lower = (text: string) =>
      text.charAt(0).toLocaleLowerCase() + text.slice(1)
    switch (status.kind) {
      case 'overdue':
        return lower(t('status.overdue', { day: status.day }))
      case 'today':
        return lower(t('status.today'))
      case 'upcoming':
        return status.daysLeft <= 3
          ? lower(t('status.upcoming', { count: status.daysLeft }))
          : null
      case 'paid':
        return null
    }
  }

  /** Overdue, today or tomorrow: outlined in the pending color (`.fx.due`). */
  const isDueSoon = (status: DueStatus | null) =>
    status?.kind === 'overdue' ||
    status?.kind === 'today' ||
    (status?.kind === 'upcoming' && status.daysLeft <= 1)

  /** docs/diseno-mobile.html `.fx`: date block, name + category, amount and
   * "Pagar" (or "✓ Pagado"). Tapping the name opens its edit form. */
  const renderFixedExpense = (fixedExpense: FixedExpense) => {
    const status = statusOf(fixedExpense)
    const inline = statusText(status)
    const isPaid = fixedExpense.paidThisCycle
    return (
      <Flex
        key={fixedExpense.id}
        align="center"
        gap="12px"
        bg="bg.surface"
        borderRadius="18px"
        py="12px"
        px="14px"
        boxShadow={
          isDueSoon(status)
            ? 'inset 0 0 0 1.5px var(--chakra-colors-status-pendingSolid)'
            : undefined
        }
      >
        <Flex
          as="button"
          type="button"
          onClick={() => startEdit(fixedExpense)}
          aria-label={`${t('list.actions.edit')}: ${fixedExpense.name}`}
          flex={1}
          minW={0}
          align="center"
          gap="12px"
          textAlign="left"
          minH="44px"
          _focusVisible={{ boxShadow: 'outline', outline: 'none' }}
        >
          <Box w="46px" flexShrink={0} textAlign="center" aria-hidden>
            <Text
              fontSize="20px"
              fontWeight="bold"
              lineHeight="1"
              color="text.primary"
            >
              {dueDayOf(fixedExpense.dueDate)}
            </Text>
            <Text
              fontSize="11px"
              fontWeight={600}
              color="text.secondary"
              textTransform="uppercase"
              mt="3px"
            >
              {monthLabel}
            </Text>
          </Box>
          <Box flex={1} minW={0}>
            <Text
              fontSize="14.5px"
              fontWeight={650}
              color="text.primary"
              noOfLines={1}
            >
              {fixedExpense.name}
            </Text>
            <Text fontSize="12px" color="text.secondary" mt="2px" noOfLines={2}>
              {t(`categories.${fixedExpense.budgetCategory}`)}
              {inline ? ` · ${inline}` : ''}
            </Text>
          </Box>
          <Text
            mr="6px"
            fontSize="14.5px"
            fontWeight={isPaid ? 'normal' : 'bold'}
            color={isPaid ? 'text.secondary' : 'text.primary'}
            flexShrink={0}
            sx={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {money(fixedExpense.amount)}
          </Text>
        </Flex>
        {isPaid ? (
          <Flex
            h="40px"
            align="center"
            gap="5px"
            color="money.incomeText"
            fontSize="13px"
            fontWeight="bold"
            flexShrink={0}
          >
            <CheckIcon boxSize="16px" />
            {t('status.paid')}
          </Flex>
        ) : (
          <Button
            h="44px"
            my="-2px"
            px="14px"
            borderRadius="12px"
            bg="brand.subtle"
            color="brand.strong"
            fontSize="13px"
            fontWeight="bold"
            flexShrink={0}
            _hover={{ bg: 'brand.subtle' }}
            _active={{ opacity: 0.8 }}
            isLoading={payingId === fixedExpense.id}
            aria-label={`${t('list.actions.pay')}: ${fixedExpense.name}`}
            onClick={() => onPay(fixedExpense.id)}
          >
            {t('list.actions.payShort')}
          </Button>
        )}
      </Flex>
    )
  }

  const toPay = sorted.filter(item => !item.paidThisCycle)
  const paidItems = sorted.filter(item => item.paidThisCycle)

  const layout = (children: React.ReactNode) => (
    <ProsperoLayout title={t('title')} pageDescription={t('title')}>
      {children}
    </ProsperoLayout>
  )

  // First load: the page's skeleton, not its empty states.
  const PageSkeleton = getPageSkeleton(router.pathname)
  if (
    fixedExpensesQuery.data === undefined &&
    !fixedExpensesQuery.error &&
    PageSkeleton
  )
    return layout(<PageSkeleton />)

  return layout(
    <Stack spacing="12px" maxW="lg" pb={4}>
      <FixedExpenseSheet
        isOpen={formDrawer.isOpen}
        onClose={closeForm}
        fixedExpense={editingFixedExpense}
        isSaving={isLoading}
        onSave={onSubmit}
        onDelete={fixedExpense => {
          closeForm()
          onDelete(fixedExpense as FixedExpense)
        }}
      />

      {fixedExpensesQuery.error && !fixedExpensesQuery.data ? (
        <LoadError
          what={t('loadErrorWhat')}
          onRetry={() => fixedExpensesQuery.mutate()}
          isRetrying={fixedExpensesQuery.isValidating}
        />
      ) : fixedExpenses.length === 0 ? (
        <EmptyState
          icon={MdEventRepeat}
          title={t('list.empty')}
          description={t('list.emptyHint')}
          action={
            <Button variant="brand" size="ctaSm" onClick={openCreate}>
              {t('form.openCreate')}
            </Button>
          }
        />
      ) : (
        <>
          <Flex
            bg="bg.surface"
            borderRadius="20px"
            p="16px"
            justify="space-between"
            align="center"
          >
            <Box>
              <Text fontSize="12.5px" color="text.secondary">
                {t('summary.thisPeriod')}
              </Text>
              <Text
                fontSize="22px"
                fontWeight="bold"
                lineHeight="1.25"
                color="text.primary"
                sx={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {money(total)}
              </Text>
            </Box>
            <Box textAlign="right">
              <Text fontSize="12.5px" color="text.secondary">
                {t('status.paid')}
              </Text>
              <Text
                fontSize="22px"
                fontWeight="bold"
                lineHeight="1.25"
                color="money.incomeText"
                sx={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {money(paid)}
              </Text>
            </Box>
          </Flex>
          <Box
            h="8px"
            mt="-4px"
            borderRadius="5px"
            bg="track.bg"
            overflow="hidden"
            role="progressbar"
            aria-label={t('summary.paid', {
              paid: paidCount,
              total: fixedExpenses.length
            })}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={paid}
          >
            <Box
              h="full"
              w={`${total > 0 ? (paid / total) * 100 : 0}%`}
              bg="money.income"
              borderRadius="5px"
            />
          </Box>

          {toPay.length > 0 && (
            <>
              <Box mt="6px">
                <DayHeader>{t('list.toPay')}</DayHeader>
              </Box>
              {toPay.map(renderFixedExpense)}
            </>
          )}
          {paidItems.length > 0 && (
            <>
              <Box mt="6px">
                <DayHeader>{t('list.paidSection')}</DayHeader>
              </Box>
              {paidItems.map(renderFixedExpense)}
            </>
          )}

          <Flex
            as="button"
            type="button"
            onClick={openCreate}
            h="52px"
            align="center"
            justify="center"
            gap="8px"
            borderRadius="18px"
            borderWidth="1.5px"
            borderStyle="dashed"
            borderColor="border.subtle"
            color="brand.text"
            fontSize="14px"
            fontWeight="bold"
            _focusVisible={{ boxShadow: 'outline', outline: 'none' }}
          >
            <PlusIcon boxSize="18px" />
            {t('form.openCreate')}
          </Flex>
        </>
      )}
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
      'mobileNav',
      'fixedExpenses'
    ]))
  }
})
