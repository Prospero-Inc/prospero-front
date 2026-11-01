import { categoryIcon, SegmentedControl } from '@/components/design'
import { ArrowDownIcon, ChevronRightIcon } from '@/components/icons/app'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { HttpMethod } from '@/enums'
import { getTodayLocalDate, localApiService } from '@/lib'
import { useRevalidateApi } from '@/lib/useApi'
import type { IncomeType } from '@/services/salary'
import type { BudgetCategory } from '@/services/transactions'
import {
  Box,
  Button,
  Collapse,
  Flex,
  Input,
  Text,
  useToast
} from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { type ReactNode, useRef, useState } from 'react'

import { parseAmount } from './parseAmount'

type Kind = 'expense' | 'income'

const CATEGORIES: BudgetCategory[] = ['Necesidad', 'Deseo', 'Ahorro']
const INCOME_TYPES: IncomeType[] = ['Payroll', 'Extra']

/** Design .cats3 button: 64 px, icon over label; selected = 2 px colored
 * border on the category's tint. */
const OptionTile = ({
  icon,
  label,
  isSelected,
  color,
  tint,
  onClick
}: {
  icon: ReactNode
  label: string
  isSelected: boolean
  color: string
  tint: string
  onClick: () => void
}) => (
  <Flex
    as="button"
    type="button"
    onClick={onClick}
    aria-pressed={isSelected}
    flex={1}
    h="64px"
    borderRadius="16px"
    borderWidth={isSelected ? '2px' : '1.5px'}
    borderColor={isSelected ? color : 'border.subtle'}
    bg={isSelected ? tint : 'transparent'}
    direction="column"
    align="center"
    justify="center"
    gap="5px"
    fontSize="13px"
    fontWeight={650}
    color="text.primary"
  >
    <Box color={color}>{icon}</Box>
    {label}
  </Flex>
)

/** "Hoy, 30 oct" / "Ayer, 29 oct" / "28 oct". */
const useDateLabel = () => {
  const { t } = useTranslation('common')
  const { locale = 'es' } = useRouter()
  return (date: string) => {
    const day = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC'
    })
      .format(new Date(`${date}T00:00:00.000Z`))
      .replace('.', '')
    const today = getTodayLocalDate()
    const yesterday = new Date(`${today}T00:00:00.000Z`)
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const capitalize = (text: string) =>
      text.charAt(0).toUpperCase() + text.slice(1)
    if (date === today)
      return `${capitalize(t('dashboard.home.today'))}, ${day}`
    if (date === yesterday.toISOString().slice(0, 10))
      return `${capitalize(t('dashboard.home.yesterday'))}, ${day}`
    return day
  }
}

/**
 * "+" from the tab bar (docs/diseno-mobile.html, 01 · "Botón + → hoja para
 * agregar"): log a movement in three taps — amount, category, save — with
 * today's date unless changed. Saves and refreshes the data in place.
 */
export const QuickAddSheet = ({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) => {
  const { t } = useTranslation('common')
  const toast = useToast()
  const { data: session } = useSession()
  const revalidateApi = useRevalidateApi()
  const dateLabel = useDateLabel()
  const amountRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)

  const [kind, setKind] = useState<Kind>('expense')
  const [amountInput, setAmountInput] = useState('')
  const [category, setCategory] = useState<BudgetCategory | null>(null)
  const [incomeType, setIncomeType] = useState<IncomeType | null>(null)
  const [showMore, setShowMore] = useState(false)
  const [date, setDate] = useState(getTodayLocalDate())
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const amount = parseAmount(amountInput)
  const hasChoice = kind === 'expense' ? category !== null : incomeType !== null
  const canSave = amount !== null && hasChoice && !!date && !isSaving
  const showAmountError = amountInput.trim() !== '' && amount === null

  const reset = () => {
    setKind('expense')
    setAmountInput('')
    setCategory(null)
    setIncomeType(null)
    setShowMore(false)
    // Today at the moment it's reopened: the app may stay open overnight.
    setDate(getTodayLocalDate())
    setDescription('')
  }

  const close = () => {
    reset()
    onClose()
  }

  const save = async () => {
    if (amount === null || !hasChoice) return
    setIsSaving(true)
    const common = {
      amount,
      date,
      ...(description.trim() && { description: description.trim() })
    }
    try {
      await localApiService.request({
        method: HttpMethod.POST,
        endPoint:
          kind === 'expense'
            ? '/proxy/create-transaction'
            : '/proxy/create-salary',
        data:
          kind === 'expense'
            ? { ...common, category }
            : {
                ...common,
                type: incomeType,
                // Same defaults as the income form: an Extra is not
                // earmarked to a category unless the user says so there.
                ...(incomeType === 'Extra' && {
                  distributeAutomatically: false
                })
              },
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      })
      toast({
        title: t(
          kind === 'expense' ? 'quickAdd.savedExpense' : 'quickAdd.savedIncome'
        ),
        status: 'success'
      })
      close()
      await revalidateApi('periods', 'transactions', 'salary', 'review-queue')
    } catch (error) {
      toast({
        title: t('quickAdd.error'),
        description: error instanceof Error ? error.message : undefined,
        status: 'error'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={close}
      title={t('quickAdd.title')}
      initialFocusRef={amountRef}
      footer={
        <Button
          w="full"
          h="54px"
          borderRadius="16px"
          bg="brand.solid"
          color="white"
          fontSize="16px"
          fontWeight="bold"
          _hover={{ bg: 'primary.600' }}
          isDisabled={!canSave}
          isLoading={isSaving}
          onClick={save}
        >
          {t(
            kind === 'expense' ? 'quickAdd.saveExpense' : 'quickAdd.saveIncome'
          )}
        </Button>
      }
    >
      <Box
        as="form"
        method="post"
        onSubmit={(event: React.FormEvent) => {
          event.preventDefault()
          if (canSave) save()
        }}
      >
        <SegmentedControl
          label={t('quickAdd.kind')}
          value={kind}
          onChange={setKind}
          options={[
            { value: 'expense', label: t('quickAdd.expense') },
            { value: 'income', label: t('quickAdd.income') }
          ]}
        />

        <Flex
          as="label"
          justify="center"
          align="baseline"
          pt="16px"
          pb="10px"
          fontSize="52px"
          fontWeight="bold"
          letterSpacing="-0.02em"
          lineHeight="1.1"
        >
          <Text
            as="span"
            color="text.secondary"
            fontWeight="semibold"
            opacity={0.7}
          >
            $
          </Text>
          <Input
            ref={amountRef}
            aria-label={t('quickAdd.amount')}
            value={amountInput}
            onChange={event => setAmountInput(event.target.value)}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            variant="unstyled"
            textAlign="left"
            fontSize="52px"
            fontWeight="bold"
            h="auto"
            w={`${Math.max(amountInput.length, 4) + 0.5}ch`}
            maxW="70%"
            color="text.primary"
            sx={{
              fontVariantNumeric: 'tabular-nums',
              caretColor: 'var(--chakra-colors-brand-solid)'
            }}
          />
        </Flex>
        {showAmountError && (
          <Text
            color="money.expenseText"
            fontSize="sm"
            textAlign="center"
            mb={2}
          >
            {t('quickAdd.invalidAmount')}
          </Text>
        )}

        <Flex
          gap="10px"
          mt="14px"
          mb="12px"
          role="group"
          aria-label={t(
            kind === 'expense' ? 'quickAdd.category' : 'quickAdd.incomeType'
          )}
        >
          {kind === 'expense'
            ? CATEGORIES.map(option => {
                const CategoryIcon = categoryIcon(option)
                return (
                  <OptionTile
                    key={option}
                    icon={<CategoryIcon boxSize="20px" />}
                    label={t(`quickAdd.categories.${option}`)}
                    isSelected={category === option}
                    color={`category.${option}`}
                    tint={`tint.${option}`}
                    onClick={() => setCategory(option)}
                  />
                )
              })
            : INCOME_TYPES.map(option => (
                <OptionTile
                  key={option}
                  icon={<ArrowDownIcon boxSize="20px" />}
                  label={t(`quickAdd.incomeTypes.${option}`)}
                  isSelected={incomeType === option}
                  color="money.income"
                  tint="tint.income"
                  onClick={() => setIncomeType(option)}
                />
              ))}
        </Flex>

        {/* Design .field: tapping the row opens the system date picker. */}
        <Flex
          as="label"
          position="relative"
          h="52px"
          borderRadius="14px"
          bg="field.bg"
          align="center"
          px="14px"
          gap="10px"
          fontSize="16px"
          mb="10px"
          cursor="pointer"
        >
          <Text as="span" color="text.secondary" fontSize="14px" w="84px">
            {t('quickAdd.date')}
          </Text>
          <Text as="span" fontWeight="semibold" color="text.primary">
            {date ? dateLabel(date) : '—'}
          </Text>
          <ChevronRightIcon boxSize="18px" ml="auto" color="text.secondary" />
          <Input
            ref={dateRef}
            type="date"
            value={date}
            onChange={event => setDate(event.target.value)}
            aria-label={t('quickAdd.date')}
            position="absolute"
            inset={0}
            h="full"
            opacity={0}
            cursor="pointer"
          />
        </Flex>

        <Box textAlign="center">
          <Button
            variant="unstyled"
            fontSize="14px"
            fontWeight="semibold"
            color="brand.text"
            h="auto"
            py="6px"
            onClick={() => setShowMore(open => !open)}
            aria-expanded={showMore}
          >
            {t(showMore ? 'quickAdd.fewerOptions' : 'quickAdd.moreOptions')}
          </Button>
        </Box>
        <Collapse in={showMore} animateOpacity>
          <Flex
            as="label"
            h="52px"
            borderRadius="14px"
            bg="field.bg"
            align="center"
            px="14px"
            gap="10px"
            mt="8px"
          >
            <Text as="span" color="text.secondary" fontSize="14px" w="84px">
              {t('quickAdd.note')}
            </Text>
            <Input
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder={t('quickAdd.descriptionPlaceholder')}
              variant="unstyled"
              fontSize="16px"
              fontWeight="semibold"
            />
          </Flex>
        </Collapse>
      </Box>
    </BottomSheet>
  )
}
