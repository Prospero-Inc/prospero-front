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
import { useApi, useRevalidateApi } from '@/lib/useApi'
import { PeriodSummary } from '@/services/periods'
import {
  IncomeCategory,
  IncomeType,
  SalaryData,
  SalaryListItem
} from '@/services/salary'
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  IconButton,
  Input,
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
import { MdAdd, MdEdit } from 'react-icons/md'

type SalaryEntry = SalaryListItem

const INCOME_CATEGORIES: IncomeCategory[] = [
  'Payroll',
  'Extra',
  'Transfer',
  'Reimbursement',
  'Deposit',
  'Other'
]

const INCOME_TYPES: IncomeType[] = ['Payroll', 'Extra']

// The amount starts empty, not 0: a prefilled 0 had to be deleted first.
type SalaryForm = Omit<SalaryData, 'amount'> & { amount: number | '' }

const emptyForm: SalaryForm = {
  amount: '',
  date: getTodayLocalDate(),
  type: 'Payroll',
  budgetCategory: '',
  distributeAutomatically: false,
  description: ''
}

export default function EntriesPage() {
  const { t } = useTranslation('entries')
  const router = useRouter()
  const toast = useToast()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [pendingCategory, setPendingCategory] = useState<
    Record<number, IncomeCategory | ''>
  >({})
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const { control, handleSubmit, reset, watch } = useForm<SalaryForm>({
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
  } = useMovementFilters(INCOME_TYPES)

  // Client-side data (SWR): navigating, switching periods and saving don't
  // reload the page. Waits for the router so the period from the URL is in
  // the first request.
  const periodSalary = useApi<SalaryEntry[]>(
    router.isReady ? 'periods/salary' : null,
    { period }
  )
  const pendingQuery = useApi<SalaryEntry[]>('salary', {
    status: PENDING_STATUSES.join(',')
  })
  const periodsQuery = useApi<PeriodSummary[]>('periods')
  const revalidateApi = useRevalidateApi()
  /** Fresh data for everything an income change can affect. */
  const refreshIncome = () => revalidateApi('periods', 'salary', 'review-queue')

  // Pending rows are listed on their own at the top, whatever their period.
  const salary = (periodSalary.data ?? []).filter(
    entry => !PENDING_STATUSES.includes(entry.status)
  )
  const pendingSalary = pendingQuery.data ?? []
  const periods = periodsQuery.data ?? []
  const isReloading = isChangingRoute || periodSalary.isLoading

  // Link to a period that no longer exists: back to the current period.
  const periodError = periodSalary.error
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
  const visibleSalary = salary.filter(entry =>
    matchesMovementFilters(
      {
        concept: entry.description ?? '',
        amount: entry.amount,
        group: entry.type ?? null,
        source: entry.source
      },
      filters
    )
  )

  // Concepto: lo que escribió el usuario; si no hay, el tipo de ingreso
  // (atenuado) para que la fila nunca quede identificada solo por la fecha.
  const renderSummary = (
    entry: SalaryEntry,
    { showDate = true }: { showDate?: boolean } = {}
  ) => (
    <MovementSummary
      title={entry.description?.trim() || null}
      fallbackTitle={t(`list.fallbackTitle.${entry.type ?? 'Payroll'}`)}
      date={entry.date}
      showDate={showDate}
      badges={
        entry.source === 'Gmail' && (
          <GmailSourceBadge
            label={entry.institutionName ?? t('list.gmailSource')}
          />
        )
      }
    />
  )

  const renderCategory = (entry: SalaryEntry) =>
    entry.type === 'Extra' && entry.budgetCategory ? (
      <CategoryBadge
        category={entry.budgetCategory}
        label={t(`categories.${entry.budgetCategory}`)}
      />
    ) : (
      <Text as="span" color="gray.500" fontSize="sm">
        {t('list.autoDistributed')}
      </Text>
    )

  const type = watch('type')
  const distributeAutomatically = watch('distributeAutomatically')
  const isExtra = type === 'Extra'

  const formDrawer = useDisclosure()
  const amountInputRef = useRef<HTMLInputElement | null>(null)

  const openCreate = () => {
    setEditingId(null)
    // Fecha de hoy calculada al abrir, no al cargar el módulo: la página
    // puede quedar abierta de un día para otro.
    reset({ ...emptyForm, date: getTodayLocalDate() })
    formDrawer.onOpen()
  }

  const startEdit = (entry: SalaryEntry) => {
    setEditingId(entry.id)
    reset({
      amount: entry.amount,
      date: entry.date.slice(0, 10),
      type: entry.type,
      budgetCategory: entry.budgetCategory ?? '',
      distributeAutomatically: entry.distributeAutomatically ?? false,
      description: entry.description ?? ''
    })
    formDrawer.onOpen()
  }

  const closeForm = () => {
    formDrawer.onClose()
    setEditingId(null)
  }

  const onSubmit = async (data: SalaryForm) => {
    setIsLoading(true)
    try {
      const basePayload = {
        amount: Number(data.amount),
        date: data.date,
        type: data.type,
        description: data.description?.trim() ?? ''
      }
      // budgetCategory/distributeAutomatically solo aplican (y solo se
      // aceptan) cuando type === 'Extra'; el backend rechaza la request con
      // 400 si vienen presentes en un Payroll, así que ni siquiera se
      // incluyen las keys en ese caso.
      const payload: SalaryData =
        data.type === 'Extra'
          ? {
              ...basePayload,
              distributeAutomatically: !!data.distributeAutomatically,
              ...(data.budgetCategory && !data.distributeAutomatically
                ? { budgetCategory: data.budgetCategory }
                : {})
            }
          : basePayload

      const headers = { Authorization: `Bearer ${session?.accessToken}` }
      if (editingId)
        await localApiService.request({
          endPoint: `/proxy/update-salary?id=${editingId}`,
          method: HttpMethod.PATCH,
          data: payload,
          headers
        })
      else
        await localApiService.request({
          endPoint: '/proxy/create-salary',
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
      await refreshIncome()
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

  const onConfirmPendingSalary = async (id: number) => {
    const incomeCategory = pendingCategory[id]
    if (!incomeCategory) return

    setConfirmingId(id)
    try {
      await localApiService.request({
        endPoint: `/proxy/update-salary?id=${id}`,
        method: HttpMethod.PATCH,
        data: { incomeCategory },
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      })
      toast({
        title: t('toast.success.title'),
        description: t('toast.success.description'),
        status: 'success',
        isClosable: true
      })
      await refreshIncome()
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
          formId="income-form"
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
                  maxLength={255}
                  placeholder={t('form.descriptionPlaceholder')}
                />
              )}
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t('form.labelType')}</FormLabel>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select {...field}>
                  <option value="Payroll">{t('types.Payroll')}</option>
                  <option value="Extra">{t('types.Extra')}</option>
                </Select>
              )}
            />
          </FormControl>

          {isExtra && (
            <>
              <FormControl>
                <FormLabel>{t('form.labelBudgetCategory')}</FormLabel>
                <Controller
                  name="budgetCategory"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} isDisabled={!!distributeAutomatically}>
                      <option value="">
                        {t('form.budgetCategoryPlaceholder')}
                      </option>
                      <option value="Necesidad">
                        {t('categories.Necesidad')}
                      </option>
                      <option value="Deseo">{t('categories.Deseo')}</option>
                      <option value="Ahorro">{t('categories.Ahorro')}</option>
                    </Select>
                  )}
                />
                <FormHelperText>
                  {distributeAutomatically
                    ? t('form.budgetCategoryDisabledHelper')
                    : t('form.budgetCategoryHelper')}
                </FormHelperText>
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <Controller
                  name="distributeAutomatically"
                  control={control}
                  render={({ field: { value, onChange, ...field } }) => (
                    <Checkbox
                      {...field}
                      isChecked={!!value}
                      onChange={e => onChange(e.target.checked)}
                    >
                      {t('form.labelDistributeAutomatically')}
                    </Checkbox>
                  )}
                />
              </FormControl>
            </>
          )}
        </MovementFormDrawer>

        {pendingSalary.length > 0 && (
          <Box
            bg={pendingReviewBg}
            borderWidth="1px"
            borderColor={pendingReviewBorderColor}
            borderRadius="md"
            p={4}
          >
            <Heading size="sm" mb={1}>
              {t('pendingReview.title', { count: pendingSalary.length })}
            </Heading>
            <Text fontSize="sm" color={pendingReviewDescriptionColor} mb={4}>
              {t('pendingReview.description')}
            </Text>
            <Stack spacing={3}>
              {pendingSalary.map(entry => {
                const selected = pendingCategory[entry.id] ?? ''
                return (
                  <Card
                    key={entry.id}
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
                            {renderSummary(entry)}
                            <Text fontWeight="semibold" whiteSpace="nowrap">
                              {formatAmount(entry.amount)}
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
                                [entry.id]: e.target.value as IncomeCategory
                              }))
                            }
                          >
                            {INCOME_CATEGORIES.map(category => (
                              <option key={category} value={category}>
                                {t(`incomeCategoryLabels.${category}`)}
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
                            isLoading={confirmingId === entry.id}
                            onClick={() => onConfirmPendingSalary(entry.id)}
                          >
                            {t('pendingReview.confirm')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(entry)}
                          >
                            {t('list.actions.edit')}
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
                          label: t('list.stats.income'),
                          value: formatAmount(selectedPeriod.income)
                        }
                      ]
                    : []
                }
                filters={filters}
                searchInput={searchInput}
                onSearchInputChange={setSearchInput}
                onFiltersChange={setFilters}
                isReloading={isReloading}
                groupsLabel={t('form.labelType')}
                groupOptions={INCOME_TYPES.map(type => ({
                  value: type,
                  label: t(`incomeCategoryLabels.${type}`)
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
                shown={visibleSalary.length}
                total={salary.length}
                isFiltering={hasActiveMovementFilters(filters)}
                onClear={clearFilters}
                emptyPeriodText={t('list.emptyPeriod')}
              />
              {visibleSalary.length > 0 && (
                <MovementDayList
                  items={visibleSalary}
                  getKey={entry => entry.id}
                  getDate={entry => entry.date}
                  getAmount={entry => entry.amount}
                  resetKey={JSON.stringify([period, filters])}
                  columnCount={5}
                  tableHead={
                    <Tr>
                      <Th>{t('list.columnConcept')}</Th>
                      <Th>{t('form.labelType')}</Th>
                      <Th>{t('list.columnCategory')}</Th>
                      <Th isNumeric>{t('form.labelAmount')}</Th>
                      <Th>
                        <VisuallyHidden>
                          {t('list.columnActions')}
                        </VisuallyHidden>
                      </Th>
                    </Tr>
                  }
                  renderTableRow={entry => (
                    <Tr key={entry.id}>
                      <Td maxW="sm" whiteSpace="normal">
                        {renderSummary(entry, { showDate: false })}
                      </Td>
                      <Td>{t(`types.${entry.type as IncomeType}`)}</Td>
                      <Td>{renderCategory(entry)}</Td>
                      <Td isNumeric fontWeight="semibold">
                        {formatAmount(entry.amount)}
                      </Td>
                      <Td>
                        <IconButton
                          aria-label={t('list.actions.edit')}
                          icon={<MdEdit />}
                          size="sm"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={() => startEdit(entry)}
                        />
                      </Td>
                    </Tr>
                  )}
                  renderCard={entry => (
                    <Card key={entry.id} variant="outline">
                      <CardBody>
                        <Stack spacing={2}>
                          <Flex
                            justify="space-between"
                            align="flex-start"
                            gap={3}
                          >
                            {renderSummary(entry, { showDate: false })}
                            <Text fontWeight="semibold" whiteSpace="nowrap">
                              {formatAmount(entry.amount)}
                            </Text>
                          </Flex>

                          <Divider />

                          <Flex justify="space-between" align="center" gap={2}>
                            <Flex align="center" gap={2} wrap="wrap">
                              <Text fontSize="sm">
                                {t(`types.${entry.type as IncomeType}`)}
                              </Text>
                              {renderCategory(entry)}
                            </Flex>
                            <IconButton
                              aria-label={t('list.actions.edit')}
                              icon={<MdEdit />}
                              boxSize="44px"
                              minW="44px"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => startEdit(entry)}
                            />
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
      'entries'
    ]))
  }
})
