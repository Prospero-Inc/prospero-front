import {
  AuthField,
  AuthLead,
  AuthPasswordInput,
  AuthScreen,
  AuthTitle,
  meetsPasswordPolicy,
  PasswordRules
} from '@/components/auth/AuthScreen'
import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
import { Box, Button, Flex, Input, useToast } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { type FormEvent, useState } from 'react'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Field = 'firstName' | 'lastName' | 'email' | 'username' | 'password'
type Values = Record<Field, string>

const EMPTY: Values = {
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: ''
}

/**
 * Crear cuenta (docs/diseno-mobile.html, 11): short form with the right
 * autofill for each field, and the password requirements ticking as you
 * type instead of one long error after sending. Then "Revisá tu correo".
 */
export const RegisterView = () => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const toast = useToast()
  const [values, setValues] = useState<Values>(EMPTY)
  const [submitted, setSubmitted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const set = (field: Field) => (value: string) =>
    setValues(current => ({ ...current, [field]: value }))

  const errors: Partial<Record<Field, string>> = {
    ...(!values.firstName.trim() && {
      firstName: t('account.register.required')
    }),
    ...(!values.lastName.trim() && {
      lastName: t('account.register.required')
    }),
    ...(!EMAIL.test(values.email.trim()) && {
      email: t('account.register.invalidEmail')
    }),
    ...(!values.username.trim() && {
      username: t('account.register.required')
    }),
    ...(!meetsPasswordPolicy(values.password) && {
      password: t('account.register.weakPassword')
    })
  }
  // Errors show once they tried to send, not while typing the first time.
  const errorOf = (field: Field) => (submitted ? errors[field] : undefined)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length) return
    setIsSaving(true)
    const email = values.email.trim()
    try {
      await localApiService.request({
        method: HttpMethod.POST,
        endPoint: '/proxy/form',
        data: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email,
          // The API's field name (sic).
          usernName: values.username.trim(),
          password: values.password
        }
      })
      router.push({
        pathname: '/auth/verify-account',
        query: { email, sent: '1' }
      })
    } catch (error) {
      toast({
        title: t('account.register.error'),
        description: error instanceof Error ? error.message : undefined,
        status: 'error',
        isClosable: true
      })
      setIsSaving(false)
    }
  }

  const textInput = (
    field: Exclude<Field, 'password'>,
    props: Record<string, string>
  ) => (
    <Input
      id={`register-${field}`}
      name={field}
      variant="design"
      value={values[field]}
      onChange={event => set(field)(event.target.value)}
      isInvalid={!!errorOf(field)}
      {...props}
    />
  )

  return (
    <AuthScreen
      title={t('account.register.pageTitle')}
      back={{ href: '/auth/login', label: t('account.signIn') }}
    >
      <Box mt="4px" mb="6px">
        <AuthTitle>{t('account.register.title')}</AuthTitle>
      </Box>
      <Box mb="18px">
        <AuthLead>{t('account.register.lead')}</AuthLead>
      </Box>

      <Box as="form" method="post" noValidate onSubmit={onSubmit}>
        <Flex gap="10px">
          <AuthField
            id="register-firstName"
            label={t('account.register.firstName')}
            error={errorOf('firstName')}
          >
            {textInput('firstName', {
              autoComplete: 'given-name',
              autoCapitalize: 'words'
            })}
          </AuthField>
          <AuthField
            id="register-lastName"
            label={t('account.register.lastName')}
            error={errorOf('lastName')}
          >
            {textInput('lastName', {
              autoComplete: 'family-name',
              autoCapitalize: 'words'
            })}
          </AuthField>
        </Flex>
        <AuthField
          id="register-email"
          label={t('account.register.email')}
          error={errorOf('email')}
        >
          {textInput('email', {
            type: 'email',
            inputMode: 'email',
            autoComplete: 'email',
            autoCapitalize: 'none'
          })}
        </AuthField>
        <AuthField
          id="register-username"
          label={t('account.register.username')}
          error={errorOf('username')}
        >
          {textInput('username', {
            autoComplete: 'username',
            autoCapitalize: 'none',
            spellCheck: 'false'
          })}
        </AuthField>
        <AuthField
          id="register-password"
          label={t('account.register.password')}
          error={errorOf('password')}
          mb="14px"
        >
          <AuthPasswordInput
            id="register-password"
            name="password"
            autoComplete="new-password"
            value={values.password}
            onChange={event => set('password')(event.target.value)}
            isInvalid={!!errorOf('password')}
          />
        </AuthField>
        <PasswordRules value={values.password} />
        <Button
          type="submit"
          variant="brand"
          size="cta"
          w="full"
          isLoading={isSaving}
        >
          {t('account.register.submit')}
        </Button>
      </Box>
    </AuthScreen>
  )
}
