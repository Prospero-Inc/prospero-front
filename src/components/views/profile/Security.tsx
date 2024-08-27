import { CustomStat } from '@/components/ui'
import { Heading, Text, Button, Box, useColorModeValue } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import React from 'react'

export const Security = () => {
  const colorText = useColorModeValue('gray.400', 'gray.500')
  const router = useRouter()

  const switchRoute = () => {
    router.push('/profile/2fa')
  }
  return (
    <CustomStat>
      <Box display={'flex'} justifyContent={'space-between'} my={'1.8rem'}>
        <Heading as="h2" size={'md'}>
          Security{' '}
        </Heading>
        <Text color={colorText}>Activado</Text>
      </Box>
      <Button colorScheme="primary" variant={'ghost'} onClick={switchRoute}>
        Desactivar
      </Button>

      {/* <Container>
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
        <Stack display={'flex'} alignItems={'center'} mb="3.188rem">
          <CustomStat borderColor="primary.500">
            <Text fontWeight={'bold'} color="primary.500">
              LKS7 - 28HS -JHS2 - JSF9 - 72CA{' '}
            </Text>
          </CustomStat>
        </Stack>
        <Divider borderColor={'gray.300'} mb="1.188rem" />
        <Flex justify={'space-around'}>
          <Button colorScheme="primary" iconSpacing={'auto'}>
            <IoHelpBuoyOutline />
            Need Help?
          </Button>
          <Button colorScheme="primary">Continue</Button>
        </Flex>
      </Container> */}
    </CustomStat>
  )
}
