import { Help } from '@/components/design/settings'
import { BoltIcon, CheckIcon } from '@/components/icons/app'
import {
  useErrorToast,
  useSettingsRequest
} from '@/components/settings/useSettingsRequest'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { HttpMethod } from '@/enums'
import type { CreatedShortcutToken } from '@/services/shortcuts'
import { Box, Button, Flex, Stack, Text, useDisclosure } from '@chakra-ui/react'
import { Trans, useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { copyPendingText, copyText } from './copyToClipboard'
import { AVAILABLE_SCREENSHOTS, SCREENSHOT_SIZE } from './screenshots'
import { StepperItem, type StepState, StepText } from './StepperItem'

// Inlined at build time (NEXT_PUBLIC_*): see .env.example.
const SHORTCUT_ICLOUD_URL = process.env.NEXT_PUBLIC_SHORTCUT_ICLOUD_URL ?? ''

const MAX_NAME_LENGTH = 60
const TOKEN_PREFIX = 'prs_'

/** "prs_••••••••••••a9F2": enough to recognize it, not to use it. */
export const maskToken = (token: string): string =>
  `${TOKEN_PREFIX}${'•'.repeat(12)}${token.slice(-4)}`

/** design .tok: the token (masked once copied, whole and selectable when
 * the browser wouldn't copy it) and "✓ Copiado" / "Copiar". */
const TokenBox = ({
  token,
  isCopied,
  onCopy
}: {
  token: string
  isCopied: boolean
  onCopy: () => void
}) => {
  const { t } = useTranslation('settings')
  return (
    <Flex
      role="group"
      aria-label={t('shortcut.step1.tokenLabel')}
      align="center"
      gap="8px"
      h="44px"
      px="12px"
      mt="10px"
      borderRadius="12px"
      bg="field.bg"
      fontFamily="mono"
      fontSize="13px"
      color="text.primary"
    >
      <Box
        as="span"
        flex={1}
        minW={0}
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        userSelect={isCopied ? 'none' : 'all'}
        data-testid="shortcut-token"
      >
        {isCopied ? maskToken(token) : token}
      </Box>
      {isCopied ? (
        <Flex
          as="span"
          align="center"
          gap="4px"
          flexShrink={0}
          fontFamily="body"
          fontSize="12.5px"
          fontWeight={700}
          color="money.incomeText"
        >
          <CheckIcon boxSize="14px" />
          {t('shortcut.step1.copied')}
        </Flex>
      ) : (
        <Button
          variant="unstyled"
          h="44px"
          px="12px"
          mr="-12px"
          flexShrink={0}
          fontFamily="body"
          fontSize="12.5px"
          fontWeight={700}
          color="brand.text"
          onClick={onCopy}
        >
          {t('shortcut.step1.copy')}
        </Button>
      )}
    </Flex>
  )
}

/**
 * "Configurar el atajo" (docs/diseno-mobile.html, 18): vertical stepper —
 * token, install, automation — and the note on what triggers it.
 */
export const ShortcutSetup = ({ onCreated }: { onCreated: () => void }) => {
  const { t } = useTranslation('settings')
  const { locale } = useRouter()
  const request = useSettingsRequest()
  const showError = useErrorToast()
  const screenshots = useDisclosure()
  const [created, setCreated] = useState<CreatedShortcutToken | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [hasOpenedInstall, setHasOpenedInstall] = useState(false)

  const defaultName = () =>
    `iPhone · ${new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short'
    }).format(new Date())}`.slice(0, MAX_NAME_LENGTH)

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
    setCreated(token)
    setIsCreating(false)
    onCreated()
    setIsCopied((await copying).copied)
  }

  const onCopy = async () => setIsCopied(await copyText(created?.token ?? ''))

  const states: [StepState, StepState, StepState] = !created
    ? ['now', 'pending', 'pending']
    : hasOpenedInstall
    ? ['done', 'done', 'now']
    : ['done', 'now', 'pending']

  return (
    <Stack spacing="12px">
      <Text fontSize="13.5px" color="text.secondary" lineHeight="1.5">
        {t('shortcut.intro')}
      </Text>

      <Box
        as="ol"
        listStyleType="none"
        mt="4px"
        aria-label={t('shortcut.steps')}
      >
        <StepperItem
          number={1}
          state={states[0]}
          title={t('shortcut.step1.title')}
        >
          {created ? (
            <>
              <TokenBox
                token={created.token}
                isCopied={isCopied}
                onCopy={onCopy}
              />
              <StepText>{t('shortcut.step1.once')}</StepText>
            </>
          ) : (
            <>
              <StepText>{t('shortcut.step1.once')}</StepText>
              <Button
                variant="brand"
                size="ctaSm"
                w="full"
                mt="10px"
                isLoading={isCreating}
                onClick={onGenerate}
              >
                {t('shortcut.step1.generate')}
              </Button>
            </>
          )}
        </StepperItem>

        <StepperItem
          number={2}
          state={states[1]}
          title={t('shortcut.step2.title')}
        >
          <StepText>{t('shortcut.step2.body')}</StepText>
          {SHORTCUT_ICLOUD_URL ? (
            <Button
              as="a"
              href={SHORTCUT_ICLOUD_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="brand"
              size="ctaSm"
              w="full"
              mt="10px"
              leftIcon={<BoltIcon boxSize="16px" />}
              iconSpacing="8px"
              onClick={() => setHasOpenedInstall(true)}
            >
              {t('shortcut.step2.install')}
            </Button>
          ) : (
            <>
              <Button
                variant="brand"
                size="ctaSm"
                w="full"
                mt="10px"
                leftIcon={<BoltIcon boxSize="16px" />}
                iconSpacing="8px"
                isDisabled
                aria-describedby="shortcut-link-unavailable"
              >
                {t('shortcut.step2.install')}
              </Button>
              <StepText>
                <Box as="span" id="shortcut-link-unavailable">
                  {t('shortcut.step2.unavailable')}
                </Box>
              </StepText>
            </>
          )}
        </StepperItem>

        <StepperItem
          number={3}
          state={states[2]}
          title={t('shortcut.step3.title')}
          isLast
        >
          <Box
            mt="10px"
            bg="miniSteps.bg"
            borderRadius="14px"
            px="12px"
            py="10px"
            fontSize="12.5px"
            lineHeight="1.5"
            color="text.primary"
          >
            <Trans
              t={t}
              i18nKey="shortcut.step3.path"
              components={{
                b: <Text as="b" fontWeight={650} />,
                ar: <Box as="span" color="icon.subtle" mx="3px" aria-hidden />
              }}
            />
          </Box>
          {AVAILABLE_SCREENSHOTS.length > 0 && (
            <Button
              variant="unstyled"
              display="inline-flex"
              h="44px"
              mb="-10px"
              fontSize="12.5px"
              fontWeight={600}
              color="brand.text"
              onClick={screenshots.onOpen}
            >
              {t('shortcut.step3.screenshots')}
            </Button>
          )}
        </StepperItem>
      </Box>

      <Help>{t('shortcut.help')}</Help>

      {AVAILABLE_SCREENSHOTS.length > 0 && (
        <BottomSheet
          isOpen={screenshots.isOpen}
          onClose={screenshots.onClose}
          title={t('shortcut.step3.screenshots')}
        >
          <Stack spacing="16px" pb="16px">
            {AVAILABLE_SCREENSHOTS.map(shot => (
              <Box key={shot.path} maxW="260px" mx="auto" w="full">
                <Image
                  src={shot.path}
                  alt={t('shortcut.step3.screenshotAlt', { number: shot.step })}
                  width={SCREENSHOT_SIZE.width}
                  height={SCREENSHOT_SIZE.height}
                  sizes="260px"
                  style={{ width: '100%', height: 'auto', borderRadius: 22 }}
                />
              </Box>
            ))}
          </Stack>
        </BottomSheet>
      )}
    </Stack>
  )
}
