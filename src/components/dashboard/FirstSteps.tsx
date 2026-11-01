import { CheckIcon, ChevronRightIcon } from '@/components/icons/app'
import { useOpenQuickAdd } from '@/components/quick-add'
import type { Profile } from '@/interfaces'
import { useApi } from '@/lib/useApi'
import type { GmailConnectionStatus } from '@/services/gmail'
import { Box, Button, Flex, Stack, Text } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import NextLink from 'next/link'
import type { ReactNode } from 'react'

const percent = (value: number) => Math.round(value * 100)

/** Still the defaults the backend gives a new account. */
const isDefaultSplit = (profile: Profile) =>
  profile.payFrequency === 'Biweekly' &&
  percent(profile.needsPercent) === 50 &&
  percent(profile.wantsPercent) === 30 &&
  percent(profile.savingsPercent) === 20

/** design .check-item: a circle (green ✓ when done), title and hint, and
 * what to tap on the right. Done steps read struck through. */
const Step = ({
  isDone,
  title,
  hint,
  trailing,
  href,
  onClick
}: {
  isDone: boolean
  title: string
  hint: string
  trailing?: ReactNode
  href?: string
  onClick?: () => void
}) => (
  <Flex
    as={href ? NextLink : onClick ? 'button' : 'div'}
    {...(href ? { href } : onClick ? { type: 'button', onClick } : {})}
    align="center"
    gap="12px"
    minH="58px"
    w="full"
    textAlign="left"
    _focusVisible={{ boxShadow: 'outline', outline: 'none' }}
  >
    <Flex
      boxSize="26px"
      flex="none"
      borderRadius="full"
      borderWidth="2px"
      borderColor={isDone ? 'money.incomeText' : 'radio.off'}
      bg={isDone ? 'money.incomeText' : 'transparent'}
      color="white"
      align="center"
      justify="center"
      aria-hidden
    >
      {isDone && <CheckIcon boxSize="14px" />}
    </Flex>
    <Box flex={1} minW={0}>
      <Text
        fontSize="14.5px"
        fontWeight={600}
        color={isDone ? 'text.secondary' : 'text.primary'}
        textDecoration={isDone ? 'line-through' : undefined}
      >
        {title}
      </Text>
      <Text fontSize="12px" color="text.secondary" mt="2px">
        {hint}
      </Text>
    </Box>
    {trailing}
  </Flex>
)

/**
 * Inicio vacío (docs/diseno-mobile.html, 13): no income this period yet,
 * so instead of cards in zero, the three steps that make the budget work,
 * the next one highlighted. Each opens what solves it; once there's an
 * income the normal Inicio shows.
 */
export const FirstSteps = () => {
  const { t } = useTranslation('common')
  const openQuickAdd = useOpenQuickAdd()
  const { data: profileData } = useApi<{ user: Profile }>('auth/profile')
  const { data: gmail } = useApi<GmailConnectionStatus>('gmail/connection')
  const profile = profileData?.user
  const splitDone = profile ? !isDefaultSplit(profile) : false
  const gmailDone = gmail?.connected ?? false

  const splitHint = profile
    ? t('firstSteps.splitHint', {
        split: `${percent(profile.needsPercent)} / ${percent(
          profile.wantsPercent
        )} / ${percent(profile.savingsPercent)}`,
        frequency: t(`firstSteps.frequency.${profile.payFrequency}`)
      })
    : t('firstSteps.splitHintEmpty')

  return (
    <Stack spacing="12px">
      <Box
        bg="bg.surface"
        borderRadius="24px"
        borderWidth="1.5px"
        borderStyle="dashed"
        borderColor="radio.off"
        px="18px"
        py="20px"
      >
        <Text fontSize="13px" fontWeight={600} color="text.secondary">
          {t('firstSteps.eyebrow')}
        </Text>
        <Text
          as="h2"
          fontSize="21px"
          fontWeight="bold"
          lineHeight="1.25"
          color="text.primary"
          my="4px"
        >
          {t('firstSteps.title')}
        </Text>
        <Text fontSize="13px" lineHeight="1.45" color="text.secondary">
          {t('firstSteps.text')}
        </Text>
      </Box>

      <Stack
        as="ol"
        listStyleType="none"
        spacing={0}
        bg="bg.surface"
        borderRadius="20px"
        px="14px"
        py="6px"
        divider={<Box borderTopWidth="1px" borderColor="border.subtle" />}
      >
        <Box as="li">
          <Step
            href="/welcome"
            isDone={splitDone}
            title={t('firstSteps.split')}
            hint={splitHint}
            trailing={<ChevronRightIcon boxSize="16px" color="icon.subtle" />}
          />
        </Box>
        <Box as="li">
          <Step
            isDone={false}
            title={t('firstSteps.payment')}
            hint={t('firstSteps.paymentHint')}
            trailing={
              // design .go2: a 36 px pill inside a 44 px touch target.
              <Button
                variant="unstyled"
                h="44px"
                minW="auto"
                display="grid"
                placeItems="center"
                aria-label={t('firstSteps.addLabel')}
                onClick={() =>
                  openQuickAdd({ kind: 'income', incomeType: 'Payroll' })
                }
              >
                <Box
                  as="span"
                  display="grid"
                  placeItems="center"
                  h="36px"
                  px="12px"
                  borderRadius="11px"
                  bg="brand.solid"
                  color="white"
                  fontSize="12.5px"
                  fontWeight="bold"
                >
                  {t('firstSteps.add')}
                </Box>
              </Button>
            }
          />
        </Box>
        <Box as="li">
          <Step
            href="/settings/gmail"
            isDone={gmailDone}
            title={t('firstSteps.gmail')}
            hint={t('firstSteps.gmailHint')}
            trailing={<ChevronRightIcon boxSize="16px" color="icon.subtle" />}
          />
        </Box>
      </Stack>
    </Stack>
  )
}

/** design 13: "Todavía no hay movimientos" under the first steps. */
export const NoMovementsCard = () => {
  const { t } = useTranslation('common')
  return (
    <Box
      bg="bg.surface"
      borderRadius="20px"
      px="16px"
      py="20px"
      textAlign="center"
    >
      <Text fontSize="14px" fontWeight={650} color="text.primary">
        {t('firstSteps.noMovements')}
      </Text>
      <Text fontSize="12.5px" color="text.secondary" mt="4px">
        {t('firstSteps.noMovementsHint')}
      </Text>
    </Box>
  )
}
