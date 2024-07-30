import { ProsperoLayout } from '@/components/layouts'
import { MotionLi } from '@/components/ui/MotionLi'
import { MotionUl } from '@/components/ui/MotionUl'
// import * as budgeCalculator from '@/languages/es/budgeCalculator.json'
import {
  Box,
  Button,
  Card,
  CardBody,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text
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
              {t('buttoncalculate')}
            </Button>
          </Stack>
          <Stack my={'2rem'}>
            <MotionLi>
              <Card mb="1rem">
                <CardBody>
                  <Heading as={'h1'} size={'md'}>
                    {t('fiftyCard.heading')}
                  </Heading>
                  <Text mb={'1.5rem'} size="sm" mt="0.5rem">
                    {t('fiftyCard.body')}
                  </Text>

                  <Heading as="h2" size={'lg'} textAlign={'center'}>
                    $262.5
                  </Heading>
                </CardBody>
              </Card>
            </MotionLi>
            <MotionLi>
              <Card mb={'1rem'}>
                <CardBody>
                  <Heading as={'h1'} size={'md'}>
                    {t('thirtyCard.heading')}
                  </Heading>
                  <Text mb={'1.5rem'} size="sm" mt="0.5rem">
                    {t('thirtyCard.body')}
                  </Text>

                  <Heading as="h2" size={'lg'} textAlign={'center'}>
                    $262.5
                  </Heading>
                </CardBody>
              </Card>
            </MotionLi>

            <MotionLi>
              <Card mb={'1rem'}>
                <CardBody>
                  <Heading as={'h1'} size={'md'}>
                    {t('twentyCard.heading')}
                  </Heading>
                  <Text mb={'1.5rem'} size={'sm'} mt="0.5rem">
                    {t('twentyCard.body')}
                  </Text>

                  <Heading as="h2" size={'lg'} textAlign={'center'}>
                    $262.5
                  </Heading>
                </CardBody>
              </Card>
            </MotionLi>
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
