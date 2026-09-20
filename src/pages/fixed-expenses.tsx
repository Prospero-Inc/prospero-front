import { ProsperoLayout } from '@/components/layouts'
import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
import { HttpError } from '@/lib/apiService'
import { FixedExpenseData, getFixedExpenses } from '@/services/fixedExpenses'
import {
  Badge,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  Select,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast
} from '@chakra-ui/react'
import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { MdCheckCircle, MdDelete, MdEdit } from 'react-icons/md'

interface FixedExpense extends FixedExpenseData {
  id: number
  paidThisCycle: boolean
}

interface FixedExpensesProps {
  fixedExpenses: FixedExpense[]
}

const emptyForm: FixedExpenseData = {
  amount: 0,
  name: '',
  budgetCategory: 'Necesidad',
  dueDate: new Date().toISOString().slice(0, 10),
  reminder: false,
  description: ''
}

export default function FixedExpensesPage({
  fixedExpenses
}: FixedExpensesProps) {
  const { t } = useTranslation('fixedExpenses')
  const router = useRouter()
  const toast = useToast()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [payingId, setPayingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const { control, handleSubmit, reset } = useForm<FixedExpenseData>({
    defaultValues: emptyForm
  })

  const startEdit = (fixedExpense: FixedExpense) => {
    setEditingId(fixedExpense.id)
    reset({
      amount: fixedExpense.amount,
      name: fixedExpense.name,
      budgetCategory: fixedExpense.budgetCategory,
      dueDate: fixedExpense.dueDate.slice(0, 10),
      reminder: fixedExpense.reminder,
      description: fixedExpense.description ?? ''
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    reset(emptyForm)
  }

  const onSubmit = async (data: FixedExpenseData) => {
    setIsLoading(true)
    try {
      const payload = { ...data, amount: Number(data.amount) }
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
    try {
      await localApiService.request({
        endPoint: `/proxy/delete-fixed-expense?id=${id}`,
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
      router.replace(router.asPath)
    } catch (error) {
      if (error instanceof HttpError && error.status === 409) {
        toast({
          title: t('toast.alreadyPaid.title'),
          description: t('toast.alreadyPaid.description'),
          status: 'warning',
          isClosable: true
        })
        router.replace(router.asPath)
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
            <FormLabel>{t('form.labelName')}</FormLabel>
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input {...field} />}
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
              name="dueDate"
              control={control}
              render={({ field }) => <Input {...field} type="date" />}
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
          <FormControl>
            <FormLabel>{t('form.labelDescription')}</FormLabel>
            <Controller
              name="description"
              control={control}
              render={({ field }) => <Input {...field} />}
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

        <Box>
          <Heading size="md" mb={3}>
            {t('list.title')}
          </Heading>
          {fixedExpenses.length === 0 ? (
            <Text>{t('list.empty')}</Text>
          ) : (
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>{t('form.labelDueDate')}</Th>
                  <Th>{t('form.labelName')}</Th>
                  <Th>{t('form.labelBudgetCategory')}</Th>
                  <Th isNumeric>{t('form.labelAmount')}</Th>
                  <Th />
                  <Th />
                </Tr>
              </Thead>
              <Tbody>
                {fixedExpenses.map(fixedExpense => (
                  <Tr key={fixedExpense.id}>
                    <Td>{fixedExpense.dueDate.slice(0, 10)}</Td>
                    <Td>{fixedExpense.name}</Td>
                    <Td>{t(`categories.${fixedExpense.budgetCategory}`)}</Td>
                    <Td isNumeric>${fixedExpense.amount.toFixed(2)}</Td>
                    <Td>
                      {fixedExpense.paidThisCycle ? (
                        <Badge colorScheme="green">{t('list.paid')}</Badge>
                      ) : (
                        <Button
                          size="sm"
                          leftIcon={<MdCheckCircle />}
                          isLoading={payingId === fixedExpense.id}
                          onClick={() => onPay(fixedExpense.id)}
                        >
                          {t('list.actions.pay')}
                        </Button>
                      )}
                    </Td>
                    <Td>
                      <IconButton
                        aria-label={t('list.actions.edit')}
                        icon={<MdEdit />}
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(fixedExpense)}
                        mr={2}
                      />
                      <IconButton
                        aria-label={t('list.actions.delete')}
                        icon={<MdDelete />}
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(fixedExpense.id)}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </Stack>
    </ProsperoLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  locale
}) => {
  const session = await getSession({ req })
  let fixedExpenses: FixedExpense[] = []

  if (session?.accessToken)
    try {
      fixedExpenses = (await getFixedExpenses(
        {},
        { authorization: `Bearer ${session.accessToken}`, lang: locale }
      )) as FixedExpense[]
    } catch (error) {
      fixedExpenses = []
    }

  return {
    props: {
      ...(await serverSideTranslations(locale as string, [
        'common',
        'sidebar',
        'mobileNav',
        'fixedExpenses'
      ])),
      fixedExpenses
    }
  }
}
