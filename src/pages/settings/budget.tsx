import {
  ChoiceCard,
  Group,
  Help,
  StepperButton
} from '@/components/design/settings'
import { CheckIcon } from '@/components/icons/app'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { settingsStaticProps } from '@/components/settings/settingsStaticProps'
import {
  RECOMMENDED_SPLIT,
  type Split,
  SPLIT_KEYS,
  SPLIT_STEP
} from '@/components/welcome/split'
import { HttpMethod } from '@/enums'
import type { PayFrequency, Profile } from '@/interfaces'
import { localApiService } from '@/lib'
import { useApi, useRevalidateApi } from '@/lib/useApi'
import { Box, Button, Flex, Stack, Text, useToast } from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { type FormEvent, useEffect, useState } from 'react'

const FORM_ID = 'budget-form'
const FREQUENCIES: PayFrequency[] = ['Biweekly', 'Monthly']
const SPLIT_CATEGORY = {
  needs: 'Necesidad',
  wants: 'Deseo',
  savings: 'Ahorro'
} as const

const splitOf = (profile: Profile): Split => ({
  needs: Math.round(profile.needsPercent * 100),
  wants: Math.round(profile.wantsPercent * 100),
  savings: Math.round(profile.savingsPercent * 100)
})

/**
 * Presupuesto (docs/diseno-mobile.html, 07): pay frequency as two cards
 * and the split with − / + like the onboarding. Unlike the onboarding, the
 * steppers move freely: the total says how much is missing or left over,
 * and saving waits until it adds up to 100 % (the backend requires it).
 */
export default function BudgetSettingsPage() {
  const { t } = useTranslation('settings')
  const toast = useToast()
  const { data: session } = useSession()
  const revalidateApi = useRevalidateApi()
  const { data, error } = useApi<{ user: Profile }>('auth/profile')
  const profile = data?.user

  const [frequency, setFrequency] = useState<PayFrequency>('Biweekly')
  const [split, setSplit] = useState<Split>(RECOMMENDED_SPLIT)
  const [isSaving, setIsSaving] = useState(false)
  useEffect(() => {
    if (!profile) return
    setFrequency(profile.payFrequency ?? 'Biweekly')
    setSplit(splitOf(profile))
  }, [profile])

  const total = split.needs + split.wants + split.savings
  const difference = 100 - total

  const step = (key: keyof Split, delta: number) =>
    setSplit(current => ({
      ...current,
      [key]: Math.min(100, Math.max(0, current[key] + delta))
    }))

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (difference !== 0) return
    setIsSaving(true)
    try {
      await localApiService.request({
        endPoint: '/proxy/update-profile',
        method: HttpMethod.PATCH,
        data: {
          payFrequency: frequency,
          needsPercent: split.needs / 100,
          wantsPercent: split.wants / 100,
          savingsPercent: split.savings / 100
        },
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      })
      // The current period's per-category budget changes with the split.
      await revalidateApi('auth/profile', 'periods')
      toast({ title: t('budget.saved'), status: 'success' })
    } catch (saveError) {
      toast({
        title: t('budget.error'),
        description: saveError instanceof Error ? saveError.message : undefined,
        status: 'error'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SettingsLayout
      title={t('budget.title')}
      isLoading={data === undefined && !error}
      bottomCta={
        <Button
          type="submit"
          form={FORM_ID}
          variant="brand"
          size="cta"
          w="full"
          isDisabled={difference !== 0}
          isLoading={isSaving}
        >
          {t('budget.submit')}
        </Button>
      }
    >
      <Stack
        as="form"
        id={FORM_ID}
        method="post"
        onSubmit={onSubmit}
        spacing="12px"
      >
        <Group>{t('budget.frequencyTitle')}</Group>
        <Flex gap="10px" role="group" aria-label={t('budget.frequencyTitle')}>
          {FREQUENCIES.map(option => (
            <ChoiceCard
              key={option}
              showRadio={false}
              title={t(`budget.frequency.${option}.title`)}
              hint={t(`budget.frequency.${option}.hint`)}
              isSelected={frequency === option}
              onClick={() => setFrequency(option)}
            />
          ))}
        </Flex>

        <Group>{t('budget.splitTitle')}</Group>
        <Box layerStyle="statusCard">
          <Flex
            h="22px"
            borderRadius="11px"
            overflow="hidden"
            gap="3px"
            mb="16px"
            bg={total === 0 ? 'track.bg' : undefined}
            aria-hidden
          >
            {SPLIT_KEYS.map(key => (
              <Box
                key={key}
                flex={split[key]}
                bg={`category.${SPLIT_CATEGORY[key]}`}
                transition="flex .2s"
              />
            ))}
            {/* What's missing shows as an empty stretch of the bar. */}
            {difference > 0 && <Box flex={difference} bg="track.bg" />}
          </Flex>

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
                  {t(`budget.split.${key}`)}
                </Flex>
                <Flex align="center" gap="10px">
                  <StepperButton
                    label={t('budget.decrease', {
                      name: t(`budget.split.${key}`)
                    })}
                    isDisabled={split[key] <= 0}
                    onClick={() => step(key, -SPLIT_STEP)}
                  >
                    −
                  </StepperButton>
                  <Text
                    w="52px"
                    textAlign="center"
                    fontWeight="bold"
                    fontSize="16px"
                    color="text.primary"
                    sx={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {split[key]}%
                  </Text>
                  <StepperButton
                    label={t('budget.increase', {
                      name: t(`budget.split.${key}`)
                    })}
                    isDisabled={split[key] >= 100}
                    onClick={() => step(key, SPLIT_STEP)}
                  >
                    +
                  </StepperButton>
                </Flex>
              </Flex>
            ))}
          </Stack>

          <Flex
            justify="space-between"
            align="center"
            fontSize="13.5px"
            mt="12px"
            pt="12px"
            borderTopWidth="1px"
            borderColor="border.subtle"
            aria-live="polite"
          >
            <Text color="text.secondary">{t('budget.total')}</Text>
            {difference === 0 ? (
              <Flex
                align="center"
                gap="5px"
                fontWeight="bold"
                color="money.incomeText"
              >
                <CheckIcon boxSize="16px" />
                100 %
              </Flex>
            ) : (
              <Text fontWeight="bold" color="status.pending">
                {t(difference > 0 ? 'budget.missing' : 'budget.over', {
                  total,
                  count: Math.abs(difference)
                })}
              </Text>
            )}
          </Flex>
        </Box>
        <Help>{t('budget.help')}</Help>
        <Button
          variant="link"
          alignSelf="center"
          h="44px"
          color="brand.text"
          fontSize="13.5px"
          fontWeight={600}
          onClick={() => setSplit(RECOMMENDED_SPLIT)}
        >
          {t('budget.reset')}
        </Button>
      </Stack>
    </SettingsLayout>
  )
}

export const getStaticProps = settingsStaticProps
