import { ChemicalStructure, CustomStat, QrComponent } from '@/components/ui'
import { Flex, Heading, Stack, Text } from '@chakra-ui/react'
import React from 'react'

export const Security = () => {
  return (
    <CustomStat>
      <Heading as="h1">Security </Heading>
      <Flex justify={'center'} mb="3.188rem">
        <Heading as="h2">2FA Setup</Heading>
      </Flex>
      <Stack textAlign={'center'} mb="3.188rem">
        <Text>Scan the image below with your 2FA authenticator</Text>
      </Stack>
      <Stack display={'flex'} justify={'center'} alignItems={'center'}>
        <QrComponent />
        <ChemicalStructure />
      </Stack>
      <Stack display={'flex'} alignItems={'center'}>
        <CustomStat borderColor="primary.500">
          <Text fontWeight={'bold'} color="primary.500">
            LKS7 - 28HS -JHS2 - JSF9 - 72CA{' '}
          </Text>
        </CustomStat>
      </Stack>
    </CustomStat>
  )
}
