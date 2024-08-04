import { ProsperoLayout } from '@/components/layouts'
import { MotionUl } from '@/components/ui/MotionUl'
import { BudgetCard } from '@/components/views/budgetCalculator'
import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
// import * as budgeCalculator from '@/languages/es/budgeCalculator.json'
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

const index = () => {
  const { t } = useTranslation('budgetCalculator')
  const toast = useToast()
  const [amounts, setAmounts] = useState({
    fifty: 0,
    thirty: 0,
    twenty: 0
  })
  const {
    handleSubmit,
    formState: { errors },
    control
  } = useForm<{ salary: number }>({})

  const onSubmit = async ({ salary }: { salary: number }) => {
    try {
      const response = await localApiService.request({
        endPoint: '/proxy/budget-calculator',
        method: HttpMethod.GET,
        data: salary
      })
      setAmounts({
        fifty: 0,
        thirty: 0,
        twenty: 0
      })
      console.log({ response })
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: 'Error',
          description: error?.message,
          status: 'error',
          duration: 5000,
          isClosable: true
        })
    }
  }
  return (
    <ProsperoLayout
      title="Budge Calculator"
      pageDescription="Budge calculator is a calculator of distributions your salary"
    >
      <Container>
        <MotionUl>
          <Stack>
            <Box
              border={'1px'}
              borderColor={'primary.500'}
              borderRadius="md"
              p={4}
              textAlign={'center'}
              mb="1.75rem"
            >
              <FormControl textAlign={'center'}>
                <FormLabel>{t('labelSalary')}</FormLabel>
                <Controller
                  control={control}
                  name="salary"
                  rules={{
                    required: t('requiredField')
                  }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      placeholder="525"
                      size={'lg'}
                      fontWeight={'bold'}
                    />
                  )}
                />
                {errors.salary && (
                  <Text color="red.500">{errors.salary.message}</Text>
                )}
              </FormControl>
            </Box>
            <Button
              onClick={handleSubmit(onSubmit)}
              colorScheme="primary"
              size={'xl'}
              w="full"
            >
              {t('buttonCalculate')}
            </Button>
          </Stack>
          <Stack my={'2rem'}>
            <BudgetCard
              heading={t('fiftyCard.heading')}
              body={t('fiftyCard.body')}
              amount={amounts.fifty}
            />
            <BudgetCard
              heading={t('thirtyCard.heading')}
              body={t('thirtyCard.body')}
              amount={amounts.thirty}
            />

            <BudgetCard
              heading={t('twentyCard.heading')}
              body={t('twentyCard.body')}
              amount={amounts.twenty}
            />
          </Stack>
        </MotionUl>
      </Container>
    </ProsperoLayout>
  )
}
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale as string, [
        'common',
        'sidebar',
        'mobileNav',
        'budgetCalculator'
      ]))
    }
  }
}
export default index
