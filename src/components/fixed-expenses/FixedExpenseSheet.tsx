import { SwitchRow } from '@/components/design/settings'
import {
  AmountField,
  CategoryTiles,
  PICKER_OVERLAY,
  PickerField,
  TextField
} from '@/components/quick-add/fields'
import { parseAmount } from '@/components/quick-add/parseAmount'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { dueDateFromDay, dueDayOf } from '@/lib/fixedExpenseDue'
import type { FixedExpenseData } from '@/services/fixedExpenses'
import type { BudgetCategory } from '@/services/transactions'
import { Box, Button, Collapse, Input, Stack, Text } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState
} from 'react'

const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, index) => index + 1)

export interface EditableFixedExpense extends FixedExpenseData {
  id: number
}

/**
 * "Nuevo gasto fijo" / "Editar gasto fijo" (docs/diseno-mobile.html, 06: a
 * sheet from Fijos), drawn like "Nuevo movimiento": the amount big on top,
 * the name, the category as three buttons, the day it's due as a tappable
 * row, "Recordarme" as a switch and the note under "Más opciones".
 */
export const FixedExpenseSheet = ({
  isOpen,
  onClose,
  fixedExpense,
  isSaving,
  onSave,
  onDelete
}: {
  isOpen: boolean
  onClose: () => void
  /** Given: edit it; null: a new one. */
  fixedExpense: EditableFixedExpense | null
  isSaving: boolean
  onSave: (_data: FixedExpenseData) => void
  onDelete: (_fixedExpense: EditableFixedExpense) => void
}) => {
  const { t } = useTranslation('fixedExpenses')
  const amountRef = useRef<HTMLInputElement>(null)
  const [amountInput, setAmountInput] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<BudgetCategory | null>(null)
  const [dueDay, setDueDay] = useState(1)
  const [reminder, setReminder] = useState(false)
  const [description, setDescription] = useState('')
  const [showMore, setShowMore] = useState(false)
  const isEditing = fixedExpense !== null

  // Each time it opens: empty, or what the fixed expense has now.
  useEffect(() => {
    if (!isOpen) return
    setAmountInput(
      fixedExpense
        ? Number.isInteger(fixedExpense.amount)
          ? String(fixedExpense.amount)
          : fixedExpense.amount.toFixed(2)
        : ''
    )
    setName(fixedExpense?.name ?? '')
    setCategory(fixedExpense?.budgetCategory ?? null)
    setDueDay(fixedExpense ? dueDayOf(fixedExpense.dueDate) : 1)
    setReminder(fixedExpense?.reminder ?? false)
    setDescription(fixedExpense?.description ?? '')
    setShowMore(!!fixedExpense?.description)
  }, [isOpen, fixedExpense])

  const amount = parseAmount(amountInput)
  const canSave =
    amount !== null && name.trim() !== '' && category !== null && !isSaving
  const showAmountError = amountInput.trim() !== '' && amount === null

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!canSave || amount === null || category === null) return
    onSave({
      amount,
      name: name.trim(),
      budgetCategory: category,
      dueDate: dueDateFromDay(dueDay),
      reminder,
      description: description.trim()
    })
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t(isEditing ? 'form.editTitle' : 'form.createTitle')}
      initialFocusRef={amountRef}
      footer={
        <Box w="full">
          <Button
            variant="brand"
            size="cta"
            w="full"
            isDisabled={!canSave}
            isLoading={isSaving}
            onClick={() => submit()}
          >
            {t(isEditing ? 'form.submitEdit' : 'form.submit')}
          </Button>
          {fixedExpense && (
            <Button
              variant="ghost"
              w="full"
              h="44px"
              mt="6px"
              color="money.expenseText"
              fontSize="14px"
              fontWeight={600}
              isDisabled={isSaving}
              onClick={() => onDelete(fixedExpense)}
            >
              {t('form.delete')}
            </Button>
          )}
        </Box>
      }
    >
      <Stack
        as="form"
        id="fixed-expense-form"
        method="post"
        onSubmit={submit}
        spacing="10px"
      >
        <AmountField
          inputRef={amountRef}
          label={t('form.labelAmount')}
          value={amountInput}
          onChange={setAmountInput}
          error={showAmountError ? t('form.invalidAmount') : null}
        />

        <TextField label={t('form.labelName')}>
          <Input
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder={t('form.namePlaceholder')}
            variant="unstyled"
            fontSize="16px"
            fontWeight="semibold"
            autoComplete="off"
          />
        </TextField>

        <Box pt="4px" pb="2px">
          <CategoryTiles
            label={t('form.labelBudgetCategory')}
            value={category}
            onChange={setCategory}
            labelOf={option => t(`categories.${option}`)}
          />
        </Box>

        <PickerField
          label={t('form.labelDueDate')}
          value={t('form.dueDayValue', { day: dueDay })}
        >
          <Box
            as="select"
            aria-label={t('form.labelDueDate')}
            value={dueDay}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setDueDay(Number(event.target.value))
            }
            fontSize="16px"
            {...PICKER_OVERLAY}
          >
            {DAYS_OF_MONTH.map(day => (
              <option key={day} value={day}>
                {t('form.dueDayOption', { day })}
              </option>
            ))}
          </Box>
        </PickerField>
        <Text textStyle="help" mx="4px" mt="-4px">
          {t('form.dueDayHelper')}
        </Text>

        <Box bg="field.bg" borderRadius="14px" px="14px">
          <SwitchRow
            title={t('form.labelReminder')}
            hint={t('form.reminderHint')}
            isOn={reminder}
            onToggle={() => setReminder(on => !on)}
          />
        </Box>

        <Box textAlign="center">
          <Button
            variant="unstyled"
            fontSize="14px"
            fontWeight="semibold"
            color="brand.text"
            h="44px"
            onClick={() => setShowMore(open => !open)}
            aria-expanded={showMore}
          >
            {t(showMore ? 'form.fewerOptions' : 'form.moreOptions')}
          </Button>
        </Box>
        <Collapse in={showMore} animateOpacity>
          <TextField label={t('form.labelDescription')}>
            <Input
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder={t('form.descriptionPlaceholder')}
              variant="unstyled"
              fontSize="16px"
              fontWeight="semibold"
            />
          </TextField>
        </Collapse>
      </Stack>
    </BottomSheet>
  )
}
