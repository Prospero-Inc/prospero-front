import { Heading } from '@chakra-ui/react'
import React from 'react'

import { GoalStepper } from './CustomProgressBar'

export const GoalsSteps = () => {
  return (
    <>
      <Heading fontWeight={800} color={'grey'} my={10}>
        Meta: $500.00
      </Heading>
      <GoalStepper />
    </>
  )
}
