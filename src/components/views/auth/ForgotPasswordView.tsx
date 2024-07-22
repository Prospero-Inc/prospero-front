import { useYupValidationResolver } from '@/hooks/useYupValidationResolver'
import language from '@/language/es/forgot-password.json'
import {
  Button,
  FormControl,
  FormLabel,
  Heading,
  Image,
  Input,
  Link,
  Stack,
  Text
} from '@chakra-ui/react'
import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'
const validationSchema = yup.object().shape({
  email: yup.string().email().required()
})
export const ForgotPasswordView = () => {
  const {
    control,
    formState: { errors },
    handleSubmit
  } = useForm({
    resolver: useYupValidationResolver(validationSchema),
    defaultValues: {
      email: ''
    }
  })

  const onSubmit = async (data: { email: string }) => {
    console.log(data)
  }
  return (
    <Stack
      maxW={'2xl'}
      as={'form'}
      onSubmit={handleSubmit(onSubmit)}
      w={'full'}
      justifyContent={'center'}
    >
      <Image src={'/assets/authBrand.svg'} alt="Brannd " mb="5rem" />
      <Heading>{language.title}</Heading>
      <Text my={4}>{language.descriptionBlockOne}</Text>
      <Text my={4}>{language.descriptionBlockTwo}</Text>
      <FormControl my={2}>
        <FormLabel color={'gray'} fontSize={['small', 'medium']}>
          {language.inputLabel}
        </FormLabel>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Input
              size={['md', 'md', 'lg']}
              {...field}
              placeholder="john@doe.com"
            />
          )}
        />
        {errors.email && <Text color="red">{errors.email.message}</Text>}
      </FormControl>

      <Link fontSize={['small', 'medium']} ml="auto" href="/auth/login">
        {language.backToLogin}
      </Link>
      <Button colorScheme="primary" my={2} type="submit" h={['3em', '4em']}>
        {language.submitButton}
      </Button>
    </Stack>
  )
}
