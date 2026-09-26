import { ProsperoLayout } from '@/components/layouts'
import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
import { getSalaryList, IncomeType, SalaryData } from '@/services/salary'
import {
  Badge,
  Box,
  Button,
  Checkbox,
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
  useToast
} from '@chakra-ui/react'
import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { MdEdit } from 'react-icons/md'

interface SalaryEntry extends SalaryData {
  id: number
}

interface EntriesProps {
  salary: SalaryEntry[]
}

const emptyForm: SalaryData = {
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
  type: 'Payroll',
  budgetCategory: '',
  distributeAutomatically: false
}

export default function EntriesPage({ salary }: EntriesProps) {
  const { t } = useTranslation('entries')
  const router = useRouter()
  const toast = useToast()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const { control, handleSubmit, reset, watch } = useForm<SalaryData>({
    defaultValues: emptyForm
  })

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

        <Box>
          <Heading size="md" mb={3}>
            {t('list.title')}
          </Heading>
          {salary.length === 0 ? (
            <Text>{t('list.empty')}</Text>
          ) : (
            <TableContainer>
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
                          onClick={() => startEdit(entry)}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
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
  let salary: SalaryEntry[] = []

  if (session?.accessToken)
    try {
      salary = (await getSalaryList(null, {
        authorization: `Bearer ${session.accessToken}`,
        lang: locale
      })) as SalaryEntry[]
    } catch (error) {
      salary = []
    }

  return {
    props: {
      ...(await serverSideTranslations(locale as string, [
        'common',
        'sidebar',
        'mobileNav',
        'entries'
      ])),
      salary
    }
  }
}
