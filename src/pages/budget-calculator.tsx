import { ProsperoLayout } from '@/components/layouts'
import { Box, Button, Card, CardBody, Container, FormControl, FormLabel, Heading, Input, Stack, Text } from '@chakra-ui/react'
import React from 'react'
import * as budgeCalculator from '@/languages/es/budgeCalculator.json'
const index = () => {
  return (
    <ProsperoLayout title='Budge Calculator' pageDescription='Budge calculator is a calculator of distributions your salary'>
      <Container>
        <Stack>
          <Box
            border={"1px"}
            borderColor={"primary.500"}
            borderRadius="md"
            p={4}
            textAlign={'center'}
            mb="1.75rem"
          >

            <FormControl textAlign={'center'}>
              <FormLabel>{budgeCalculator.labelSalary}</FormLabel>
              <Input type="number" placeholder='525' size={"lg"} fontWeight={'bold'} />
            </FormControl>
          </Box>
          <Button colorScheme='primary' size={"xl"} w="full">

            {budgeCalculator.buttonCalculate}
          </Button>
        </Stack>

        <Stack my={'3rem'}>
          <Card>
            <CardBody>
              <Heading as={'h1'} size={"md"}>{budgeCalculator.fiftyCard.heading}</Heading>
              <Text mb={'1.5rem'} mt="0.5rem">{budgeCalculator.fiftyCard.body}</Text>

              <Heading as="h2" textAlign={'center'} >
                $262.5
              </Heading>
            </CardBody>
          </Card>


        </Stack>




      </Container>
    </ProsperoLayout >
  )
}

export default index
