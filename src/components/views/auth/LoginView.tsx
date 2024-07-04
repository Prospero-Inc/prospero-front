import { useYupValidationResolver } from '@/hooks/useYupValidationResolver'
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
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'
const validationSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required()
})
export const LoginView = () => {
  const {
    control,
    formState: { errors },
    handleSubmit
  } = useForm({
    resolver: useYupValidationResolver(validationSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  return (
    <Flex alignItems={'center'} justifyContent={'center'} w="720px">
      <Stack w="100%">
        <FormControl my={2}>
          <FormLabel color={'gray'}>E-mail</FormLabel>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Input {...field} placeholder="john@doe.com" />
            )}
          />
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
