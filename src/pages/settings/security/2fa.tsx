import {
  CodeInput,
  Group,
  Help,
  StepBars,
  StepTitle
} from '@/components/design/settings'
import { CheckIcon, KeyIcon } from '@/components/icons/app'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { useSettingsRequest } from '@/components/settings/useSettingsRequest'
import { HttpMethod } from '@/enums'
import { getValidSession } from '@/lib'
import { withClientIp } from '@/lib/server/clientIp'
import { useRevalidateApi } from '@/lib/useApi'
import { activate2FA } from '@/services'
import {
  Box,
  Button,
  Flex,
  Image,
  Skeleton,
  Stack,
  Text,
  useClipboard,
  useToast
} from '@chakra-ui/react'
import { GetServerSideProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { toDataURL } from 'qrcode'
import { useEffect, useState } from 'react'

const SETUP_PATH = '/settings/security/2fa'

interface Props {
  /** otpauth:// URL (opens the authenticator app, and what the QR holds). */
  qr: string
  secret: string
}

/** "JBSWY3DPEHPK3PXP" → "JBSW Y3DP EHPK 3PXP", easier to type by hand. */
const groupSecret = (secret: string) =>
  secret.match(/.{1,4}/g)?.join(' ') ?? secret

/**
 * Activar 2FA (docs/diseno-mobile.html, 10), thought for doing it on the
 * same phone: step 1 opens the authenticator app (or copies the key; the QR
 * is for whoever does it from a computer), step 2 asks for the first code
 * and confirms itself on the sixth digit. The backend only turns 2FA on once
 * that code verifies. Step 2 is `?step=2`, so the top bar's "‹ Atrás" and
 * the phone's back button return to step 1.
 */
export default function TwoFactorSetupPage({ qr, secret }: Props) {
  const { t } = useTranslation('settings')
  const router = useRouter()
  const toast = useToast()
  const request = useSettingsRequest()
  const revalidateApi = useRevalidateApi()
  const { onCopy, hasCopied } = useClipboard(secret)
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const step = router.query.step === '2' ? 2 : 1

  useEffect(() => {
    toDataURL(qr, { margin: 1, width: 296 })
      .then(setQrImage)
      .catch(() => setQrImage(null))
  }, [qr])

  const verify = async (value: string) => {
    if (value.length !== 6 || isVerifying) return
    setIsVerifying(true)
    setError(null)
    try {
      const result = await request<{ verified?: boolean }>(
        '/proxy/validate-2fa',
        HttpMethod.POST,
        { token: value }
      )
      if (!result?.verified) {
        setError(t('twoFactorSetup.invalidCode'))
        setCode('')
        return
      }
      await revalidateApi('auth/profile')
      toast({ title: t('twoFactorSetup.enabled'), status: 'success' })
      router.replace('/settings/security')
    } catch {
      setError(t('twoFactorSetup.genericError'))
      setCode('')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <SettingsLayout
      title={t('twoFactorSetup.title')}
      back={
        step === 2
          ? { href: SETUP_PATH, label: t('twoFactorSetup.back') }
          : { href: '/settings/security', label: t('security.title') }
      }
      bottomCta={
        step === 1 ? (
          <Button
            variant="soft"
            size="cta"
            w="full"
            onClick={() =>
              router.push(`${SETUP_PATH}?step=2`, undefined, { shallow: true })
            }
          >
            {t('twoFactorSetup.continue')}
          </Button>
        ) : undefined
      }
    >
      <StepBars current={step} total={2} />
      {step === 1 ? (
        <>
          <StepTitle number={1}>{t('twoFactorSetup.step1')}</StepTitle>
          <Text fontSize="13.5px" color="text.secondary" lineHeight="1.5">
            {t('twoFactorSetup.step1Hint')}
          </Text>
          <Button
            as="a"
            href={qr}
            variant="brand"
            size="cta"
            w="full"
            leftIcon={<KeyIcon boxSize="20px" />}
          >
            {t('twoFactorSetup.openApp')}
          </Button>

          <Group>{t('twoFactorSetup.manual')}</Group>
          <Flex
            align="center"
            gap="10px"
            h="52px"
            px="14px"
            bg="field.bg"
            borderRadius="14px"
          >
            <Text
              flex={1}
              minW={0}
              noOfLines={1}
              fontFamily="ui-monospace, Menlo, monospace"
              fontSize="14px"
              letterSpacing=".06em"
              color="text.primary"
              aria-label={t('twoFactorSetup.secretLabel')}
            >
              {groupSecret(secret)}
            </Text>
            <Button
              variant="ghost"
              h="44px"
              px="8px"
              mr="-8px"
              color="brand.text"
              fontSize="13px"
              fontWeight="bold"
              leftIcon={hasCopied ? <CheckIcon boxSize="16px" /> : undefined}
              onClick={onCopy}
            >
              {hasCopied
                ? t('twoFactorSetup.copied')
                : t('twoFactorSetup.copy')}
            </Button>
          </Flex>
          <Help>{t('twoFactorSetup.keepKey')}</Help>

          <Group>{t('twoFactorSetup.computer')}</Group>
          <Box
            boxSize="168px"
            mx="auto"
            mt="4px"
            p="10px"
            bg="white"
            borderRadius="14px"
            boxShadow="inset 0 0 0 1.5px var(--chakra-colors-border-subtle)"
          >
            {qrImage ? (
              <Image
                src={qrImage}
                alt={t('twoFactorSetup.qrAlt')}
                boxSize="full"
              />
            ) : (
              <Skeleton boxSize="full" />
            )}
          </Box>
        </>
      ) : (
        <Stack spacing="14px">
          <StepTitle number={2}>{t('twoFactorSetup.step2')}</StepTitle>
          <Text fontSize="13.5px" color="text.secondary" lineHeight="1.5">
            {t('twoFactorSetup.step2Hint')}
          </Text>
          <Box pt="6px">
            <CodeInput
              value={code}
              onChange={value => {
                setCode(value)
                setError(null)
              }}
              onComplete={verify}
              digitLabel={position => t('security.codeDigit', { position })}
              isInvalid={!!error}
              isDisabled={isVerifying}
            />
          </Box>
          {error && (
            <Text
              role="alert"
              textAlign="center"
              fontSize="13px"
              color="money.expenseText"
            >
              {error}
            </Text>
          )}
          {isVerifying && (
            <Text textAlign="center" fontSize="13px" color="text.secondary">
              {t('twoFactorSetup.verifying')}
            </Text>
          )}
        </Stack>
      )}
    </SettingsLayout>
  )
}

export const getServerSideProps: GetServerSideProps = withClientIp(
  async ({ req, res, locale }) => {
    const { session, redirect } = await getValidSession(req, res)
    if (redirect) return redirect

    try {
      // A fresh secret each visit; 409 when 2FA is already on.
      const data = (await activate2FA(
        {},
        {
          lang: locale as string,
          authorization: `Bearer ${session?.accessToken}`
        }
      )) as Props
      return {
        props: {
          ...(await serverSideTranslations(locale as string, [
            'common',
            'sidebar',
            'mobileNav',
            'settings'
          ])),
          qr: data.qr,
          secret: data.secret
        }
      }
    } catch {
      return {
        redirect: { destination: '/settings/security', permanent: false }
      }
    }
  }
)
