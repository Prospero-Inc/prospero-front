import {
  Box,
  Step,
  StepIndicator,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps
} from '@chakra-ui/react'
import React from 'react'

import { GoalFlag } from '../icons/GoalFlag'

export const GenericStep = () => {
  const steps = [
    { title: '20%', description: 'Contact Info' },
    { title: '40%', description: 'Date & Time' },
    { title: '60%', description: 'Select Rooms' },
    { title: '80%', description: 'Select Rooms' },
    { title: '100%', description: 'Select Rooms' }
  ]

  const { activeStep } = useSteps({
    index: 1,
    count: steps.length
  })

  return (
    <Stepper index={activeStep}>
      {steps.map((step, index) => (
        <Step key={index}>
          <StepIndicator>
            <StepStatus complete={<GoalFlag />} incomplete={null} />
          </StepIndicator>

          <Box flexShrink="1">
            <StepTitle>{step.title}</StepTitle>
          </Box>

          <StepSeparator />
        </Step>
      ))}
    </Stepper>
  )
}
