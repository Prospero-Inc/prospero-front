import { ProsperoLayout } from '@/components/layouts'
import { HttpMethod } from '@/enums'
import { getTodayLocalDate, getValidSession, localApiService } from '@/lib'
import {
  getSalaryList,
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
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast
} from '@chakra-ui/react'
import { GetServerSideProps } from 'next'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { MdEdit } from 'react-icons/md'

type SalaryEntry = SalaryListItem

const INCOME_CATEGORIES: IncomeCategory[] = [
  'Payroll',
  'Extra',
  'Transfer',
  'Reimbursement',
  'Deposit',
  'Other'
]

interface EntriesProps {
  salary: SalaryEntry[]
  pendingSalary: SalaryEntry[]
}

const emptyForm: SalaryData = {
  amount: 0,
  date: getTodayLocalDate(),
  type: 'Payroll',
  budgetCategory: '',
  distributeAutomatically: false
}

export default function EntriesPage({ salary, pendingSalary }: EntriesProps) {
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
  const { control, handleSubmit, reset, watch } = useForm<SalaryData>({
    defaultValues: emptyForm
  })

  const pendingReviewBg = useColorModeValue('orange.50', 'orange.900')
  const pendingReviewBorderColor = useColorModeValue('orange.200', 'orange.600')
  const pendingReviewDescriptionColor = useColorModeValue(
    'gray.600',
    'orange.100'
  )
  const pendingReviewCardBg = useColorModeValue('white', 'gray.700')

  const type = watch('type')
  const distributeAutomatically = watch('distributeAutomatically')
  const isExtra = type === 'Extra'

  const startEdit = (entry: SalaryEntry) => {
    setEditingId(entry.id)
    reset({
      amount: entry.amount,
      date: entry.date.slice(0, 10),
      type: entry.type,
      budgetCategory: entry.budgetCategory ?? '',
      distributeAutomatically: entry.distributeAutomatically ?? false
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    reset(emptyForm)
  }

  const onSubmit = async (data: SalaryData) => {
    setIsLoading(true)
    try {
      const basePayload = {
        amount: Number(data.amount),
        date: data.date,
        type: data.type
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
            <FormLabel>{t('form.labelDate')}</FormLabel>
            <Controller
              name="date"
              control={control}
              render={({ field }) => <Input {...field} type="date" />}
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
                          <Stack spacing={0}>
                            <Text fontWeight="bold">
                              {entry.date.slice(0, 10)}
                            </Text>
                            <Text fontSize="sm">
                              ${entry.amount.toFixed(2)}
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
          {salary.length === 0 ? (
            <Text>{t('list.empty')}</Text>
          ) : (
            <>
              {/* Desktop/tablet: table with horizontal scroll fallback */}
              <TableContainer display={{ base: 'none', md: 'block' }}>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>{t('form.labelDate')}</Th>
                      <Th>{t('form.labelType')}</Th>
                      <Th>{t('list.columnCategory')}</Th>
                      <Th isNumeric>{t('form.labelAmount')}</Th>
                      <Th />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {salary.map(entry => (
                      <Tr key={entry.id}>
                        <Td>{entry.date.slice(0, 10)}</Td>
                        <Td>{t(`types.${entry.type as IncomeType}`)}</Td>
                        <Td>
                          {entry.type === 'Extra' && entry.budgetCategory ? (
                            <Badge colorScheme="purple">
                              {t(`categories.${entry.budgetCategory}`)}
                            </Badge>
                          ) : (
                            <Text as="span" color="gray.500" fontSize="sm">
                              {t('list.autoDistributed')}
                            </Text>
                          )}
                        </Td>
                        <Td isNumeric>${entry.amount.toFixed(2)}</Td>
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
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>

              {/* Mobile: stacked cards, same data/handlers as the table above */}
              <Stack spacing={3} display={{ base: 'flex', md: 'none' }}>
                {salary.map(entry => (
                  <Card key={entry.id} variant="outline">
                    <CardBody>
                      <Stack spacing={2}>
                        <Flex justify="space-between" align="center">
                          <Text fontWeight="bold">
                            {entry.date.slice(0, 10)}
                          </Text>
                          <IconButton
                            aria-label={t('list.actions.edit')}
                            icon={<MdEdit />}
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={() => startEdit(entry)}
                          />
                        </Flex>

                        <Flex justify="space-between">
                          <Text fontSize="sm" color="gray.500">
                            {t('form.labelType')}
                          </Text>
                          <Text fontSize="sm">
                            {t(`types.${entry.type as IncomeType}`)}
                          </Text>
                        </Flex>

                        <Flex justify="space-between" align="center">
                          <Text fontSize="sm" color="gray.500">
                            {t('list.columnCategory')}
                          </Text>
                          {entry.type === 'Extra' && entry.budgetCategory ? (
                            <Badge colorScheme="purple">
                              {t(`categories.${entry.budgetCategory}`)}
                            </Badge>
                          ) : (
                            <Text as="span" color="gray.500" fontSize="sm">
                              {t('list.autoDistributed')}
                            </Text>
                          )}
                        </Flex>

                        <Divider />

                        <Flex justify="space-between">
                          <Text fontSize="sm" color="gray.500">
                            {t('form.labelAmount')}
                          </Text>
                          <Text fontSize="sm" fontWeight="semibold">
                            ${entry.amount.toFixed(2)}
                          </Text>
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

  let salary: SalaryEntry[] = []
  let pendingSalary: SalaryEntry[] = []

  if (session?.accessToken)
    try {
      const allSalary = (await getSalaryList(null, {
        authorization: `Bearer ${session.accessToken}`,
        lang: locale
      })) as SalaryEntry[]

      // Una sola llamada a /salary: separamos pendientes de revisión del
      // resto en memoria en vez de pedirle al backend el mismo listado dos
      // veces con filtros distintos.
      pendingSalary = allSalary.filter(entry =>
        PENDING_STATUSES.includes(entry.status)
      )
      salary = allSalary.filter(
        entry => !PENDING_STATUSES.includes(entry.status)
      )
    } catch (error) {
      salary = []
      pendingSalary = []
    }

  return {
    props: {
      ...(await serverSideTranslations(locale as string, [
        'common',
        'sidebar',
        'mobileNav',
        'entries'
      ])),
      salary,
      pendingSalary
    }
  }
}
