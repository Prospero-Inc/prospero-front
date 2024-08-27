import { CustomStat } from '@/components/ui'
import { Heading } from '@chakra-ui/react'
import React from 'react'

export const PersonalInformation = () => {
  return (
    <CustomStat>
      <Heading as="h2" size={'md'}>
        Personal Information
      </Heading>
    </CustomStat>
  )
}
