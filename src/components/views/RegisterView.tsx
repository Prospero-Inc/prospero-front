import {
  Stack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Button,
  Box,
  Image,
  Text,
  Container
} from '@chakra-ui/react'
import React, { useState } from 'react'
import { FiEyeOff, FiEye } from 'react-icons/fi'

export const RegisterView = () => {
  const [showPassword, setShowPassword] = useState(false)
  return (
    <Container flex={1} p={2}>
      <Image
        mt={['0em', '10em']}
        mx="auto"
        height={'5em'}
        src="/assets/authBrand.svg"
        alt="Prospero Logo"
      />
      <Stack textAlign={'center'}>
        <Heading fontSize={['4xl', '6xl']} textAlign="center">
          Create an Account
        </Heading>
        <Text fontSize={['md', 'lg']} color="gray.600">
          “Ahorrar nunca fue tan fácil, gestiona tus finanzas con estilo en{' '}
          <Text as="span" fontWeight="bold" color="primary.600">
            Prospero
          </Text>
          ”
        </Text>
      </Stack>
      <Box mt={4}>
        <Stack spacing={4}>
          <FormControl id="firstName">
            <FormLabel>Nombre</FormLabel>
            <Input type="text" />
          </FormControl>
          <FormControl id="lastName">
            <FormLabel>Apellido</FormLabel>
            <Input type="text" />
          </FormControl>
          <FormControl id="email">
            <FormLabel>E-mail</FormLabel>
            <Input type="email" />
          </FormControl>
          <FormControl id="password">
            <FormLabel>Contraseña</FormLabel>
            <InputGroup>
              <Input type={showPassword ? 'text' : 'password'} />
              <InputRightElement h="full">
                <IconButton
                  aria-label="Show password"
                  variant="ghost"
                  onClick={() => setShowPassword(showPassword => !showPassword)}
                  icon={showPassword ? <FiEyeOff /> : <FiEye />}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>
          <Stack spacing={6}>
            <Button bg="blue.400" color="white" _hover={{ bg: 'blue.500' }}>
              Crear cuenta
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Container>
  )
}
