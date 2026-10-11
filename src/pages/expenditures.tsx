import { ProsperoLayout } from '@/components/layouts'
import { HttpMethod } from '@/enums'
import { getTodayLocalDate, getValidSession, localApiService } from '@/lib'
import { HttpError } from '@/lib/apiService'
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
  useToast
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
  transactions: Transaction[]
  pendingTransactions: Transaction[]
}

const emptyForm: TransactionData = {
  amount: 0,
  date: getTodayLocalDate(),
  category: 'Necesidad',
  description: '',
  periodOverride: ''
}

/** Badge + tooltip informativo de "posible duplicado" detectado por Gmail,
 * compartido entre la tabla desktop y las cards mobile. */
const PossibleDuplicateBadge = ({
  duplicate,
  onNotSame,
  isResolving
}: {
  duplicate: NonNullable<Transaction['possibleGmailDuplicate']>
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
          <Text mb={2}>
            {t('tooltip', {
              senderEmail: duplicate.senderEmail,
              processedAt: duplicate.processedAt.slice(0, 10)
            })}
          </Text>
          <Button
            size="xs"
            variant="outline"
            colorScheme="purple"
            isLoading={isResolving}
            onClick={() => onNotSame(duplicate.id)}
          >
            {t('notSameAction')}
          </Button>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

export default function ExpendituresPage({
  transactions,
  pendingTransactions
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
  const { control, handleSubmit, reset } = useForm<TransactionData>({
    defaultValues: emptyForm
  })

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
              render={({ field }) => <Input {...field} />}
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
            bg="orange.50"
            borderWidth="1px"
            borderColor="orange.200"
            borderRadius="md"
            p={4}
          >
            <Heading size="sm" mb={1}>
              {t('pendingReview.title', { count: pendingTransactions.length })}
            </Heading>
            <Text fontSize="sm" color="gray.600" mb={4}>
              {t('pendingReview.description')}
            </Text>
            <Stack spacing={3}>
              {pendingTransactions.map(transaction => {
                const selected = pendingCategory[transaction.id] ?? ''
                return (
                  <Card key={transaction.id} variant="outline" bg="white">
                    <CardBody>
                      <Stack spacing={3}>
                        <Flex
                          justify="space-between"
                          align="center"
                          wrap="wrap"
                          gap={2}
                        >
                          <Stack spacing={0}>
                            <Text fontWeight="bold">
                              {transaction.date.slice(0, 10)}
                            </Text>
                            <Text fontSize="sm">
                              ${transaction.amount.toFixed(2)}
                            </Text>
                          </Stack>
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
          {transactions.length === 0 ? (
            <Text>{t('list.empty')}</Text>
          ) : (
            <>
              {/* Desktop/tablet: table with horizontal scroll fallback */}
              <TableContainer display={{ base: 'none', md: 'block' }}>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>{t('form.labelDate')}</Th>
                      <Th>{t('form.labelCategory')}</Th>
                      <Th isNumeric>{t('form.labelAmount')}</Th>
                      <Th />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {transactions.map(transaction => (
                      <Tr key={transaction.id}>
                        <Td>{transaction.date.slice(0, 10)}</Td>
                        <Td>
                          <Flex align="center" gap={2} wrap="wrap">
                            <Text as="span">
                              {transaction.category
                                ? t(`categories.${transaction.category}`)
                                : ''}
                            </Text>
                            {transaction.possibleGmailDuplicate && (
                              <PossibleDuplicateBadge
                                duplicate={transaction.possibleGmailDuplicate}
                                onNotSame={onNotSameMovement}
                                isResolving={
                                  resolvingDuplicateId ===
                                  transaction.possibleGmailDuplicate.id
                                }
                              />
                            )}
                          </Flex>
                        </Td>
                        <Td isNumeric>${transaction.amount.toFixed(2)}</Td>
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
                {transactions.map(transaction => (
                  <Card key={transaction.id} variant="outline">
                    <CardBody>
                      <Stack spacing={2}>
                        <Flex justify="space-between">
                          <Text fontWeight="bold">
                            {transaction.date.slice(0, 10)}
                          </Text>
                          <Text fontSize="sm" fontWeight="semibold">
                            ${transaction.amount.toFixed(2)}
                          </Text>
                        </Flex>

                        <Flex
                          justify="space-between"
                          align="center"
                          wrap="wrap"
                        >
                          <Text fontSize="sm" color="gray.500">
                            {t('form.labelCategory')}
                          </Text>
                          <Flex align="center" gap={2}>
                            <Text fontSize="sm">
                              {transaction.category
                                ? t(`categories.${transaction.category}`)
                                : ''}
                            </Text>
                            {transaction.possibleGmailDuplicate && (
                              <PossibleDuplicateBadge
                                duplicate={transaction.possibleGmailDuplicate}
                                onNotSame={onNotSameMovement}
                                isResolving={
                                  resolvingDuplicateId ===
                                  transaction.possibleGmailDuplicate.id
                                }
                              />
                            )}
                          </Flex>
                        </Flex>

                        <Divider />

                        <Flex justify="flex-end">
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
  locale
}) => {
  const { session, redirect } = await getValidSession(req, res)
  if (redirect) return redirect

  let transactions: Transaction[] = []
  let pendingTransactions: Transaction[] = []

  if (session?.accessToken)
    try {
      const allTransactions = (await getTransactions(
        {},
        { authorization: `Bearer ${session.accessToken}`, lang: locale }
      )) as Transaction[]

      // Una sola llamada a /transactions: separamos pendientes de revisión
      // del resto en memoria en vez de pedirle al backend el mismo listado
      // dos veces con filtros distintos.
      pendingTransactions = allTransactions.filter(transaction =>
        PENDING_STATUSES.includes(transaction.reviewStatus)
      )
      transactions = allTransactions.filter(
        transaction => !PENDING_STATUSES.includes(transaction.reviewStatus)
      )
    } catch (error) {
      transactions = []
      pendingTransactions = []
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
      pendingTransactions
    }
  }
}
