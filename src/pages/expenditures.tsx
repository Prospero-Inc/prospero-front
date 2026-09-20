import { ProsperoLayout } from '@/components/layouts'
import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
import { getTransactions, TransactionData } from '@/services/transactions'
import {
  Box,
  Button,
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
import { MdDelete, MdEdit } from 'react-icons/md'

interface Transaction extends TransactionData {
  id: number
}

interface ExpendituresProps {
  transactions: Transaction[]
}

const emptyForm: TransactionData = {
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
  category: 'Necesidad',
  description: '',
  periodOverride: ''
}

export default function ExpendituresPage({ transactions }: ExpendituresProps) {
  const { t } = useTranslation('expenditures')
  const router = useRouter()
  const toast = useToast()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const { control, handleSubmit, reset } = useForm<TransactionData>({
    defaultValues: emptyForm
  })

  const startEdit = (transaction: Transaction) => {
    setEditingId(transaction.id)
    reset({
      amount: transaction.amount,
      date: transaction.date.slice(0, 10),
      category: transaction.category,
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

        <Box>
          <Heading size="md" mb={3}>
            {t('list.title')}
          </Heading>
          {transactions.length === 0 ? (
            <Text>{t('list.empty')}</Text>
          ) : (
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
                    <Td>{t(`categories.${transaction.category}`)}</Td>
                    <Td isNumeric>${transaction.amount.toFixed(2)}</Td>
                    <Td>
                      <IconButton
                        aria-label={t('list.actions.edit')}
                        icon={<MdEdit />}
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(transaction)}
                        mr={2}
                      />
                      <IconButton
                        aria-label={t('list.actions.delete')}
                        icon={<MdDelete />}
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(transaction.id)}
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
  let transactions: Transaction[] = []

  if (session?.accessToken)
    try {
      transactions = (await getTransactions(
        {},
        { authorization: `Bearer ${session.accessToken}`, lang: locale }
      )) as Transaction[]
    } catch (error) {
      transactions = []
    }

  return {
    props: {
      ...(await serverSideTranslations(locale as string, [
        'common',
        'sidebar',
        'mobileNav',
        'expenditures'
      ])),
      transactions
    }
  }
}
