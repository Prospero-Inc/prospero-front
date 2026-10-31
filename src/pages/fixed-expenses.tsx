import { ProsperoLayout } from '@/components/layouts'
import { MovementFormDrawer } from '@/components/ui/MovementFormDrawer'
import {
  CategoryBadge,
  useMovementFormatters
} from '@/components/ui/MovementSummary'
import { getPageSkeleton } from '@/components/ui/PageSkeletons'
import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
import { HttpError } from '@/lib/apiService'
import {
  DueStatus,
  dueDateFromDay,
  dueDayOf,
  resolveDueStatus
} from '@/lib/fixedExpenseDue'
import { useApi, useRevalidateApi, useUpdateApiCache } from '@/lib/useApi'
import { FixedExpenseData } from '@/services/fixedExpenses'
import { BudgetCategory } from '@/services/transactions'
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
  Icon,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
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
import {
  MdAdd,
  MdCheckCircle,
  MdDelete,
  MdEdit,
  MdEventRepeat
} from 'react-icons/md'

interface FixedExpense extends FixedExpenseData {
  id: number
  paidThisCycle: boolean
}

/** El formulario pide el día del mes, no una fecha: ver `fixedExpenseDue`. */
// The amount starts empty, not 0: a prefilled 0 had to be deleted first.
type FixedExpenseForm = Omit<FixedExpenseData, 'dueDate' | 'amount'> & {
  dueDay: string
  amount: number | ''
}

const emptyForm: FixedExpenseForm = {
  amount: '',
  name: '',
  budgetCategory: 'Necesidad',
  dueDay: '1',
  reminder: false,
  description: ''
}

const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, index) => index + 1)

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
  const fixedExpensesQuery = useApi<FixedExpense[]>('fixed-expenses')
  const fixedExpenses = fixedExpensesQuery.data ?? []
  const revalidateApi = useRevalidateApi()
  const updateApiCache = useUpdateApiCache()
  /** Paying one creates a transaction, so periods and movements change too. */
  const refreshFixedExpenses = () =>
    revalidateApi('fixed-expenses', 'periods', 'transactions')
  const toast = useToast()
  const { data: session } = useSession()
  const { formatAmount } = useMovementFormatters()
  const today = useToday()
  const mutedColor = useColorModeValue('gray.600', 'gray.400')
  const summaryBg = useColorModeValue('gray.50', 'gray.700')
  const [isLoading, setIsLoading] = useState(false)
  const [payingId, setPayingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const formDrawer = useDisclosure()
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const { control, handleSubmit, reset } = useForm<FixedExpenseForm>({
    defaultValues: emptyForm
  })

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
    reset(emptyForm)
    formDrawer.onOpen()
  }

  const startEdit = (fixedExpense: FixedExpense) => {
    setEditingId(fixedExpense.id)
    reset({
      amount: fixedExpense.amount,
      name: fixedExpense.name,
      budgetCategory: fixedExpense.budgetCategory,
      dueDay: String(dueDayOf(fixedExpense.dueDate)),
      reminder: fixedExpense.reminder,
      description: fixedExpense.description ?? ''
    })
    formDrawer.onOpen()
  }

  const closeForm = () => {
    formDrawer.onClose()
    setEditingId(null)
  }

  const onSubmit = async ({ dueDay, ...data }: FixedExpenseForm) => {
    setIsLoading(true)
    try {
      const payload: FixedExpenseData = {
        ...data,
        amount: Number(data.amount),
        dueDate: dueDateFromDay(Number(dueDay))
      }
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
    if (!window.confirm(t('list.confirmDelete', { name: fixedExpense.name })))
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
        endPoint: `/proxy/pay-fixed-expense?id=${id}`,
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

  /** Texto + color, nunca solo color (WCAG 1.4.1). */
  const renderStatus = (status: DueStatus | null) => {
    if (!status) return null
    switch (status.kind) {
      case 'paid':
        return (
          <Badge
            colorScheme="green"
            display="inline-flex"
            alignItems="center"
            gap={1}
          >
            <Icon as={MdCheckCircle} aria-hidden="true" />
            {t('status.paid')}
          </Badge>
        )
      case 'overdue':
        return (
          <Badge colorScheme="red">
            {t('status.overdue', { day: status.day })}
          </Badge>
        )
      case 'today':
        return <Badge colorScheme="orange">{t('status.today')}</Badge>
      case 'upcoming':
        return (
          <Badge colorScheme="gray" variant="outline">
            {t('status.upcoming', { count: status.daysLeft })}
          </Badge>
        )
    }
  }

  const renderPayButton = (fixedExpense: FixedExpense) =>
    !fixedExpense.paidThisCycle && (
      <Button
        size="sm"
        minH={{ base: '44px', md: '32px' }}
        leftIcon={<MdCheckCircle />}
        colorScheme="green"
        variant="outline"
        isLoading={payingId === fixedExpense.id}
        onClick={() => onPay(fixedExpense.id)}
      >
        {t('list.actions.pay')}
      </Button>
    )

  const renderSummary = (fixedExpense: FixedExpense) => (
    <Box minW={0}>
      <Text fontWeight="semibold" noOfLines={1} title={fixedExpense.name}>
        {fixedExpense.name}
      </Text>
      <Text fontSize="sm" color={mutedColor}>
        {t('list.dueDay', { day: dueDayOf(fixedExpense.dueDate) })}
        {fixedExpense.description ? ` · ${fixedExpense.description}` : ''}
      </Text>
    </Box>
  )

  // First load: the page's skeleton, not its empty states.
  const PageSkeleton = getPageSkeleton(router.pathname)
  if (
    fixedExpensesQuery.data === undefined &&
    !fixedExpensesQuery.error &&
    PageSkeleton
  )
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
          formId="fixed-expense-form"
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isLoading}
          submitLabel={editingId ? t('form.submitEdit') : t('form.submit')}
          cancelLabel={t('form.cancel')}
          initialFocusRef={nameInputRef}
        >
          <FormControl>
            <FormLabel>{t('form.labelName')}</FormLabel>
            <Controller
              name="name"
              control={control}
              render={({ field: { ref, ...field } }) => (
                <Input
                  {...field}
                  ref={element => {
                    ref(element)
                    nameInputRef.current = element
                  }}
                  placeholder={t('form.namePlaceholder')}
                />
              )}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>{t('form.labelAmount')}</FormLabel>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                />
              )}
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t('form.labelBudgetCategory')}</FormLabel>
            <Controller
              name="budgetCategory"
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
            <FormLabel>{t('form.labelDueDate')}</FormLabel>
            <Controller
              name="dueDay"
              control={control}
              render={({ field }) => (
                <Select {...field}>
                  {DAYS_OF_MONTH.map(day => (
                    <option key={day} value={day}>
                      {t('form.dueDayOption', { day })}
                    </option>
                  ))}
                </Select>
              )}
            />
            <FormHelperText>{t('form.dueDayHelper')}</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel>{t('form.labelDescription')}</FormLabel>
            <Controller
              name="description"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </FormControl>
          <FormControl display="flex" alignItems="center">
            <Controller
              name="reminder"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <Checkbox
                  {...field}
                  isChecked={value}
                  onChange={e => onChange(e.target.checked)}
                >
                  {t('form.labelReminder')}
                </Checkbox>
              )}
            />
          </FormControl>
        </MovementFormDrawer>

        <Box>
          <Heading size="md" mb={3}>
            {t('list.title')}
          </Heading>

          {fixedExpenses.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              gap={2}
              py={10}
              textAlign="center"
            >
              <Icon
                as={MdEventRepeat}
                boxSize={8}
                color="gray.400"
                aria-hidden="true"
              />
              <Text fontWeight="semibold">{t('list.empty')}</Text>
              <Text fontSize="sm" color={mutedColor} maxW="sm">
                {t('list.emptyHint')}
              </Text>
            </Flex>
          ) : (
            <>
              <SimpleGrid
                columns={{ base: 2, sm: 3 }}
                spacingX={6}
                spacingY={3}
                bg={summaryBg}
                borderRadius="md"
                p={4}
                mb={4}
              >
                <Stat>
                  <StatLabel color={mutedColor}>{t('summary.total')}</StatLabel>
                  <StatNumber fontSize="xl">{formatAmount(total)}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel color={mutedColor}>
                    {t('summary.paid', {
                      paid: paidCount,
                      total: fixedExpenses.length
                    })}
                  </StatLabel>
                  <StatNumber fontSize="xl">{formatAmount(paid)}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel color={mutedColor}>
                    {t('summary.pending')}
                  </StatLabel>
                  <StatNumber fontSize="xl">
                    {formatAmount(total - paid)}
                  </StatNumber>
                </Stat>
              </SimpleGrid>

              {/* Desktop/tablet */}
              <TableContainer display={{ base: 'none', md: 'block' }}>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>{t('form.labelName')}</Th>
                      <Th>{t('form.labelBudgetCategory')}</Th>
                      <Th>{t('list.columnStatus')}</Th>
                      <Th isNumeric>{t('form.labelAmount')}</Th>
                      <Th>
                        <VisuallyHidden>
                          {t('list.columnActions')}
                        </VisuallyHidden>
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {sorted.map(fixedExpense => (
                      <Tr key={fixedExpense.id}>
                        <Td maxW="xs" whiteSpace="normal">
                          {renderSummary(fixedExpense)}
                        </Td>
                        <Td>
                          <CategoryBadge
                            category={
                              fixedExpense.budgetCategory as BudgetCategory
                            }
                            label={t(
                              `categories.${fixedExpense.budgetCategory}`
                            )}
                          />
                        </Td>
                        <Td>{renderStatus(statusOf(fixedExpense))}</Td>
                        <Td isNumeric fontWeight="semibold">
                          {formatAmount(fixedExpense.amount)}
                        </Td>
                        <Td>
                          <Flex justify="flex-end" align="center" gap={1}>
                            {renderPayButton(fixedExpense)}
                            <IconButton
                              aria-label={t('list.actions.edit')}
                              icon={<MdEdit />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => startEdit(fixedExpense)}
                            />
                            <IconButton
                              aria-label={t('list.actions.delete')}
                              icon={<MdDelete />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => onDelete(fixedExpense)}
                            />
                          </Flex>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>

              {/* Mobile */}
              <Stack spacing={3} display={{ base: 'flex', md: 'none' }}>
                {sorted.map(fixedExpense => (
                  <Card key={fixedExpense.id} variant="outline">
                    <CardBody>
                      <Stack spacing={2}>
                        <Flex
                          justify="space-between"
                          align="flex-start"
                          gap={3}
                        >
                          {renderSummary(fixedExpense)}
                          <Text fontWeight="semibold" whiteSpace="nowrap">
                            {formatAmount(fixedExpense.amount)}
                          </Text>
                        </Flex>
                        <Flex gap={2} wrap="wrap">
                          <CategoryBadge
                            category={
                              fixedExpense.budgetCategory as BudgetCategory
                            }
                            label={t(
                              `categories.${fixedExpense.budgetCategory}`
                            )}
                          />
                          {renderStatus(statusOf(fixedExpense))}
                        </Flex>

                        <Divider />

                        <Flex justify="space-between" align="center" gap={2}>
                          {renderPayButton(fixedExpense) || <span />}
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              aria-label={t('list.actions.edit')}
                              icon={<MdEdit />}
                              boxSize="44px"
                              minW="44px"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => startEdit(fixedExpense)}
                            />
                            <IconButton
                              aria-label={t('list.actions.delete')}
                              icon={<MdDelete />}
                              boxSize="44px"
                              minW="44px"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => onDelete(fixedExpense)}
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
