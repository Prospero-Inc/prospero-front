import {
  BankBadge,
  Chevron,
  Group,
  Help,
  IconBox,
  SwitchRow
} from '@/components/design/settings'
import {
  AlertIcon,
  BankIcon,
  CheckIcon,
  MailIcon,
  TrashIcon
} from '@/components/icons/app'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { useConfirm } from '@/components/ui/ConfirmSheet'
import { HttpMethod } from '@/enums'
import { HttpError } from '@/lib/apiService'
import type {
  FinancialInstitution,
  SupportedParser
} from '@/services/financialInstitutions'
import {
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import {
  type FormEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useState
} from 'react'

import { useErrorToast, useSettingsRequest } from './useSettingsRequest'

const OTHER = 'other'

/** `.lfield`: 13 px label over a 54 px field. */
const LabeledField = ({
  id,
  label,
  children
}: {
  id: string
  label: string
  children: ReactNode
}) => (
  <Box>
    <Text
      as="label"
      htmlFor={id}
      display="block"
      textStyle="fieldLabel"
      mb="6px"
    >
      {label}
    </Text>
    {children}
  </Box>
)

/** Light card the sheet's bank options sit on (design .frm #F7F7FB). */
const OptionCard = ({ children }: { children: ReactNode }) => (
  <Stack
    spacing={0}
    bg="choice.onBg"
    borderRadius="18px"
    px="14px"
    py="4px"
    divider={<Box borderTopWidth="1px" borderColor="border.subtle" />}
  >
    {children}
  </Stack>
)

const OptionRow = ({
  icon,
  label,
  trailing,
  isSelected,
  isDisabled,
  onClick
}: {
  icon: ReactElement
  label: string
  trailing?: ReactNode
  isSelected: boolean
  isDisabled?: boolean
  onClick: () => void
}) => (
  <Flex
    as="button"
    type="button"
    aria-pressed={isSelected}
    disabled={isDisabled}
    onClick={onClick}
    align="center"
    gap="12px"
    minH="56px"
    fontSize="15px"
    textAlign="left"
    _focusVisible={{ boxShadow: 'outline', outline: 'none' }}
    _disabled={{ cursor: 'default' }}
  >
    {icon}
    <Text flex={1} minW={0} fontWeight={600} color="text.primary" noOfLines={1}>
      {label}
    </Text>
    {isSelected ? <CheckIcon boxSize="18px" color="brand.text" /> : trailing}
  </Flex>
)

/**
 * "Agregar banco" (docs/diseno-mobile.html, 08): the banks we can read come
 * first; "Otro banco" asks for its name and warns that its movements stay
 * manual. The sender email is what Gmail searches for.
 */
export const AddBankSheet = ({
  isOpen,
  onClose,
  institutions,
  parsers,
  onSaved
}: {
  isOpen: boolean
  onClose: () => void
  institutions: FinancialInstitution[]
  parsers: SupportedParser[]
  onSaved: () => Promise<unknown>
}) => {
  const { t } = useTranslation('settings')
  const toast = useToast()
  const showError = useErrorToast()
  const request = useSettingsRequest()
  const [choice, setChoice] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [sender, setSender] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setChoice(null)
    setName('')
    setSender('')
  }, [isOpen])

  const choose = (key: string) => {
    setChoice(key)
    setName(
      key === OTHER
        ? ''
        : parsers.find(parser => parser.key === key)?.label ?? ''
    )
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!choice || !name.trim()) return
    setIsSaving(true)
    try {
      await request('/proxy/create-financial-institution', HttpMethod.POST, {
        name: name.trim(),
        ...(choice !== OTHER ? { parserKey: choice } : {}),
        ...(sender.trim() ? { senders: [sender.trim()] } : {})
      })
      await onSaved()
      toast({ title: t('gmail.banks.added'), status: 'success' })
      onClose()
    } catch (error) {
      if (error instanceof HttpError && error.status === 409)
        toast({ title: t('gmail.banks.duplicateSender'), status: 'warning' })
      else showError(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t('gmail.banks.addTitle')}
      footer={
        <Button
          type="submit"
          form="add-bank-form"
          variant="brand"
          size="cta"
          w="full"
          isDisabled={!choice || !name.trim()}
          isLoading={isSaving}
        >
          {t('gmail.banks.addSubmit')}
        </Button>
      }
    >
      <Stack
        as="form"
        id="add-bank-form"
        method="post"
        onSubmit={onSubmit}
        spacing="14px"
        pb="4px"
      >
        {parsers.length > 0 && (
          <Stack spacing="8px">
            <Group>{t('gmail.banks.supported')}</Group>
            <OptionCard>
              {parsers.map(parser => {
                const isAdded = institutions.some(
                  institution => institution.parserKey === parser.key
                )
                return (
                  <OptionRow
                    key={parser.key}
                    icon={<BankBadge name={parser.label} size="32px" />}
                    label={parser.label}
                    isSelected={choice === parser.key}
                    isDisabled={isAdded}
                    onClick={() => choose(parser.key)}
                    trailing={
                      isAdded ? (
                        <Text fontSize="12px" color="text.secondary">
                          {t('gmail.banks.alreadyAdded')}
                        </Text>
                      ) : undefined
                    }
                  />
                )
              })}
            </OptionCard>
          </Stack>
        )}
        <OptionCard>
          <OptionRow
            icon={
              <IconBox
                icon={<BankIcon boxSize="18px" />}
                bg="seg.bg"
                color="text.secondary"
              />
            }
            label={t('gmail.banks.other')}
            isSelected={choice === OTHER}
            onClick={() => choose(OTHER)}
            trailing={<Chevron />}
          />
        </OptionCard>

        {choice && (
          <>
            <LabeledField id="bank-name" label={t('gmail.banks.name')}>
              <Input
                id="bank-name"
                variant="design"
                autoComplete="organization"
                value={name}
                onChange={event => setName(event.target.value)}
                isRequired
              />
            </LabeledField>
            <LabeledField id="bank-sender" label={t('gmail.banks.sender')}>
              <Input
                id="bank-sender"
                variant="design"
                type="email"
                inputMode="email"
                autoComplete="off"
                autoCapitalize="none"
                placeholder={t('gmail.banks.senderPlaceholder')}
                value={sender}
                onChange={event => setSender(event.target.value)}
              />
            </LabeledField>
            {choice === OTHER && (
              <Flex
                gap="10px"
                align="flex-start"
                bg="notice.bg"
                borderRadius="16px"
                px="12px"
                py="10px"
              >
                <AlertIcon boxSize="18px" color="status.pending" mt="1px" />
                <Text fontSize="12.5px" lineHeight="1.4" color="text.primary">
                  {t('gmail.banks.manualNotice')}
                </Text>
              </Flex>
            )}
          </>
        )}
      </Stack>
    </BottomSheet>
  )
}

/**
 * One bank: pause or resume reading it, which of our readers understands its
 * emails, its sender addresses and delete.
 * Opened by tapping the bank's card.
 */
export const BankSheet = ({
  institution,
  parsers,
  onClose,
  onSaved
}: {
  institution: FinancialInstitution | null
  parsers: SupportedParser[]
  onClose: () => void
  onSaved: () => Promise<unknown>
}) => {
  const { t } = useTranslation('settings')
  const { t: tCommon } = useTranslation('common')
  const toast = useToast()
  const confirm = useConfirm()
  const showError = useErrorToast()
  const request = useSettingsRequest()
  const [sender, setSender] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => setSender(''), [institution?.id])

  if (!institution) return null
  const { id } = institution

  const run = async (key: string, action: () => Promise<unknown>) => {
    setBusy(key)
    try {
      await action()
      await onSaved()
      return true
    } catch (error) {
      if (error instanceof HttpError && error.status === 409)
        toast({ title: t('gmail.banks.duplicateSender'), status: 'warning' })
      else showError(error)
      return false
    } finally {
      setBusy(null)
    }
  }

  const onAddSender = async (event: FormEvent) => {
    event.preventDefault()
    const emailAddress = sender.trim()
    if (!emailAddress) return
    const added = await run('add', () =>
      request(`/proxy/add-institution-sender?id=${id}`, HttpMethod.POST, {
        emailAddress
      })
    )
    if (added) setSender('')
  }

  const onDelete = async () => {
    if (
      !(await confirm({
        title: t('gmail.banks.confirmDelete', { name: institution.name }),
        confirmLabel: tCommon('confirmSheet.delete'),
        destructive: true
      }))
    )
      return
    const deleted = await run('delete', () =>
      request(`/proxy/delete-financial-institution?id=${id}`, HttpMethod.DELETE)
    )
    if (deleted) onClose()
  }

  return (
    <BottomSheet isOpen onClose={onClose} title={institution.name}>
      <Stack spacing="12px" pb="4px">
        <Box bg="choice.onBg" borderRadius="18px" px="14px" py="2px">
          <SwitchRow
            title={t('gmail.banks.active')}
            hint={t(
              institution.parserKey
                ? 'gmail.banks.activeHint'
                : 'gmail.banks.activeHintManual'
            )}
            isOn={institution.isActive}
            isDisabled={busy !== null}
            onToggle={() =>
              run('active', () =>
                request(
                  `/proxy/update-financial-institution?id=${id}`,
                  HttpMethod.PATCH,
                  { isActive: !institution.isActive }
                )
              )
            }
          />
        </Box>

        {parsers.length > 0 && (
          <>
            <Group>{t('gmail.banks.reader')}</Group>
            <OptionCard>
              {[
                ...parsers.map(parser => ({
                  key: parser.key as string | null,
                  label: parser.label,
                  icon: <BankBadge name={parser.label} size="32px" />
                })),
                {
                  key: null,
                  label: t('gmail.banks.readerManual'),
                  icon: (
                    <IconBox
                      icon={<BankIcon boxSize="18px" />}
                      bg="seg.bg"
                      color="text.secondary"
                    />
                  )
                }
              ].map(option => (
                <OptionRow
                  key={option.key ?? OTHER}
                  icon={option.icon}
                  label={option.label}
                  isSelected={institution.parserKey === option.key}
                  isDisabled={busy !== null}
                  onClick={() =>
                    institution.parserKey !== option.key &&
                    run('reader', () =>
                      request(
                        `/proxy/update-financial-institution?id=${id}`,
                        HttpMethod.PATCH,
                        // null goes back to "manual only" explicitly.
                        { parserKey: option.key }
                      )
                    )
                  }
                />
              ))}
            </OptionCard>
          </>
        )}

        <Group>{t('gmail.banks.senders')}</Group>
        {institution.senders.length > 0 && (
          <Stack
            spacing={0}
            bg="choice.onBg"
            borderRadius="18px"
            px="14px"
            divider={<Box borderTopWidth="1px" borderColor="border.subtle" />}
          >
            {institution.senders.map(item => (
              <Flex key={item.id} align="center" gap="8px" minH="48px">
                <MailIcon boxSize="16px" color="text.secondary" />
                <Text flex={1} minW={0} fontSize="13.5px" noOfLines={1}>
                  {item.emailAddress}
                </Text>
                <IconButton
                  aria-label={t('gmail.banks.removeSender', {
                    email: item.emailAddress
                  })}
                  icon={<TrashIcon boxSize="18px" />}
                  variant="ghost"
                  color="icon.subtle"
                  mr="-10px"
                  isLoading={busy === `sender-${item.id}`}
                  isDisabled={busy !== null}
                  onClick={() =>
                    run(`sender-${item.id}`, () =>
                      request(
                        `/proxy/delete-institution-sender?id=${id}&senderId=${item.id}`,
                        HttpMethod.DELETE
                      )
                    )
                  }
                />
              </Flex>
            ))}
          </Stack>
        )}
        <Flex as="form" method="post" gap="8px" onSubmit={onAddSender}>
          <Input
            aria-label={t('gmail.banks.sender')}
            variant="design"
            type="email"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            placeholder={t('gmail.banks.senderPlaceholder')}
            value={sender}
            onChange={event => setSender(event.target.value)}
          />
          <Button
            type="submit"
            variant="line"
            size="cta"
            flexShrink={0}
            isDisabled={!sender.trim() || (busy !== null && busy !== 'add')}
            isLoading={busy === 'add'}
          >
            {t('gmail.banks.addSender')}
          </Button>
        </Flex>
        <Help>{t('gmail.banks.sendersHelp')}</Help>

        <Button
          variant="danger"
          size="ctaSm"
          leftIcon={<TrashIcon boxSize="18px" />}
          mt="6px"
          isLoading={busy === 'delete'}
          isDisabled={busy !== null && busy !== 'delete'}
          onClick={onDelete}
        >
          {t('gmail.banks.delete')}
        </Button>
      </Stack>
    </BottomSheet>
  )
}
