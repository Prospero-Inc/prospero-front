import { ProsperoLayout } from '@/components/layouts'
import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
import { getSalaryDetails } from '@/services/salary'
import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react'
import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

interface SalaryEntry {
  amount: number
  month: string
  year: number
  distribution?: {
    fixedExpenses: number
    variableExpenses: number
    savings: number
  }
}

interface EntriesProps {
  salary: SalaryEntry[]
}

export default function EntriesPage({ salary }: EntriesProps) {
  const { t } = useTranslation('entries')
  const router = useRouter()
  const toast = useToast()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const { control, handleSubmit, reset } = useForm<{ amount: number }>({
    defaultValues: { amount: 0 }
  })

  const onSubmit = async ({ amount }: { amount: number }) => {
    setIsLoading(true)
    try {
      await localApiService.request({
        endPoint: '/proxy/create-salary',
        method: HttpMethod.POST,
        data: { amount: Number(amount) },
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      })
      toast({
        title: t('toast.success.title'),
        description: t('toast.success.description'),
        status: 'success',
        isClosable: true
      })
      reset({ amount: 0 })
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
      <Stack spacing={6} maxW="lg">
        <Stack as="form" onSubmit={handleSubmit(onSubmit)} spacing={4}>
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
          <Button colorScheme="primary" type="submit" isLoading={isLoading}>
            {t('form.submit')}
          </Button>
        </Stack>

        <Box>
          <Heading size="md" mb={3}>
            {t('list.title')}
          </Heading>
          {salary.length === 0 && <Text>{t('list.empty')}</Text>}
          <Stack spacing={3}>
            {salary.map((entry, index) => (
              <Card key={index}>
                <CardBody>
                  <Text fontWeight="bold">
                    {t('list.amount')}: ${entry.amount.toFixed(2)}
                  </Text>
                  <Text color="GrayText">
                    {entry.month} {entry.year}
                  </Text>
                  {entry.distribution && (
                    <Text fontSize="sm" color="GrayText">
                      {t('list.distribution')}: $
                      {entry.distribution.fixedExpenses.toFixed(2)} / $
                      {entry.distribution.variableExpenses.toFixed(2)} / $
                      {entry.distribution.savings.toFixed(2)}
                    </Text>
                  )}
                </CardBody>
              </Card>
            ))}
          </Stack>
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
      const details = (await getSalaryDetails(null, {
        authorization: `Bearer ${session.accessToken}`,
        lang: locale
      })) as { salary: SalaryEntry[] }
      salary = details?.salary ?? []
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
