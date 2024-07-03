import {
  Flex,
  useColorModeValue,
  HStack,
  Button,
  Stack,
  Image
} from '@chakra-ui/react'
import React from 'react'

export const AuthNav = ({ ...rest }) => {
  return (
    <Flex
      ml={{ base: 0, md: 0 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      flexDir={{ base: 'column', md: 'row' }}
      bg={useColorModeValue('white', 'gray.900')}
      justifyContent={{
        base: 'space-between',
        md: 'space-between',
        sm: 'flex-start'
      }}
      {...rest}
    >
      <Image src={'/assets/authBrand.svg'} alt="Logo" m={[10, 1]} />
      <HStack spacing={{ base: '0', md: '6' }}>
        <Flex alignItems={'center'}>
          <Stack direction="row" spacing={4} align="center">
            <Button colorScheme="primary" variant="ghost">
              Iniciar Sesion
            </Button>
            <Button colorScheme="primary" variant="outline">
              Registrarse
            </Button>
          </Stack>
        </Flex>
      </HStack>
    </Flex>
  )
}
