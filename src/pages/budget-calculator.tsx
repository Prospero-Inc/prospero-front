import { ProsperoLayout } from '@/components/layouts'
import { MotionUl } from '@/components/ui/MotionUl'
import { BudgetCard } from '@/components/views/budgetCalculator'
// import * as budgeCalculator from '@/languages/es/budgeCalculator.json'
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text
} from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

const index = () => {
  const { t } = useTranslation('budgetCalculator')
  const [amounts, setAmounts] = useState({
    fifty: 0,
    thirty: 0,
    twenty: 0
  })
  const {
    handleSubmit,
    formState: { errors },
    control
  } = useForm({
    defaultValues: {
      salary: 0
    }
  })

  const onSubmit = (data: { salary: number }) => {
    const salary = data.salary
    setAmounts({
      fifty: salary * 0.5,
      thirty: salary * 0.3,
      twenty: salary * 0.2
    })
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
