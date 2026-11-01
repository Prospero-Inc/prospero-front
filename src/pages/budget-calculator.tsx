import { categoryIcon } from '@/components/design'
import { AmountField } from '@/components/quick-add/fields'
import { parseAmount } from '@/components/quick-add/parseAmount'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { BottomSheet } from '@/components/ui/BottomSheet'
import type { Profile } from '@/interfaces'
import { formatMoney } from '@/lib/formatMoney'
import { useApi } from '@/lib/useApi'
import type { BudgetCategory } from '@/services/transactions'
import { Box, Button, Flex, Stack, Text, useDisclosure } from '@chakra-ui/react'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useState } from 'react'

const ROWS: {
  category: BudgetCategory
  key: 'needs' | 'wants' | 'savings'
  percent: (_profile: Profile) => number
}[] = [
  { category: 'Necesidad', key: 'needs', percent: p => p.needsPercent },
  { category: 'Deseo', key: 'wants', percent: p => p.wantsPercent },
  { category: 'Ahorro', key: 'savings', percent: p => p.savingsPercent }
]

/** What a new account starts with, until the profile loads. */
const DEFAULT_SPLIT = { needs: 0.5, wants: 0.3, savings: 0.2 }

/**
 * Calculadora (docs/diseno-mobile.html, 14): a big amount on top and what
 * goes to each category below, recalculated as you type, with *your* split
 * (not always 50/30/20). The long explanation sits behind "¿Cómo funciona?".
 */
export default function BudgetCalculatorPage() {
  const { t } = useTranslation('budgetCalculator')
  const { locale } = useRouter()
  const howItWorks = useDisclosure()
  const { data } = useApi<{ user: Profile }>('auth/profile')
  const profile = data?.user
  const [amountInput, setAmountInput] = useState('')
  const amount = parseAmount(amountInput) ?? 0

  const shares = ROWS.map(row => {
    const share = profile ? row.percent(profile) : DEFAULT_SPLIT[row.key]
    return {
      ...row,
      percent: Math.round(share * 100),
      value: Math.round(amount * share * 100) / 100
    }
  })
  const splitLabel = shares.map(share => share.percent).join(' / ')

  return (
    <SettingsLayout title={t('title')}>
      <Box bg="bg.surface" borderRadius="20px" px="16px" pt="14px" pb="10px">
        <Text
          textAlign="center"
          fontSize="13px"
          fontWeight={600}
          color="text.secondary"
        >
          {t('ifIGet')}
        </Text>
        <AmountField
          label={t('amount')}
          value={amountInput}
          onChange={setAmountInput}
          error={
            amountInput.trim() !== '' && parseAmount(amountInput) === null
              ? t('invalidAmount')
              : null
          }
        />
        <Text textAlign="center" fontSize="12.5px" color="text.secondary">
          {t('withYourSplit', { split: splitLabel })}
        </Text>
      </Box>

      <Stack
        spacing={0}
        bg="bg.surface"
        borderRadius="20px"
        px="14px"
        divider={<Box borderTopWidth="1px" borderColor="border.subtle" />}
        aria-live="polite"
      >
        {shares.map(share => {
          const CategoryIcon = categoryIcon(share.category)
          return (
            <Flex
              key={share.key}
              align="center"
              gap="12px"
              minH="68px"
              py="10px"
            >
              <Flex
                boxSize="44px"
                flex="none"
                borderRadius="13px"
                bg={`tint.${share.category}`}
                color="text.primary"
                direction="column"
                align="center"
                justify="center"
                fontSize="11px"
                fontWeight={800}
              >
                {/* The category's color on the icon only: as text, the
                    yellow of "Deseos" fails AA on its tint. */}
                <CategoryIcon
                  boxSize="16px"
                  color={`category.${share.category}`}
                  aria-hidden
                />
                {share.percent}%
              </Flex>
              <Box flex={1} minW={0}>
                <Text fontSize="14.5px" fontWeight={650} color="text.primary">
                  {t(`rows.${share.key}.title`)}
                </Text>
                <Text fontSize="12px" color="text.secondary" mt="2px">
                  {t(`rows.${share.key}.hint`)}
                </Text>
              </Box>
              <Text
                fontSize="16px"
                fontWeight="bold"
                color="text.primary"
                sx={{ fontVariantNumeric: 'tabular-nums' }}
                whiteSpace="nowrap"
              >
                {formatMoney(share.value, locale)}
              </Text>
            </Flex>
          )
        })}
      </Stack>

      <Button
        variant="ghost"
        h="44px"
        color="brand.text"
        fontSize="13.5px"
        fontWeight={600}
        onClick={howItWorks.onOpen}
      >
        {t('howItWorks.link', { split: splitLabel })}
      </Button>

      <BottomSheet
        isOpen={howItWorks.isOpen}
        onClose={howItWorks.onClose}
        title={t('howItWorks.title')}
      >
        <Stack spacing="12px" pb="12px" fontSize="14px" lineHeight="1.5">
          <Text color="text.secondary">{t('howItWorks.intro')}</Text>
          {shares.map(share => (
            <Box key={share.key}>
              <Text fontWeight={650} color="text.primary">
                {t(`rows.${share.key}.title`)} · {share.percent}%
              </Text>
              <Text color="text.primary">{t(`howItWorks.${share.key}`)}</Text>
            </Box>
          ))}
          <Text color="text.secondary">{t('howItWorks.yours')}</Text>
        </Stack>
      </BottomSheet>
    </SettingsLayout>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale as string, [
      'common',
      'sidebar',
      'mobileNav',
      'budgetCalculator'
    ]))
  }
})
