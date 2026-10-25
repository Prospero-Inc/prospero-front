import { ProsperoLayout } from '@/components/layouts'
import { HttpMethod } from '@/enums'
import { getValidSession, localApiService } from '@/lib'
import { activate2FA } from '@/services'
import {
  Box,
  Button,
  Code,
  Collapse,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Image,
  Link,
  ListItem,
  OrderedList,
  PinInput,
  PinInputField,
  Skeleton,
  Stack,
  Text,
  useClipboard,
  useColorModeValue,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import { GetServerSideProps } from 'next'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { toDataURL } from 'qrcode'
import { FormEvent, useEffect, useState } from 'react'
import {
  MdArrowBack,
  MdCheck,
  MdContentCopy,
  MdHelpOutline
} from 'react-icons/md'

const CODE_LENGTH = 6

interface Props {
  data: {
    qr: string
    secret: string
  }
}

/**
 * Activar 2FA en una sola pantalla: escanear el QR (o copiar la clave) y
 * confirmar con el primer código de la app. Antes eran dos páginas en
 * inglés, y la confirmación aceptaba cualquier código. El backend recién
 * activa el 2FA cuando ese primer código verifica.
 */
const TwoFactorSetup = ({ data: { qr, secret } }: Props) => {
  const { t } = useTranslation('profile', { keyPrefix: 'twoFactorSetup' })
  const router = useRouter()
  const toast = useToast()
  const { data: session } = useSession()
  const help = useDisclosure()
  const { onCopy, hasCopied } = useClipboard(secret)
  const mutedColor = useColorModeValue('gray.600', 'gray.400')
  const stepBg = useColorModeValue('gray.50', 'gray.700')
  const fieldBg = useColorModeValue('white', 'gray.800')
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    toDataURL(qr, { margin: 1, width: 220 })
      .then(setQrImage)
      .catch(() => setQrImage(null))
  }, [qr])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (code.length !== CODE_LENGTH) return

    setIsVerifying(true)
    setError(null)
    try {
      const result = (await localApiService.request({
        endPoint: '/proxy/validate-2fa',
        method: HttpMethod.POST,
        data: { token: code },
        headers: {
          'x-lang': router.locale ?? 'es',
          Authorization: `Bearer ${session?.accessToken}`
        }
      })) as { verified?: boolean }

      if (!result?.verified) {
        setError(t('errors.invalidCode'))
        setCode('')
        return
      }

      toast({
        title: t('toast.enabled.title'),
        description: t('toast.enabled.description'),
        status: 'success'
      })
      router.replace('/profile')
    } catch {
      setError(t('errors.generic'))
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <ProsperoLayout title={t('title')} pageDescription={t('description')}>
      <Container maxW="container.sm" px={0}>
        <Link
          as={NextLink}
          href="/profile"
          display="inline-flex"
          alignItems="center"
          gap={1}
          color="primary.500"
          mb={6}
          minH="44px"
        >
          <Icon as={MdArrowBack} aria-hidden="true" />
          {t('back')}
        </Link>

        <Heading as="h1" size="lg" mb={2}>
          {t('title')}
        </Heading>
        <Text color={mutedColor} mb={8}>
          {t('description')}
        </Text>

        <Stack spacing={6}>
          {/* Paso 1: vincular la app */}
          <Box bg={stepBg} borderRadius="md" p={{ base: 4, md: 6 }}>
            <Heading as="h2" size="sm" mb={4}>
              {t('step1.title')}
            </Heading>
            <Flex
              direction={{ base: 'column', sm: 'row' }}
              gap={6}
              align={{ base: 'center', sm: 'flex-start' }}
            >
              <Box
                bg="white"
                p={2}
                borderRadius="md"
                flexShrink={0}
                boxSize="220px"
              >
                {qrImage ? (
                  <Image src={qrImage} alt={t('step1.qrAlt')} boxSize="full" />
                ) : (
                  <Skeleton boxSize="full" />
                )}
              </Box>
              <Stack spacing={3} minW={0}>
                <Text fontSize="sm">{t('step1.scan')}</Text>
                <Text fontSize="sm" color={mutedColor}>
                  {t('step1.manual')}
                </Text>
                <Flex gap={2} align="center" wrap="wrap">
                  <Code
                    px={2}
                    py={1}
                    fontSize="sm"
                    wordBreak="break-all"
                    aria-label={t('step1.secretLabel')}
                  >
                    {secret}
                  </Code>
                  <Button
                    size="sm"
                    minH="44px"
                    variant="outline"
                    leftIcon={hasCopied ? <MdCheck /> : <MdContentCopy />}
                    onClick={onCopy}
                  >
                    {hasCopied ? t('step1.copied') : t('step1.copy')}
                  </Button>
                </Flex>
              </Stack>
            </Flex>

            <Button
              variant="link"
              leftIcon={<MdHelpOutline />}
              mt={4}
              minH="44px"
              onClick={help.onToggle}
              aria-expanded={help.isOpen}
              aria-controls="two-factor-help"
            >
              {t('help.toggle')}
            </Button>
            <Collapse in={help.isOpen} animateOpacity>
              <OrderedList
                id="two-factor-help"
                spacing={2}
                fontSize="sm"
                color={mutedColor}
                mt={2}
              >
                <ListItem>{t('help.install')}</ListItem>
                <ListItem>{t('help.add')}</ListItem>
                <ListItem>{t('help.code')}</ListItem>
                <ListItem>{t('help.lost')}</ListItem>
              </OrderedList>
            </Collapse>
          </Box>

          {/* Paso 2: confirmar con el primer código */}
          <Box
            as="form"
            onSubmit={onSubmit}
            bg={stepBg}
            borderRadius="md"
            p={{ base: 4, md: 6 }}
          >
            <Heading as="h2" size="sm" mb={4}>
              {t('step2.title')}
            </Heading>
            <FormControl isInvalid={!!error}>
              <FormLabel fontSize="sm" fontWeight="normal">
                {t('step2.label')}
              </FormLabel>
              <HStack>
                <PinInput
                  otp
                  type="number"
                  value={code}
                  onChange={value => {
                    setCode(value)
                    setError(null)
                  }}
                  isInvalid={!!error}
                  aria-label={t('step2.label')}
                >
                  {Array.from({ length: CODE_LENGTH }).map((_, index) => (
                    <PinInputField key={index} bg={fieldBg} />
                  ))}
                </PinInput>
              </HStack>
              <FormErrorMessage>{error}</FormErrorMessage>
            </FormControl>
            <Button
              type="submit"
              colorScheme="primary"
              mt={6}
              minH="44px"
              w={{ base: 'full', sm: 'auto' }}
              isLoading={isVerifying}
              isDisabled={code.length !== CODE_LENGTH}
            >
              {t('step2.submit')}
            </Button>
          </Box>
        </Stack>
      </Container>
    </ProsperoLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  locale
}) => {
  const { session, redirect } = await getValidSession(req, res)
  if (redirect) return redirect

  try {
    const data = await activate2FA(
      {},
      {
        lang: locale as string,
        authorization: `Bearer ${session?.accessToken}`
      }
    )
    return {
      props: {
        ...(await serverSideTranslations(locale as string, [
          'common',
          'sidebar',
          'mobileNav',
          'profile'
        ])),
        data
      }
    }
  } catch (error) {
    return {
      redirect: {
        destination: '/profile',
        permanent: false
      }
    }
  }
}

export default TwoFactorSetup
