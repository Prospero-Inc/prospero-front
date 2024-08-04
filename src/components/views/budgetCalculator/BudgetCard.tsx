import { MotionLi } from '@/components/ui/MotionLi'
import { Card, CardBody, Heading, Text } from '@chakra-ui/react'
import React from 'react'

interface Props {
  heading: string
  body: string
  amount: number
}
export const BudgetCard = ({ amount, body, heading }: Props) => {
  return (
    <MotionLi key={amount}>
      <Card mb="1rem">
        <CardBody>
          <Heading as={'h1'} size={'md'}>
            {heading}
          </Heading>
          <Text mb={'1.5rem'} size="sm" mt="0.5rem">
            {body}
          </Text>

          <Heading as="h2" size={'lg'} textAlign={'center'}>
            ${amount.toFixed(4)}
          </Heading>
        </CardBody>
      </Card>
    </MotionLi>
  )
}
