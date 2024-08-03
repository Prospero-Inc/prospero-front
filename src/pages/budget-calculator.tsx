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
  Stack
} from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
const index = () => {
  const { t } = useTranslation('budgetCalculator')
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
                <Input
                  type="number"
                  placeholder="525"
                  size={'lg'}
                  fontWeight={'bold'}
                />
              </FormControl>
            </Box>
            <Button colorScheme="primary" size={'xl'} w="full">
              {t('buttonCalculate')}
            </Button>
          </Stack>
          <Stack my={'2rem'}>
            <BudgetCard
              heading={t('fiftyCard.heading')}
              body={t('fiftyCard.body')}
              amount={262.5}
            />
            <BudgetCard
              heading={t('thirtyCard.heading')}
              body={t('thirtyCard.body')}
              amount={100}
            />

            <BudgetCard
              heading={t('twentyCard.heading')}
              body={t('twentyCard.body')}
              amount={50}
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
