import { ProsperoLayout } from '@/components/layouts'
import { MovementDayList } from '@/components/ui/MovementDayList'
import {
  FilterResults,
  MovementFiltersBar
} from '@/components/ui/MovementFiltersBar'
import { MovementFormDrawer } from '@/components/ui/MovementFormDrawer'
import {
  CategoryBadge,
  GmailSourceBadge,
  MovementSummary,
  useMovementFormatters
} from '@/components/ui/MovementSummary'
import {
  MovementListSkeleton,
  getPageSkeleton
} from '@/components/ui/PageSkeletons'
import { HttpMethod } from '@/enums'
import { useMovementFilters } from '@/hooks/useMovementFilters'
import { useIsReloadingPage } from '@/hooks/useRouteLoading'
import { getTodayLocalDate, localApiService } from '@/lib'
import { HttpError } from '@/lib/apiService'
import {
  hasActiveMovementFilters,
  matchesMovementFilters
} from '@/lib/movementFilters'
import { useApi, useRevalidateApi, useUpdateApiCache } from '@/lib/useApi'
import { PeriodSummary } from '@/services/periods'
import {
  BudgetCategory,
  TransactionData,
  TransactionListItem
} from '@/services/transactions'
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  IconButton,
  Input,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Select,
  Stack,
  Td,
  Text,
  Th,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VisuallyHidden
} from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md'

type Transaction = TransactionListItem

const BUDGET_CATEGORIES: BudgetCategory[] = ['Necesidad', 'Deseo', 'Ahorro']

// The amount starts empty, not 0: a prefilled 0 had to be deleted first.
type TransactionForm = Omit<TransactionData, 'amount'> & { amount: number | '' }

const emptyForm: TransactionForm = {
  amount: '',
  date: getTodayLocalDate(),
  category: 'Necesidad',
  description: '',
  periodOverride: ''
}

/** Badge + tooltip informativo de "posible duplicado" detectado por Gmail,
 * compartido entre la tabla desktop y las cards mobile. Ofrece las dos
 * resoluciones posibles: confirmar que es el mismo movimiento (descarta el
 * aviso, no crea nada) o aclarar que son movimientos distintos (crea un
 * gasto nuevo con los datos del correo). */
const PossibleDuplicateBadge = ({
  duplicate,
  onDismiss,
  isDismissing,
  onNotSame,
  isResolving
}: {
  duplicate: NonNullable<Transaction['possibleGmailDuplicate']>
  onDismiss: (_duplicateId: number) => void
  isDismissing: boolean
  onNotSame: (_duplicateId: number) => void
  isResolving: boolean
}) => {
  const { t } = useTranslation('expenditures', {
    keyPrefix: 'possibleDuplicate'
  })

  return (
    <Popover trigger="hover" placement="top">
      <PopoverTrigger>
        <Badge colorScheme="purple" cursor="help">
          {t('badge')}
        </Badge>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverBody fontSize="sm">
          <Text mb={3}>
            {t('tooltip', {
              senderEmail: duplicate.senderEmail,
              processedAt: duplicate.processedAt.slice(0, 10)
            })}
          </Text>
          <ButtonGroup size="xs" spacing={2} isAttached={false}>
            <Button
              variant="solid"
              colorScheme="purple"
              isLoading={isDismissing}
              isDisabled={isResolving}
              onClick={() => onDismiss(duplicate.id)}
            >
              {t('dismissAction')}
            </Button>
            <Button
              variant="outline"
              colorScheme="purple"
              isLoading={isResolving}
              isDisabled={isDismissing}
              onClick={() => onNotSame(duplicate.id)}
            >
              {t('notSameAction')}
            </Button>
          </ButtonGroup>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

export default function ExpendituresPage() {
  const { t } = useTranslation('expenditures')
  const router = useRouter()
  const toast = useToast()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [pendingCategory, setPendingCategory] = useState<
    Record<number, BudgetCategory | ''>
  >({})
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [resolvingDuplicateId, setResolvingDuplicateId] = useState<
    number | null
  >(null)
  const [dismissingDuplicateId, setDismissingDuplicateId] = useState<
    number | null
  >(null)
  const { control, handleSubmit, reset } = useForm<TransactionForm>({
    defaultValues: emptyForm
  })

  const pendingReviewBg = useColorModeValue('orange.50', 'orange.900')
  const pendingReviewBorderColor = useColorModeValue('orange.200', 'orange.600')
  const pendingReviewDescriptionColor = useColorModeValue(
    'gray.600',
    'orange.100'
  )
  const pendingReviewCardBg = useColorModeValue('white', 'gray.700')
  const { formatAmount } = useMovementFormatters()
  const isChangingRoute = useIsReloadingPage()
  const {
    filters,
    period,
    searchInput,
    setSearchInput,
    setFilters,
    clearFilters,
    setPeriod
  } = useMovementFilters(BUDGET_CATEGORIES)

  // Client-side data (SWR): navigating, switching periods and saving don't
  // reload the page. Waits for the router so the period from the URL is in
  // the first request.
  const periodTransactions = useApi<Transaction[]>(
    router.isReady ? 'periods/transactions' : null,
    { period }
  )
  const pendingQuery = useApi<Transaction[]>('transactions', {
    reviewStatus: PENDING_STATUSES.join(',')
  })
  const periodsQuery = useApi<PeriodSummary[]>('periods')
  const revalidateApi = useRevalidateApi()
  const updateApiCache = useUpdateApiCache()
  /** Fresh data for everything a movement change can affect. */
  const refreshMovements = () =>
    revalidateApi('periods', 'transactions', 'review-queue')

  // Pending rows are listed on their own at the top, whatever their period.
  const transactions = (periodTransactions.data ?? []).filter(
    transaction => !PENDING_STATUSES.includes(transaction.reviewStatus)
  )
  const pendingTransactions = pendingQuery.data ?? []
  const periods = periodsQuery.data ?? []
  const isReloading = isChangingRoute || periodTransactions.isLoading

  // Link to a period that no longer exists (e.g. its payroll was deleted):
  // back to the current period instead of an empty screen.
  const periodError = periodTransactions.error
  useEffect(() => {
    if (
      period &&
      periodError instanceof HttpError &&
      periodError.status === 404
    )
      setPeriod(undefined)
  }, [period, periodError, setPeriod])

  const selectedPeriod =
    periods.find(summary => summary.key === period) ??
    periods.find(summary => summary.isOpen)
  const visibleTransactions = transactions.filter(transaction =>
    matchesMovementFilters(
      {
        concept: transaction.description || transaction.fixedExpenseName || '',
        amount: transaction.amount,
        group: transaction.category,
        source: transaction.source
      },
      filters
    )
  )

  // Concepto: lo que escribió el usuario (o lo que parseó Gmail); si no hay,
  // el nombre del gasto fijo que pagó; si tampoco, un placeholder atenuado.
  const renderSummary = (
    transaction: Transaction,
    {
      withDuplicateBadge,
      showDate = true
    }: { withDuplicateBadge: boolean; showDate?: boolean }
  ) => (
    <MovementSummary
      title={
        transaction.description?.trim() || transaction.fixedExpenseName || null
      }
      fallbackTitle={t('list.noDescription')}
      date={transaction.date}
      showDate={showDate}
      badges={
        (transaction.fixedExpenseName ||
          transaction.source === 'Gmail' ||
          (withDuplicateBadge && transaction.possibleGmailDuplicate)) && (
          <>
            {transaction.fixedExpenseName && (
              <Badge colorScheme="teal" variant="subtle">
                {t('list.fixedExpenseBadge')}
              </Badge>
            )}
            {transaction.source === 'Gmail' && (
              <GmailSourceBadge
                label={transaction.institutionName ?? t('list.gmailSource')}
              />
            )}
            {withDuplicateBadge && transaction.possibleGmailDuplicate && (
              <PossibleDuplicateBadge
                duplicate={transaction.possibleGmailDuplicate}
                onDismiss={onDismissDuplicate}
                isDismissing={
                  dismissingDuplicateId ===
                  transaction.possibleGmailDuplicate.id
                }
                onNotSame={onNotSameMovement}
                isResolving={
                  resolvingDuplicateId === transaction.possibleGmailDuplicate.id
                }
              />
            )}
          </>
        )
      }
    />
  )

  const renderCategory = (transaction: Transaction) =>
    transaction.category ? (
      <CategoryBadge
        category={transaction.category}
        label={t(`categories.${transaction.category}`)}
      />
    ) : (
      <Text as="span" color="gray.500" fontSize="sm">
        —
      </Text>
    )

  const formDrawer = useDisclosure()
  const amountInputRef = useRef<HTMLInputElement | null>(null)

  const openCreate = () => {
    setEditingId(null)
    // Fecha de hoy calculada al abrir, no al cargar el módulo: la página
    // puede quedar abierta de un día para otro.
    reset({ ...emptyForm, date: getTodayLocalDate() })
    formDrawer.onOpen()
  }

  const startEdit = (transaction: Transaction) => {
    setEditingId(transaction.id)
    reset({
      amount: transaction.amount,
      date: transaction.date.slice(0, 10),
      category: transaction.category ?? 'Necesidad',
      description: transaction.description ?? '',
      periodOverride: transaction.periodOverride ?? ''
    })
    formDrawer.onOpen()
  }

  const closeForm = () => {
    formDrawer.onClose()
    setEditingId(null)
  }

  const onSubmit = async (data: TransactionForm) => {
    setIsLoading(true)
    try {
      const payload = {
        ...data,
        amount: Number(data.amount),
        periodOverride: data.periodOverride || undefined
      }
      const headers = { Authorization: `Bearer ${session?.accessToken}` }
      if (editingId)
        await localApiService.request({
          endPoint: `/proxy/update-transaction?id=${editingId}`,
          method: HttpMethod.PATCH,
          data: payload,
          headers
        })
      else
        await localApiService.request({
          endPoint: '/proxy/create-transaction',
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
      await refreshMovements()
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

  const onDelete = async (id: number) => {
    if (!window.confirm(t('list.confirmDelete'))) return

    // Gone from the list at once; the refresh below restores it if the
    // delete fails.
    const withoutDeleted = (rows: Transaction[]) =>
      rows.filter(row => row.id !== id)
    updateApiCache('periods/transactions', withoutDeleted)
    updateApiCache('transactions', withoutDeleted)

    try {
      await localApiService.request({
        endPoint: `/proxy/delete-transaction?id=${id}`,
        method: HttpMethod.DELETE,
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      })
      toast({
        title: t('toast.deleted.title'),
        description: t('toast.deleted.description'),
        status: 'success',
        isClosable: true
      })
      await refreshMovements()
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

  const onNotSameMovement = async (processedEmailId: number) => {
    if (!window.confirm(t('possibleDuplicate.confirmDialog'))) return

    setResolvingDuplicateId(processedEmailId)
    try {
      await localApiService.request({
        endPoint: `/proxy/create-processed-email-anyway?id=${processedEmailId}`,
        method: HttpMethod.POST,
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      })
      toast({
        title: t('possibleDuplicate.toast.created.title'),
        description: t('possibleDuplicate.toast.created.description'),
        status: 'success',
        isClosable: true
      })
      await refreshMovements()
    } catch (error) {
      if (error instanceof HttpError && error.status === 409)
        toast({
          title: t('possibleDuplicate.toast.alreadyResolved.title'),
          description: t('possibleDuplicate.toast.alreadyResolved.description'),
          status: 'warning',
          isClosable: true
        })
      else if (error instanceof HttpError && error.status === 422)
        toast({
          title: t('possibleDuplicate.toast.missingSnapshot.title'),
          description: t('possibleDuplicate.toast.missingSnapshot.description'),
          status: 'warning',
          isClosable: true
        })
      else
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
      setResolvingDuplicateId(null)
    }
  }

  const onDismissDuplicate = async (processedEmailId: number) => {
    if (!window.confirm(t('possibleDuplicate.dismissConfirmDialog'))) return

    setDismissingDuplicateId(processedEmailId)
    try {
      await localApiService.request({
        endPoint: `/proxy/dismiss-processed-email?id=${processedEmailId}`,
        method: HttpMethod.POST,
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      })
      toast({
        title: t('possibleDuplicate.toast.dismissed.title'),
        description: t('possibleDuplicate.toast.dismissed.description'),
        status: 'success',
        isClosable: true
      })
      await refreshMovements()
    } catch (error) {
      if (error instanceof HttpError && error.status === 409)
        toast({
          title: t('possibleDuplicate.toast.alreadyResolved.title'),
          description: t('possibleDuplicate.toast.alreadyResolved.description'),
          status: 'warning',
          isClosable: true
        })
      else
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
      setDismissingDuplicateId(null)
    }
  }

  const onConfirmPendingTransaction = async (id: number) => {
    const category = pendingCategory[id]
    if (!category) return

    setConfirmingId(id)
    try {
      await localApiService.request({
        endPoint: `/proxy/update-transaction?id=${id}`,
        method: HttpMethod.PATCH,
        data: { category },
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      })
      toast({
        title: t('toast.success.title'),
        description: t('toast.success.description'),
        status: 'success',
        isClosable: true
      })
      await refreshMovements()
    } catch (error) {
      toast({
        title: t('toast.error.title'),
        description:
          error instanceof Error ? error.message : t('toast.error.description'),
        status: 'error',
        isClosable: true
      })
    } finally {
      setConfirmingId(null)
    }
  }

  // First load: the page's skeleton, not its empty states.
  const PageSkeleton = getPageSkeleton(router.pathname)
  if (periodsQuery.data === undefined && !periodsQuery.error && PageSkeleton)
    return (
      <ProsperoLayout title={t('title')} pageDescription={t('title')}>
        <PageSkeleton />
      </ProsperoLayout>
    )
  return (
    <ProsperoLayout title={t('title')} pageDescription={t('title')}>
      <Stack spacing={6}>
        <Flex justify="flex-end">
          <Button
            colorScheme="primary"
            leftIcon={<MdAdd />}
            onClick={openCreate}
            minH="44px"
            w={{ base: 'full', md: 'auto' }}
          >
            {t('form.openCreate')}
          </Button>
        </Flex>

        <MovementFormDrawer
          isOpen={formDrawer.isOpen}
          onClose={closeForm}
          title={editingId ? t('form.editTitle') : t('form.createTitle')}
          formId="expense-form"
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isLoading}
          submitLabel={editingId ? t('form.submitEdit') : t('form.submit')}
          cancelLabel={t('form.cancel')}
          initialFocusRef={amountInputRef}
        >
          <FormControl isRequired>
            <FormLabel>{t('form.labelAmount')}</FormLabel>
            <Controller
              name="amount"
              control={control}
              render={({ field: { ref, ...field } }) => (
                <Input
                  {...field}
                  ref={element => {
                    ref(element)
                    amountInputRef.current = element
                  }}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                />
              )}
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t('form.labelCategory')}</FormLabel>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select {...field}>
                  <option value="Necesidad">{t('categories.Necesidad')}</option>
                  <option value="Deseo">{t('categories.Deseo')}</option>
                  <option value="Ahorro">{t('categories.Ahorro')}</option>
                </Select>
              )}
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t('form.labelDate')}</FormLabel>
            <Controller
              name="date"
              control={control}
              render={({ field }) => <Input {...field} type="date" />}
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t('form.labelDescription')}</FormLabel>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder={t('form.descriptionPlaceholder')}
                />
              )}
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t('form.labelPeriodOverride')}</FormLabel>
            <Controller
              name="periodOverride"
              control={control}
              render={({ field }) => (
                <Select {...field}>
                  <option value="">{t('periodOverride.none')}</option>
                  <option value="Previous">
                    {t('periodOverride.Previous')}
                  </option>
                  <option value="Current">{t('periodOverride.Current')}</option>
                </Select>
              )}
            />
          </FormControl>
        </MovementFormDrawer>

        {pendingTransactions.length > 0 && (
          <Box
            bg={pendingReviewBg}
            borderWidth="1px"
            borderColor={pendingReviewBorderColor}
            borderRadius="md"
            p={4}
          >
            <Heading size="sm" mb={1}>
              {t('pendingReview.title', { count: pendingTransactions.length })}
            </Heading>
            <Text fontSize="sm" color={pendingReviewDescriptionColor} mb={4}>
              {t('pendingReview.description')}
            </Text>
            <Stack spacing={3}>
              {pendingTransactions.map(transaction => {
                const selected = pendingCategory[transaction.id] ?? ''
                return (
                  <Card
                    key={transaction.id}
                    variant="outline"
                    bg={pendingReviewCardBg}
                  >
                    <CardBody>
                      <Stack spacing={3}>
                        <Flex
                          justify="space-between"
                          align="center"
                          wrap="wrap"
                          gap={2}
                        >
                          <Flex flex="1" justify="space-between" gap={3}>
                            {renderSummary(transaction, {
                              withDuplicateBadge: false
                            })}
                            <Text fontWeight="semibold" whiteSpace="nowrap">
                              {formatAmount(transaction.amount)}
                            </Text>
                          </Flex>
                          <Badge colorScheme="orange">
                            {t('pendingReview.badge')}
                          </Badge>
                        </Flex>

                        <FormControl>
                          <Select
                            size="sm"
                            placeholder={t('pendingReview.categoryPlaceholder')}
                            value={selected}
                            onChange={e =>
                              setPendingCategory(prev => ({
                                ...prev,
                                [transaction.id]: e.target
                                  .value as BudgetCategory
                              }))
                            }
                          >
                            {BUDGET_CATEGORIES.map(category => (
                              <option key={category} value={category}>
                                {t(`categories.${category}`)}
                              </option>
                            ))}
                          </Select>
                          {!selected && (
                            <FormHelperText>
                              {t('pendingReview.confirmHelper')}
                            </FormHelperText>
                          )}
                        </FormControl>

                        <Stack direction="row">
                          <Button
                            size="sm"
                            colorScheme="primary"
                            isDisabled={!selected}
                            aria-disabled={!selected}
                            isLoading={confirmingId === transaction.id}
                            onClick={() =>
                              onConfirmPendingTransaction(transaction.id)
                            }
                          >
                            {t('pendingReview.confirm')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(transaction)}
                          >
                            {t('list.actions.edit')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => onDelete(transaction.id)}
                          >
                            {t('list.actions.delete')}
                          </Button>
                        </Stack>
                      </Stack>
                    </CardBody>
                  </Card>
                )
              })}
            </Stack>
          </Box>
        )}

        <Box>
          <Heading size="md" mb={3}>
            {t('list.title')}
          </Heading>
          {periods.length > 0 && (
            <Box mb={4}>
              <MovementFiltersBar
                periods={periods}
                selectedPeriod={period}
                onPeriodChange={setPeriod}
                stats={
                  selectedPeriod
                    ? [
                        {
                          label: t('list.stats.spent'),
                          value: formatAmount(selectedPeriod.totalSpent)
                        },
                        ...BUDGET_CATEGORIES.map(category => ({
                          label: t(`categories.${category}`),
                          value: formatAmount(
                            selectedPeriod.budget[
                              category.toLowerCase() as keyof PeriodSummary['budget']
                            ].spent
                          )
                        }))
                      ]
                    : []
                }
                filters={filters}
                searchInput={searchInput}
                onSearchInputChange={setSearchInput}
                onFiltersChange={setFilters}
                isReloading={isReloading}
                groupsLabel={t('form.labelCategory')}
                groupOptions={BUDGET_CATEGORIES.map(category => ({
                  value: category,
                  label: t(`categories.${category}`)
                }))}
              />
            </Box>
          )}
          {/* Recargando esta misma pantalla (cambio de período, después de
              guardar): la lista vieja se reemplaza por su skeleton. */}
          {isReloading ? (
            <MovementListSkeleton />
          ) : (
            <>
              <FilterResults
                shown={visibleTransactions.length}
                total={transactions.length}
                isFiltering={hasActiveMovementFilters(filters)}
                onClear={clearFilters}
                emptyPeriodText={t('list.emptyPeriod')}
              />
              {visibleTransactions.length > 0 && (
                <MovementDayList
                  items={visibleTransactions}
                  getKey={transaction => transaction.id}
                  getDate={transaction => transaction.date}
                  getAmount={transaction => transaction.amount}
                  resetKey={JSON.stringify([period, filters])}
                  columnCount={4}
                  tableHead={
                    <Tr>
                      <Th>{t('list.columnConcept')}</Th>
                      <Th>{t('form.labelCategory')}</Th>
                      <Th isNumeric>{t('form.labelAmount')}</Th>
                      <Th>
                        <VisuallyHidden>
                          {t('list.columnActions')}
                        </VisuallyHidden>
                      </Th>
                    </Tr>
                  }
                  renderTableRow={transaction => (
                    <Tr key={transaction.id}>
                      <Td maxW="sm" whiteSpace="normal">
                        {renderSummary(transaction, {
                          withDuplicateBadge: true,
                          showDate: false
                        })}
                      </Td>
                      <Td>{renderCategory(transaction)}</Td>
                      <Td isNumeric fontWeight="semibold">
                        {formatAmount(transaction.amount)}
                      </Td>
                      <Td>
                        <IconButton
                          aria-label={t('list.actions.edit')}
                          icon={<MdEdit />}
                          size="sm"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={() => startEdit(transaction)}
                          mr={2}
                        />
                        <IconButton
                          aria-label={t('list.actions.delete')}
                          icon={<MdDelete />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => onDelete(transaction.id)}
                        />
                      </Td>
                    </Tr>
                  )}
                  renderCard={transaction => (
                    <Card key={transaction.id} variant="outline">
                      <CardBody>
                        <Stack spacing={2}>
                          <Flex
                            justify="space-between"
                            align="flex-start"
                            gap={3}
                          >
                            {renderSummary(transaction, {
                              withDuplicateBadge: true,
                              showDate: false
                            })}
                            <Text fontWeight="semibold" whiteSpace="nowrap">
                              {formatAmount(transaction.amount)}
                            </Text>
                          </Flex>

                          <Divider />

                          <Flex justify="space-between" align="center">
                            {renderCategory(transaction)}
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                aria-label={t('list.actions.edit')}
                                icon={<MdEdit />}
                                boxSize="44px"
                                minW="44px"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => startEdit(transaction)}
                              />
                              <IconButton
                                aria-label={t('list.actions.delete')}
                                icon={<MdDelete />}
                                boxSize="44px"
                                minW="44px"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => onDelete(transaction.id)}
                              />
                            </Stack>
                          </Flex>
                        </Stack>
                      </CardBody>
                    </Card>
                  )}
                />
              )}
            </>
          )}
        </Box>
      </Stack>
    </ProsperoLayout>
  )
}

const PENDING_STATUSES = ['Detected', 'PendingReview']

// Translations only: the data is loaded client-side (see useApi above) and
// the middleware already guards the route.
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale as string, [
      'common',
      'sidebar',
      'mobileNav',
      'expenditures'
    ]))
  }
})
