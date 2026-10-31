import { parseAmount } from '@/components/quick-add/parseAmount'
import { ChoiceButton } from '@/components/ui/ChoiceButton'
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
  IconButton,
  Input,
  Progress,
  SimpleGrid,
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
import { MdAdd, MdRemove } from 'react-icons/md'

const STEPS = 3
const FREQUENCIES: PayFrequency[] = ['Biweekly', 'Monthly']

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

  const [step, setStep] = useState(1)
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
      setStep(3)
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

  return (
    <Flex minH="100dvh" bg="bg.canvas" justify="center" px={4} py={6}>
      <Head>
        <title>{t('welcome.pageTitle')}</title>
      </Head>
      <Stack spacing={6} w="full" maxW="md">
        <Box>
          <Text fontSize="sm" color="text.secondary" mb={2}>
            {t('welcome.step', { step, total: STEPS })}
          </Text>
          <Progress
            value={(step / STEPS) * 100}
            size="xs"
            borderRadius="full"
            colorScheme="primary"
            aria-hidden
          />
        </Box>

        {step === 1 && (
          <Stack spacing={5}>
            <Heading as="h1" size="lg" color="text.primary">
              {t('welcome.frequency.title')}
            </Heading>
            <Text color="text.secondary">{t('welcome.frequency.hint')}</Text>
            <SimpleGrid columns={1} spacing={3}>
              {FREQUENCIES.map(option => (
                <ChoiceButton
                  key={option}
                  label={t(`welcome.frequency.${option}`)}
                  isSelected={frequency === option}
                  color="brand.solid"
                  onClick={() => setFrequency(option)}
                />
              ))}
            </SimpleGrid>
            <Button
              colorScheme="primary"
              minH="52px"
              isDisabled={!frequency}
              onClick={() => setStep(2)}
            >
              {t('welcome.continue')}
            </Button>
          </Stack>
        )}

        {step === 2 && (
          <Stack spacing={5}>
            <Heading as="h1" size="lg" color="text.primary">
              {t('welcome.split.title')}
            </Heading>
            <Text color="text.secondary">{t('welcome.split.hint')}</Text>
            <SimpleGrid columns={1} spacing={3}>
              <ChoiceButton
                label={t('welcome.split.recommended')}
                isSelected={!custom}
                color="brand.solid"
                onClick={() => {
                  setCustom(false)
                  setSplit(RECOMMENDED_SPLIT)
                }}
              />
              <ChoiceButton
                label={t('welcome.split.custom')}
                isSelected={custom}
                color="brand.solid"
                onClick={() => setCustom(true)}
              />
            </SimpleGrid>

            {custom && (
              <Stack
                spacing={1}
                bg="bg.surface"
                borderRadius="16px"
                borderWidth="1px"
                borderColor="border.subtle"
                p={4}
              >
                {SPLIT_KEYS.map(key => (
                  <Flex
                    key={key}
                    align="center"
                    justify="space-between"
                    minH="52px"
                  >
                    <Text color="text.primary" fontWeight="semibold">
                      {t(`welcome.split.${key}`)}
                    </Text>
                    <Flex align="center" gap={3}>
                      <IconButton
                        aria-label={t('welcome.split.decrease', {
                          name: t(`welcome.split.${key}`)
                        })}
                        icon={<MdRemove />}
                        variant="outline"
                        isRound
                        isDisabled={split[key] < SPLIT_STEP}
                        onClick={() =>
                          setSplit(current =>
                            adjustSplit(current, key, -SPLIT_STEP)
                          )
                        }
                      />
                      <Text
                        w="3.5rem"
                        textAlign="center"
                        fontWeight="bold"
                        fontSize="lg"
                        color="text.primary"
                        aria-live="polite"
                      >
                        {split[key]}%
                      </Text>
                      <IconButton
                        aria-label={t('welcome.split.increase', {
                          name: t(`welcome.split.${key}`)
                        })}
                        icon={<MdAdd />}
                        variant="outline"
                        isRound
                        isDisabled={split[key] > 100 - SPLIT_STEP}
                        onClick={() =>
                          setSplit(current =>
                            adjustSplit(current, key, SPLIT_STEP)
                          )
                        }
                      />
                    </Flex>
                  </Flex>
                ))}
              </Stack>
            )}

            <Flex gap={3}>
              <Button variant="ghost" onClick={() => setStep(1)}>
                {t('welcome.back')}
              </Button>
              <Button
                flex={1}
                colorScheme="primary"
                minH="52px"
                isLoading={isSaving}
                onClick={saveBudget}
              >
                {t('welcome.continue')}
              </Button>
            </Flex>
          </Stack>
        )}

        {step === 3 && (
          <Stack
            as="form"
            method="post"
            spacing={5}
            onSubmit={event => {
              event.preventDefault()
              saveIncome()
            }}
          >
            <Heading as="h1" size="lg" color="text.primary">
              {t('welcome.income.title')}
            </Heading>
            <Text color="text.secondary">{t('welcome.income.hint')}</Text>
            <FormControl>
              <FormLabel>{t('welcome.income.amount')}</FormLabel>
              <Input
                value={amountInput}
                onChange={event => setAmountInput(event.target.value)}
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                fontSize="2xl"
                h="56px"
                bg="bg.surface"
              />
            </FormControl>
            <FormControl>
              <FormLabel>{t('welcome.income.date')}</FormLabel>
              <Input
                type="date"
                value={date}
                onChange={event => setDate(event.target.value)}
                bg="bg.surface"
              />
            </FormControl>
            <Button
              type="submit"
              colorScheme="primary"
              minH="52px"
              isDisabled={amount === null || !date}
              isLoading={isSaving}
            >
              {t('welcome.income.save')}
            </Button>
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              {t('welcome.income.later')}
            </Button>
          </Stack>
        )}
      </Stack>
    </Flex>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale as string, ['common']))
  }
})
