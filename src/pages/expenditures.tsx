import { ProsperoLayout } from '@/components/layouts'
import {
  FilterResults,
  MovementFiltersBar
} from '@/components/ui/MovementFiltersBar'
import {
  CategoryBadge,
  GmailSourceBadge,
  MovementSummary,
  useMovementFormatters
} from '@/components/ui/MovementSummary'
import { HttpMethod } from '@/enums'
import { useMovementFilters } from '@/hooks/useMovementFilters'
import { getTodayLocalDate, getValidSession, localApiService } from '@/lib'
import { HttpError } from '@/lib/apiService'
import {
  hasActiveMovementFilters,
  matchesMovementFilters
} from '@/lib/movementFilters'
import {
  getPeriods,
  getPeriodTransactions,
  PeriodSummary
} from '@/services/periods'
import {
  BudgetCategory,
  getTransactions,
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
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
  VisuallyHidden
} from '@chakra-ui/react'
import { GetServerSideProps } from 'next'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { MdDelete, MdEdit } from 'react-icons/md'

type Transaction = TransactionListItem

const BUDGET_CATEGORIES: BudgetCategory[] = ['Necesidad', 'Deseo', 'Ahorro']

interface ExpendituresProps {
  /** Filas del período seleccionado, sin las pendientes de revisión. */
  transactions: Transaction[]
  /** Pendientes de revisión de cualquier período. */
  pendingTransactions: Transaction[]
  periods: PeriodSummary[]
}

const emptyForm: TransactionData = {
  amount: 0,
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

export default function ExpendituresPage({
  transactions,
  pendingTransactions,
  periods
}: ExpendituresProps) {
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
  const { control, handleSubmit, reset } = useForm<TransactionData>({
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
  const {
    filters,
    period,
    searchInput,
    setSearchInput,
    setFilters,
    clearFilters,
    setPeriod
  } = useMovementFilters(BUDGET_CATEGORIES)

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
    { withDuplicateBadge }: { withDuplicateBadge: boolean }
  ) => (
    <MovementSummary
      title={
        transaction.description?.trim() || transaction.fixedExpenseName || null
      }
      fallbackTitle={t('list.noDescription')}
      date={transaction.date}
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

  const startEdit = (transaction: Transaction) => {
    setEditingId(transaction.id)
    reset({
      amount: transaction.amount,
      date: transaction.date.slice(0, 10),
      category: transaction.category ?? 'Necesidad',
      description: transaction.description ?? '',
      periodOverride: transaction.periodOverride ?? ''
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    reset(emptyForm)
  }

  const onSubmit = async (data: TransactionData) => {
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
      cancelEdit()
      router.replace(router.asPath)
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
      router.replace(router.asPath)
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
      router.replace(router.asPath)
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
      router.replace(router.asPath)
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
      router.replace(router.asPath)
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

  return (
    <ProsperoLayout title={t('title')} pageDescription={t('title')}>
      <Stack spacing={6}>
        <Stack
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          spacing={4}
          maxW="lg"
        >
          <FormControl>
            <FormLabel>{t('form.labelAmount')}</FormLabel>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <Input {...field} type="number" step="0.01" min={0} />
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
          <Stack direction="row">
            <Button colorScheme="primary" type="submit" isLoading={isLoading}>
              {editingId ? t('form.submitEdit') : t('form.submit')}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={cancelEdit}>
                {t('form.cancel')}
              </Button>
            )}
          </Stack>
        </Stack>

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
                groupsLabel={t('form.labelCategory')}
                groupOptions={BUDGET_CATEGORIES.map(category => ({
                  value: category,
                  label: t(`categories.${category}`)
                }))}
              />
            </Box>
          )}
          <FilterResults
            shown={visibleTransactions.length}
            total={transactions.length}
            isFiltering={hasActiveMovementFilters(filters)}
            onClear={clearFilters}
            emptyPeriodText={t('list.emptyPeriod')}
          />
          {visibleTransactions.length > 0 && (
            <>
              {/* Desktop/tablet: table with horizontal scroll fallback */}
              <TableContainer display={{ base: 'none', md: 'block' }}>
                <Table variant="simple" size="sm">
                  <Thead>
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
                  </Thead>
                  <Tbody>
                    {visibleTransactions.map(transaction => (
                      <Tr key={transaction.id}>
                        <Td maxW="sm" whiteSpace="normal">
                          {renderSummary(transaction, {
                            withDuplicateBadge: true
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
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>

              {/* Mobile: stacked cards, same data/handlers as the table above */}
              <Stack spacing={3} display={{ base: 'flex', md: 'none' }}>
                {visibleTransactions.map(transaction => (
                  <Card key={transaction.id} variant="outline">
                    <CardBody>
                      <Stack spacing={2}>
                        <Flex
                          justify="space-between"
                          align="flex-start"
                          gap={3}
                        >
                          {renderSummary(transaction, {
                            withDuplicateBadge: true
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
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => startEdit(transaction)}
                            />
                            <IconButton
                              aria-label={t('list.actions.delete')}
                              icon={<MdDelete />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => onDelete(transaction.id)}
                            />
                          </Stack>
                        </Flex>
                      </Stack>
                    </CardBody>
                  </Card>
                ))}
              </Stack>
            </>
          )}
        </Box>
      </Stack>
    </ProsperoLayout>
  )
}

const PENDING_STATUSES = ['Detected', 'PendingReview']

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  locale,
  defaultLocale,
  query
}) => {
  const { session, redirect } = await getValidSession(req, res)
  if (redirect) return redirect

  const period = typeof query.period === 'string' ? query.period : undefined
  let transactions: Transaction[] = []
  let pendingTransactions: Transaction[] = []
  let periods: PeriodSummary[] = []

  if (session?.accessToken) {
    const params = {
      authorization: `Bearer ${session.accessToken}`,
      lang: locale
    }
    try {
      const [periodTransactions, pending, allPeriods] = await Promise.all([
        getPeriodTransactions(period, params),
        getTransactions(
          { reviewStatus: PENDING_STATUSES.join(',') },
          params
        ) as Promise<Transaction[]>,
        getPeriods(null, params)
      ])

      // Los pendientes se muestran todos arriba, sin importar el período,
      // así que se sacan de la lista del período para no duplicarlos.
      transactions = periodTransactions.filter(
        transaction => !PENDING_STATUSES.includes(transaction.reviewStatus)
      )
      pendingTransactions = pending
      periods = allPeriods
    } catch (error) {
      // Link a un período que ya no existe (p. ej. se borró su nómina):
      // volver al período actual en vez de mostrar la vista vacía.
      if (period && error instanceof HttpError && error.status === 404)
        return {
          redirect: {
            destination: `${
              locale && locale !== defaultLocale ? `/${locale}` : ''
            }/expenditures`,
            permanent: false
          }
        }
    }
  }

  return {
    props: {
      ...(await serverSideTranslations(locale as string, [
        'common',
        'sidebar',
        'mobileNav',
        'expenditures'
      ])),
      transactions,
      pendingTransactions,
      periods
    }
  }
}
