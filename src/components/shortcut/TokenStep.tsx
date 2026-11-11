import { StepTitle } from '@/components/design/settings'
import { AlertIcon, KeyIcon } from '@/components/icons/app'
import {
  useErrorToast,
  useSettingsRequest
} from '@/components/settings/useSettingsRequest'
import { HttpMethod } from '@/enums'
import type { CreatedShortcutToken } from '@/services/shortcuts'
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Text,
  useToast
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { type ReactNode, useRef, useState } from 'react'

import { copyPendingText, copyText } from './copyToClipboard'

const MAX_NAME_LENGTH = 60

interface TokenStepProps {
  /** Token just created on this visit (the only time it can be seen). */
  created: CreatedShortcutToken | null
  onCreated: (_token: CreatedShortcutToken) => void
  /** The step's screenshot. */
  children?: ReactNode
}

/** Step 1, "Generá tu token": creates it, copies it and shows it once. */
export const TokenStep = ({ created, onCreated, children }: TokenStepProps) => {
  const { t } = useTranslation('settings')
  const { locale } = useRouter()
  const toast = useToast()
  const request = useSettingsRequest()
  const showError = useErrorToast()
  const [isCreating, setIsCreating] = useState(false)
  const tokenInput = useRef<HTMLInputElement>(null)

  const defaultName = () =>
    t('shortcut.step1.defaultName', {
      date: new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short'
      }).format(new Date())
    }).slice(0, MAX_NAME_LENGTH)

  const notifyCopied = (copied: boolean) => {
    if (copied) toast({ title: t('shortcut.step1.copied'), status: 'success' })
    else {
      toast({ title: t('shortcut.step1.copyFailed'), status: 'warning' })
      tokenInput.current?.select()
    }
  }

  // iOS: the clipboard write has to start inside the tap, before the token
  // exists — `copyPendingText` is called synchronously with the request.
  const onGenerate = async () => {
    setIsCreating(true)
    const creating = request<CreatedShortcutToken>(
      '/proxy/create-shortcut-token',
      HttpMethod.POST,
      { name: defaultName() }
    )
    const copying = copyPendingText(creating.then(token => token.token)).catch(
      () => ({ copied: false })
    )
    let token: CreatedShortcutToken
    try {
      token = await creating
    } catch (error) {
      showError(error)
      setIsCreating(false)
      return
    }
    onCreated(token)
    setIsCreating(false)
    notifyCopied((await copying).copied)
  }

  const onCopy = async () => notifyCopied(await copyText(created?.token ?? ''))

  return (
    <Box layerStyle="statusCard">
      <StepTitle number={1}>{t('shortcut.step1.title')}</StepTitle>
      <Text textStyle="rowHint" mt="8px">
        {t('shortcut.step1.body')}
      </Text>

      {created && (
        <Box mt="12px" p="12px" borderRadius="14px" bg="status.pendingBg">
          <FormControl>
            <FormLabel textStyle="fieldLabel" mb="6px">
              {t('shortcut.step1.tokenLabel')}
            </FormLabel>
            <Flex gap="8px">
              <Input
                ref={tokenInput}
                value={created.token}
                isReadOnly
                onFocus={event => event.currentTarget.select()}
                variant="design"
                h="44px"
                fontSize="16px"
                fontFamily="mono"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                bg="bg.surface"
              />
              <Button
                variant="soft"
                size="ctaSm"
                flexShrink={0}
                px="16px"
                bg="bg.surface"
                onClick={onCopy}
              >
                {t('shortcut.step1.copy')}
              </Button>
            </Flex>
          </FormControl>
          <Flex
            align="flex-start"
            gap="8px"
            mt="10px"
            fontSize="12.5px"
            fontWeight={600}
            color="status.pending"
            role="note"
          >
            <AlertIcon boxSize="16px" mt="1px" flexShrink={0} />
            <Text as="span">{t('shortcut.step1.onceWarning')}</Text>
          </Flex>
        </Box>
      )}

      <Button
        variant={created ? 'line' : 'brand'}
        size="ctaSm"
        w="full"
        mt="12px"
        leftIcon={<KeyIcon boxSize="18px" />}
        isLoading={isCreating}
        onClick={onGenerate}
      >
        {t(
          created ? 'shortcut.step1.generateAnother' : 'shortcut.step1.generate'
        )}
      </Button>
      {children}
    </Box>
  )
}
