import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Link,
  Stack
} from '@chakra-ui/react'
import React from 'react'

export const LoginView = () => {
  return (
    <Flex alignItems={'center'} justifyContent={'center'} w="720px">
      <Stack w="100%">
        <FormControl my={2}>
          <FormLabel color={'gray'}>E-mail</FormLabel>
          <Input placeholder="john@doe.com" />
        </FormControl>
        <FormControl my={2}>
          <FormLabel color={'gray'}>Password</FormLabel>
          <Input placeholder="***" type="password" />
        </FormControl>
        <Link ml="auto" href="/auth/forgot-password">
          Olvidaste tu contraseña?
        </Link>
        <Button colorScheme="primary" my={2} type="submit" h={'4em'}>
          Entrar
        </Button>
      </Stack>
    </Flex>
  )
}
