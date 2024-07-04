import {
  Flex,
  useColorModeValue,
  HStack,
  Button,
  Stack,
  Image
} from '@chakra-ui/react'
import { useRouter } from 'next/router'
import React from 'react'

export const AuthNav = ({ ...rest }) => {
  const router = useRouter()
  return (
    <header>
      <Flex
        zIndex={99}
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
        <Image src={'/assets/authBrand.svg'} alt="Logo" p={[3, 2]} />
        <HStack
          spacing={{ base: '0', md: '6' }}
          fontSize={['small', 'small', 'medium']}
        >
          <Flex alignItems={'center'}>
            <Stack direction="row" spacing={2} align="center">
              <Button
                colorScheme="primary"
                variant="ghost"
                fontSize={['small', 'small', 'medium']}
                onClick={() => router.push('/auth/login')}
              >
                Iniciar Sesion
              </Button>
              <Button
                colorScheme="primary"
                variant="outline"
                fontSize={['small', 'small', 'medium']}
                onClick={() => router.push('/auth/register')}
              >
                Registrarse
              </Button>
            </Stack>
          </Flex>
        </HStack>
      </Flex>
    </header>
  )
}
