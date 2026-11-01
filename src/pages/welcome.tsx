import { ChoiceCard, StepperButton } from '@/components/design/settings'
import { parseAmount } from '@/components/quick-add/parseAmount'
import {
  adjustSplit,
  RECOMMENDED_SPLIT,
  type Split,
  SPLIT_KEYS,
  SPLIT_STEP
} from '@/components/welcome/split'
import { HttpMethod } from '@/enums'
import type { PayFrequency, Profile } from '@/interfaces'
import { getTodayLocalDate, localApiService } from '@/lib'
import { useApi, useRevalidateApi } from '@/lib/useApi'
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const STEPS = 3
const FREQUENCIES: PayFrequency[] = ['Biweekly', 'Monthly']
const SPLIT_CATEGORY = {
  needs: 'Necesidad',
  wants: 'Deseo',
  savings: 'Ahorro'
} as const

// docs/diseno-mobile.html .ob-h, .ob-p, .lfield and .btn.
const TITLE_STYLE = {
  fontSize: '26px',
  fontWeight: 'bold',
  lineHeight: '1.2',
  letterSpacing: '-0.01em',
  color: 'text.primary'
} as const
const HINT_STYLE = {
  fontSize: '14.5px',
  lineHeight: '1.5',
  color: 'text.secondary'
} as const
const FIELD_LABEL_STYLE = {
  fontSize: '13px',
  fontWeight: 600,
  mb: '6px',
  color: 'field.label'
} as const
const FIELD_STYLE = {
  h: '54px',
  borderRadius: '14px',
  borderWidth: '1.5px',
  borderColor: 'field.border',
  bg: 'bg.surface',
  fontSize: '16px',
  px: '14px',
  _focusVisible: {
    borderColor: 'brand.solid',
    borderWidth: '2px',
    boxShadow: 'none'
  }
} as const
const PRIMARY_BUTTON_STYLE = {
  h: '54px',
  borderRadius: '16px',
  bg: 'brand.solid',
  color: 'white',
  fontSize: '16px',
  fontWeight: 'bold',
  _hover: { bg: 'brand.solid', opacity: 0.92 },
  _active: { opacity: 0.85 },
  _disabled: { opacity: 0.45, cursor: 'not-allowed' }
} as const

/**
 * First steps (docs/diseno-mobile.html, 04): how often you're paid, how to
 * split each payment, and your last payment — so the dashboard has a real
 * budget from day one instead of hidden defaults and an empty screen.
 */
export default function WelcomePage() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const toast = useToast()
  const { data: session } = useSession()
  const { data: profileData } = useApi<{ user: Profile }>('auth/profile')
  const revalidateApi = useRevalidateApi()

  // In the URL (?step=2) so the phone's back gesture goes back one step.
  const step = Math.min(Math.max(Number(router.query.step) || 1, 1), STEPS)
  const goToStep = (next: number) =>
    router.push({ query: { step: next } }, undefined, { shallow: true })
  const [frequency, setFrequency] = useState<PayFrequency | null>(null)
  const [custom, setCustom] = useState(false)
  const [split, setSplit] = useState<Split>(RECOMMENDED_SPLIT)
  const [amountInput, setAmountInput] = useState('')
  const [date, setDate] = useState(getTodayLocalDate())
  const [isSaving, setIsSaving] = useState(false)

  // Start from what the account already has.
  const profile = profileData?.user
  useEffect(() => {
    if (!profile) return
    setFrequency(current => current ?? profile.payFrequency)
    const saved = {
      needs: Math.round(profile.needsPercent * 100),
      wants: Math.round(profile.wantsPercent * 100),
      savings: Math.round(profile.savingsPercent * 100)
    }
    setSplit(saved)
    setCustom(
      saved.needs !== RECOMMENDED_SPLIT.needs ||
        saved.wants !== RECOMMENDED_SPLIT.wants
    )
  }, [profile])

  const headers = { Authorization: `Bearer ${session?.accessToken}` }
  const amount = parseAmount(amountInput)

  const saveBudget = async () => {
    setIsSaving(true)
    try {
      await localApiService.request({
        method: HttpMethod.PATCH,
        endPoint: '/proxy/update-profile',
        data: {
          payFrequency: frequency,
          needsPercent: split.needs / 100,
          wantsPercent: split.wants / 100,
          savingsPercent: split.savings / 100
        },
        headers
      })
      await revalidateApi('auth/profile', 'periods')
      goToStep(3)
    } catch (error) {
      toast({
        title: t('welcome.error'),
        description: error instanceof Error ? error.message : undefined,
        status: 'error'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const saveIncome = async () => {
    if (amount === null) return
    setIsSaving(true)
    try {
      await localApiService.request({
        method: HttpMethod.POST,
        endPoint: '/proxy/create-salary',
        data: { amount, date, type: 'Payroll' },
        headers
      })
      await revalidateApi('periods', 'salary')
      router.push('/dashboard')
    } catch (error) {
      toast({
        title: t('welcome.error'),
        description: error instanceof Error ? error.message : undefined,
        status: 'error'
      })
      setIsSaving(false)
    }
  }

  const splitBar = (
    <Flex h="16px" borderRadius="8px" overflow="hidden" gap="3px" aria-hidden>
      {SPLIT_KEYS.map(key => (
        <Box
          key={key}
          flex={split[key]}
          bg={`category.${SPLIT_CATEGORY[key]}`}
          transition="flex .2s"
        />
      ))}
    </Flex>
  )

  return (
    <Box minH="100dvh" bg="bg.surface">
      <Head>
        <title>{t('welcome.pageTitle')}</title>
      </Head>
      <Stack
        spacing="14px"
        w="full"
        maxW="md"
        mx="auto"
        px="16px"
        pt="calc(8px + env(safe-area-inset-top))"
        // Room for the fixed button at the bottom.
        pb="calc(104px + env(safe-area-inset-bottom))"
        // One form for all steps; only step 3's button submits it.
        as="form"
        id="welcome-step"
        method="post"
        onSubmit={(event: React.FormEvent) => {
          event.preventDefault()
          if (step === 3) saveIncome()
        }}
      >
        <Box>
          <Flex gap="6px" mt="8px" mb="4px" aria-hidden>
            {Array.from({ length: STEPS }, (_, index) => (
              <Box
                key={index}
                flex={1}
                h="5px"
                borderRadius="3px"
                bg={index < step ? 'brand.solid' : 'steps.off'}
              />
            ))}
          </Flex>
          <Text
            fontSize="12.5px"
            fontWeight={600}
            color="text.secondary"
            mt="14px"
          >
            {t('welcome.step', { step, total: STEPS })}
          </Text>
        </Box>

        {step === 1 && (
          <>
            <Heading as="h1" {...TITLE_STYLE}>
              {t('welcome.frequency.title')}
            </Heading>
            <Text {...HINT_STYLE}>{t('welcome.frequency.hint')}</Text>
            {FREQUENCIES.map(option => (
              <ChoiceCard
                key={option}
                title={t(`welcome.frequency.${option}`)}
                hint={t(`welcome.frequency.${option}Hint`)}
                isSelected={frequency === option}
                onClick={() => setFrequency(option)}
              />
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <Heading as="h1" {...TITLE_STYLE}>
              {t('welcome.split.title')}
            </Heading>
            <Text {...HINT_STYLE}>{t('welcome.split.hint')}</Text>
            <ChoiceCard
              title={t('welcome.split.recommended')}
              hint={t('welcome.split.recommendedHint')}
              isSelected={!custom}
              onClick={() => {
                setCustom(false)
                setSplit(RECOMMENDED_SPLIT)
              }}
            />
            <ChoiceCard
              title={t('welcome.split.custom')}
              hint={t('welcome.split.customHint')}
              isSelected={custom}
              onClick={() => setCustom(true)}
            />

            <Box bg="bg.subtle" borderRadius="20px" p="16px">
              <Box mb="14px">{splitBar}</Box>
              <Stack spacing="10px">
                {SPLIT_KEYS.map(key => (
                  <Flex key={key} align="center" justify="space-between">
                    <Flex
                      align="center"
                      gap="7px"
                      fontSize="14px"
                      fontWeight={600}
                      color="text.primary"
                    >
                      <Box
                        boxSize="9px"
                        borderRadius="full"
                        bg={`category.${SPLIT_CATEGORY[key]}`}
                      />
                      {t(`welcome.split.${key}`)}
                    </Flex>
                    <Flex align="center" gap="10px">
                      <StepperButton
                        label={t('welcome.split.decrease', {
                          name: t(`welcome.split.${key}`)
                        })}
                        isDisabled={split[key] < SPLIT_STEP}
                        onClick={() => {
                          setCustom(true)
                          setSplit(current =>
                            adjustSplit(current, key, -SPLIT_STEP)
                          )
                        }}
                      >
                        −
                      </StepperButton>
                      <Text
                        w="52px"
                        textAlign="center"
                        fontWeight="bold"
                        fontSize="16px"
                        color="text.primary"
                        aria-live="polite"
                        sx={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {split[key]}%
                      </Text>
                      <StepperButton
                        label={t('welcome.split.increase', {
                          name: t(`welcome.split.${key}`)
                        })}
                        isDisabled={split[key] > 100 - SPLIT_STEP}
                        onClick={() => {
                          setCustom(true)
                          setSplit(current =>
                            adjustSplit(current, key, SPLIT_STEP)
                          )
                        }}
                      >
                        +
                      </StepperButton>
                    </Flex>
                  </Flex>
                ))}
              </Stack>
            </Box>
          </>
        )}

        {step === 3 && (
          <>
            <Heading as="h1" {...TITLE_STYLE}>
              {t('welcome.income.title')}
            </Heading>
            <Text {...HINT_STYLE}>{t('welcome.income.hint')}</Text>
            <FormControl>
              <FormLabel {...FIELD_LABEL_STYLE}>
                {t('welcome.income.amount')}
              </FormLabel>
              <Input
                {...FIELD_STYLE}
                value={amountInput}
                onChange={event => setAmountInput(event.target.value)}
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
              />
            </FormControl>
            <FormControl>
              <FormLabel {...FIELD_LABEL_STYLE}>
                {t('welcome.income.date')}
              </FormLabel>
              <Input
                {...FIELD_STYLE}
                type="date"
                value={date}
                onChange={event => setDate(event.target.value)}
              />
            </FormControl>
            <Button
              variant="ghost"
              color="brand.text"
              alignSelf="center"
              minH="44px"
              onClick={() => router.push('/dashboard')}
            >
              {t('welcome.income.later')}
            </Button>
          </>
        )}
      </Stack>

      {/* `.bottom-cta`: the step's main action, always under the thumb. */}
      <Box
        position="fixed"
        left={0}
        right={0}
        bottom={0}
        px="16px"
        pt="8px"
        pb="calc(16px + env(safe-area-inset-bottom))"
        bg="bg.surface"
      >
        <Button
          {...PRIMARY_BUTTON_STYLE}
          w="full"
          maxW="md"
          mx="auto"
          display="flex"
          {...(step === 3
            ? {
                type: 'submit',
                form: 'welcome-step',
                isDisabled: amount === null || !date
              }
            : step === 1
            ? { isDisabled: !frequency, onClick: () => goToStep(2) }
            : { onClick: saveBudget })}
          isLoading={isSaving}
        >
          {step === 3 ? t('welcome.income.save') : t('welcome.continue')}
        </Button>
      </Box>
    </Box>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale as string, ['common']))
  }
})
