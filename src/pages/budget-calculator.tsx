import { ProsperoLayout } from '@/components/layouts'
import { MotionLi } from '@/components/ui/MotionLi'
import { MotionUl } from '@/components/ui/MotionUl'
import * as budgeCalculator from '@/languages/es/budgeCalculator.json'
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
const index = () => {
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
                <FormLabel>{budgeCalculator.labelSalary}</FormLabel>
                <Input
                  type="number"
                  placeholder="525"
                  size={'lg'}
                  fontWeight={'bold'}
                />
              </FormControl>
            </Box>
            <Button colorScheme="primary" size={'xl'} w="full">
              {budgeCalculator.buttonCalculate}
            </Button>
          </Stack>
          <Stack my={'2rem'}>
            <MotionLi>
              <Card mb="1rem">
                <CardBody>
                  <Heading as={'h1'} size={'md'}>
                    {budgeCalculator.fiftyCard.heading}
                  </Heading>
                  <Text mb={'1.5rem'} size="sm" mt="0.5rem">
                    {budgeCalculator.fiftyCard.body}
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
                    {budgeCalculator.thirty.heading}
                  </Heading>
                  <Text mb={'1.5rem'} size="sm" mt="0.5rem">
                    {budgeCalculator.thirty.body}
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
                    {budgeCalculator.twenty.heading}
                  </Heading>
                  <Text mb={'1.5rem'} size={'sm'} mt="0.5rem">
                    {budgeCalculator.twenty.body}
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

export default index
