import {
  Box,
  Icon,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps
} from '@chakra-ui/react'

import { TotalMoneyIcon } from '../icons/TotalMoneyIcon'

const steps = [
  { title: '20%', description: '' },
  { title: '40%', description: '' },
  { title: '60%', description: '' },
  { title: '80%', description: '' },
  { title: '100%', description: '' }
]

export function GoalStepper() {
  const { activeStep } = useSteps({
    index: 1,
    count: steps.length
  })

  return (
    <Stepper colorScheme="primary" index={activeStep} size={['sm', 'lg']}>
      {steps.map((step, index) => (
        <Step key={index}>
          <StepIndicator>
            <StepStatus
              complete={<StepIcon />}
              incomplete={<StepNumber />}
              active={<Icon as={TotalMoneyIcon} />}
            />
          </StepIndicator>

          <Box flexShrink="0">
            <StepTitle>{step.title}</StepTitle>
            <StepDescription>{step.description}</StepDescription>
          </Box>

          <StepSeparator />
        </Step>
      ))}
    </Stepper>
  )
}
