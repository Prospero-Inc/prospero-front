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
  FormControl,
  FormLabel,
  Input,
  SimpleGrid,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { useRef, useState } from 'react'

import { parseAmount } from './parseAmount'

type Kind = 'expense' | 'income'

const CATEGORIES: BudgetCategory[] = ['Necesidad', 'Deseo', 'Ahorro']
const INCOME_TYPES: IncomeType[] = ['Payroll', 'Extra']

/**
 * Segmented choice: big, one tap. Selected = 2 px border and dot in the
 * option's color with dark text — readable on every color (white text on
 * the Deseo yellow wouldn't pass AA).
 */
const Choice = ({
  label,
  isSelected,
  color,
  onClick
}: {
  label: string
  isSelected: boolean
  color: string
  onClick: () => void
}) => (
  <Button
    onClick={onClick}
    aria-pressed={isSelected}
    minH="48px"
    variant="outline"
    borderWidth="2px"
    borderColor={isSelected ? color : 'border.subtle'}
    bg={isSelected ? 'bg.subtle' : 'transparent'}
    color="text.primary"
    fontWeight={isSelected ? 'bold' : 'semibold'}
    leftIcon={
      <Box
        aria-hidden
        w={2.5}
        h={2.5}
        borderRadius="full"
        bg={color}
        opacity={isSelected ? 1 : 0.5}
      />
    }
    _hover={{ borderColor: color }}
    _active={{ bg: 'bg.subtle' }}
  >
    {label}
  </Button>
)

/**
 * "+" from the tab bar (docs/diseno-mobile.html): log a movement in three
 * taps — amount, category, save. Date is today unless changed under "Más
 * opciones" (with the optional description). Saves and refreshes the data
 * in place; no page change.
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
  const amountRef = useRef<HTMLInputElement>(null)

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
          colorScheme="primary"
          w="full"
          minH="52px"
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
      <Stack
        as="form"
        method="post"
        spacing={5}
        pb={2}
        onSubmit={event => {
          event.preventDefault()
          if (canSave) save()
        }}
      >
        <SimpleGrid
          columns={2}
          spacing={2}
          role="group"
          aria-label={t('quickAdd.kind')}
        >
          <Choice
            label={t('quickAdd.expense')}
            isSelected={kind === 'expense'}
            color="money.expense"
            onClick={() => setKind('expense')}
          />
          <Choice
            label={t('quickAdd.income')}
            isSelected={kind === 'income'}
            color="money.income"
            onClick={() => setKind('income')}
          />
        </SimpleGrid>

        <FormControl isInvalid={showAmountError}>
          <FormLabel color="text.secondary">{t('quickAdd.amount')}</FormLabel>
          <Flex align="center" gap={2}>
            <Text fontSize="4xl" fontWeight="bold" color="text.secondary">
              $
            </Text>
            <Input
              ref={amountRef}
              value={amountInput}
              onChange={event => setAmountInput(event.target.value)}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              fontSize="4xl"
              fontWeight="bold"
              h="64px"
              variant="flushed"
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            />
          </Flex>
          {showAmountError && (
            <Text color="money.expenseText" fontSize="sm" mt={1}>
              {t('quickAdd.invalidAmount')}
            </Text>
          )}
        </FormControl>

        {kind === 'expense' ? (
          <Box role="group" aria-label={t('quickAdd.category')}>
            <Text color="text.secondary" mb={2}>
              {t('quickAdd.category')}
            </Text>
            <SimpleGrid columns={3} spacing={2}>
              {CATEGORIES.map(option => (
                <Choice
                  key={option}
                  label={t(`quickAdd.categories.${option}`)}
                  isSelected={category === option}
                  color={`category.${option}`}
                  onClick={() => setCategory(option)}
                />
              ))}
            </SimpleGrid>
          </Box>
        ) : (
          <Box role="group" aria-label={t('quickAdd.incomeType')}>
            <Text color="text.secondary" mb={2}>
              {t('quickAdd.incomeType')}
            </Text>
            <SimpleGrid columns={2} spacing={2}>
              {INCOME_TYPES.map(option => (
                <Choice
                  key={option}
                  label={t(`quickAdd.incomeTypes.${option}`)}
                  isSelected={incomeType === option}
                  color="money.income"
                  onClick={() => setIncomeType(option)}
                />
              ))}
            </SimpleGrid>
          </Box>
        )}

        <Box>
          <Button
            variant="link"
            color="brand.text"
            onClick={() => setShowMore(open => !open)}
            aria-expanded={showMore}
          >
            {t(showMore ? 'quickAdd.fewerOptions' : 'quickAdd.moreOptions')}
          </Button>
          <Collapse in={showMore} animateOpacity>
            <Stack spacing={4} pt={4}>
              <FormControl>
                <FormLabel>{t('quickAdd.date')}</FormLabel>
                <Input
                  type="date"
                  value={date}
                  onChange={event => setDate(event.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>{t('quickAdd.description')}</FormLabel>
                <Input
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                  placeholder={t('quickAdd.descriptionPlaceholder')}
                />
              </FormControl>
            </Stack>
          </Collapse>
        </Box>
      </Stack>
    </BottomSheet>
  )
}
