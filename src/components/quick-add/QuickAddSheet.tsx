import { categoryIcon, Chip, SegmentedControl } from '@/components/design'
import { ArrowDownIcon, ChevronRightIcon } from '@/components/icons/app'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { useConfirm } from '@/components/ui/ConfirmSheet'
import { HttpMethod } from '@/enums'
import { getTodayLocalDate, localApiService } from '@/lib'
import { useRevalidateApi, useUpdateApiCache } from '@/lib/useApi'
import type { IncomeType, SalaryListItem } from '@/services/salary'
import type {
  BudgetCategory,
  PeriodOverride,
  TransactionListItem
} from '@/services/transactions'
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
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { parseAmount } from './parseAmount'

type Kind = 'expense' | 'income'

/** A movement from the list, opened in the sheet to edit it. */
export type EditableMovement =
  | { kind: 'expense'; title: string; item: TransactionListItem }
  | { kind: 'income'; title: string; item: SalaryListItem }

/** Which period an expense counts in: by its date, or forced. */
type PeriodChoice = 'auto' | PeriodOverride
const PERIOD_CHOICES: PeriodChoice[] = ['auto', 'Previous', 'Current']

/** Where an Extra income goes: nowhere in particular, split by the user's
 * percentages, or all to one category. */
type Destination = 'none' | 'split' | BudgetCategory
const DESTINATIONS: Destination[] = [
  'none',
  'split',
  'Necesidad',
  'Deseo',
  'Ahorro'
]

const destinationOf = (item: SalaryListItem): Destination =>
  item.distributeAutomatically
    ? 'split'
    : item.budgetCategory
    ? item.budgetCategory
    : 'none'

/** "12.5" → "12.50": the amount as the field shows it. */
const amountText = (amount: number) =>
  Number.isInteger(amount) ? String(amount) : amount.toFixed(2)

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

/** A labeled row of chips (design .chip) for the less used options. */
const OptionChips = <T extends string>({
  label,
  options,
  value,
  onChange
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (_value: T) => void
}) => (
  <Box mt="12px">
    <Text fontSize="13px" fontWeight={600} color="field.label" mb="8px">
      {label}
    </Text>
    <Flex gap="8px" wrap="wrap" role="group" aria-label={label}>
      {options.map(option => (
        <Chip
          key={option.value}
          isOn={option.value === value}
          onClick={() => onChange(option.value)}
          h="44px"
          borderRadius="22px"
        >
          {option.label}
        </Chip>
      ))}
    </Flex>
  </Box>
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
  onClose,
  movement = null
}: {
  isOpen: boolean
  onClose: () => void
  /** Given: the sheet edits this movement instead of creating one. */
  movement?: EditableMovement | null
}) => {
  const { t } = useTranslation('common')
  const toast = useToast()
  const confirm = useConfirm()
  const { data: session } = useSession()
  const revalidateApi = useRevalidateApi()
  const updateApiCache = useUpdateApiCache()
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
  const [periodChoice, setPeriodChoice] = useState<PeriodChoice>('auto')
  const [destination, setDestination] = useState<Destination>('none')
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = movement !== null

  // Opened on a movement: start from what it has now.
  useEffect(() => {
    if (!isOpen || !movement) return
    const { item } = movement
    setKind(movement.kind)
    setAmountInput(amountText(item.amount))
    setDate(item.date.slice(0, 10))
    setDescription(item.description ?? '')
    if (movement.kind === 'expense') {
      setCategory(movement.item.category)
      setPeriodChoice(movement.item.periodOverride || 'auto')
    } else {
      setIncomeType(movement.item.type ?? 'Payroll')
      setDestination(destinationOf(movement.item))
    }
    setShowMore(
      !!item.description ||
        (movement.kind === 'expense'
          ? !!movement.item.periodOverride
          : destinationOf(movement.item) !== 'none')
    )
  }, [isOpen, movement])

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
    setPeriodChoice('auto')
    setDestination('none')
  }

  const close = () => {
    reset()
    onClose()
  }

  /** What an Extra income's destination means for the API. */
  const destinationFields = () =>
    destination === 'split'
      ? { distributeAutomatically: true, budgetCategory: null }
      : destination === 'none'
      ? { distributeAutomatically: false, budgetCategory: null }
      : { distributeAutomatically: false, budgetCategory: destination }

  /** The body to send: everything for a new one; only what changed when
   * editing. */
  const payload = (): Record<string, unknown> => {
    const note = description.trim()
    if (kind === 'expense') {
      const fields = {
        amount,
        date,
        category,
        description: note,
        periodOverride: periodChoice === 'auto' ? null : periodChoice
      }
      if (movement?.kind !== 'expense')
        return {
          amount,
          date,
          category,
          ...(note && { description: note }),
          ...(periodChoice !== 'auto' && { periodOverride: periodChoice })
        }
      const before = movement.item
      return Object.fromEntries(
        Object.entries(fields).filter(([key, value]) => {
          const previous =
            key === 'periodOverride'
              ? before.periodOverride || null
              : key === 'description'
              ? before.description ?? ''
              : key === 'date'
              ? before.date.slice(0, 10)
              : before[key as keyof typeof before]
          return value !== previous
        })
      )
    }

    // Budget fields only exist for Extra; the API rejects them on Payroll.
    const budget = incomeType === 'Extra' ? destinationFields() : {}
    if (movement?.kind !== 'income')
      return {
        amount,
        date,
        type: incomeType,
        ...(note && { description: note }),
        ...(incomeType === 'Extra' && {
          distributeAutomatically: destination === 'split',
          ...(destination !== 'split' &&
            destination !== 'none' && { budgetCategory: destination })
        })
      }
    const before = movement.item
    const changed: Record<string, unknown> = {}
    if (amount !== before.amount) changed.amount = amount
    if (date !== before.date.slice(0, 10)) changed.date = date
    if (incomeType !== (before.type ?? 'Payroll')) changed.type = incomeType
    if (note !== (before.description ?? '')) changed.description = note
    if (
      incomeType === 'Extra' &&
      (changed.type !== undefined || destination !== destinationOf(before))
    )
      Object.assign(changed, budget)
    return changed
  }

  const refresh = () =>
    revalidateApi('periods', 'transactions', 'salary', 'review-queue')

  const save = async () => {
    if (amount === null || !hasChoice) return
    const data = payload()
    if (isEditing && Object.keys(data).length === 0) {
      close()
      return
    }
    setIsSaving(true)
    try {
      await localApiService.request({
        method: movement ? HttpMethod.PATCH : HttpMethod.POST,
        endPoint: movement
          ? `/proxy/${
              movement.kind === 'expense'
                ? 'update-transaction'
                : 'update-salary'
            }?id=${movement.item.id}`
          : kind === 'expense'
          ? '/proxy/create-transaction'
          : '/proxy/create-salary',
        data,
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      })
      toast({
        title: t(
          isEditing
            ? 'quickAdd.edit.saved'
            : kind === 'expense'
            ? 'quickAdd.savedExpense'
            : 'quickAdd.savedIncome'
        ),
        status: 'success'
      })
      close()
      await refresh()
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

  // The row leaves the list at once; if deleting fails, refreshing brings
  // it back.
  const remove = async () => {
    if (!movement) return
    const isExpense = movement.kind === 'expense'
    if (
      !(await confirm({
        title: t('quickAdd.edit.confirmDelete', { name: movement.title }),
        description: t(
          isExpense
            ? 'quickAdd.edit.deleteExpenseHint'
            : 'quickAdd.edit.deleteIncomeHint'
        ),
        confirmLabel: t(
          isExpense
            ? 'quickAdd.edit.deleteExpense'
            : 'quickAdd.edit.deleteIncome'
        ),
        destructive: true
      }))
    )
      return
    const { id } = movement.item
    const withoutIt = (rows: { id: number }[]) =>
      Array.isArray(rows) ? rows.filter(row => row.id !== id) : rows
    if (isExpense) {
      updateApiCache('periods/transactions', withoutIt)
      updateApiCache('transactions', withoutIt)
    } else {
      updateApiCache('periods/salary', withoutIt)
      updateApiCache('salary', withoutIt)
    }
    close()
    try {
      await localApiService.request({
        method: HttpMethod.DELETE,
        endPoint: `/proxy/${
          isExpense ? 'delete-transaction' : 'delete-salary'
        }?id=${id}`,
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      })
      toast({
        title: t(
          isExpense
            ? 'quickAdd.edit.deletedExpense'
            : 'quickAdd.edit.deletedIncome'
        ),
        status: 'success'
      })
    } catch (error) {
      toast({
        title: t('quickAdd.edit.deleteError'),
        description: error instanceof Error ? error.message : undefined,
        status: 'error'
      })
    } finally {
      await refresh()
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={close}
      title={t(
        isEditing
          ? kind === 'expense'
            ? 'quickAdd.edit.titleExpense'
            : 'quickAdd.edit.titleIncome'
          : 'quickAdd.title'
      )}
      initialFocusRef={amountRef}
      footer={
        <Box w="full">
          <Button
            variant="brand"
            size="cta"
            w="full"
            isDisabled={!canSave}
            isLoading={isSaving}
            onClick={save}
          >
            {t(
              isEditing
                ? 'quickAdd.edit.save'
                : kind === 'expense'
                ? 'quickAdd.saveExpense'
                : 'quickAdd.saveIncome'
            )}
          </Button>
          {isEditing && (
            <Button
              variant="ghost"
              w="full"
              h="44px"
              mt="6px"
              color="money.expenseText"
              fontSize="14px"
              fontWeight={600}
              isDisabled={isSaving}
              onClick={remove}
            >
              {t(
                kind === 'expense'
                  ? 'quickAdd.edit.deleteExpense'
                  : 'quickAdd.edit.deleteIncome'
              )}
            </Button>
          )}
        </Box>
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
        {/* An expense and an income live in different places in the API:
            editing one can't turn it into the other. */}
        {!isEditing && (
          <SegmentedControl
            label={t('quickAdd.kind')}
            value={kind}
            onChange={setKind}
            options={[
              { value: 'expense', label: t('quickAdd.expense') },
              { value: 'income', label: t('quickAdd.income') }
            ]}
          />
        )}

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
          {kind === 'expense' ? (
            <OptionChips
              label={t('quickAdd.period.label')}
              options={PERIOD_CHOICES.map(option => ({
                value: option,
                label: t(`quickAdd.period.${option}`)
              }))}
              value={periodChoice}
              onChange={setPeriodChoice}
            />
          ) : (
            incomeType === 'Extra' && (
              <OptionChips
                label={t('quickAdd.destination.label')}
                options={DESTINATIONS.map(option => ({
                  value: option,
                  label: t(`quickAdd.destination.${option}`)
                }))}
                value={destination}
                onChange={setDestination}
              />
            )
          )}
        </Collapse>
      </Box>
    </BottomSheet>
  )
}
