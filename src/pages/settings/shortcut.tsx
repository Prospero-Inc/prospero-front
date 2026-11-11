import { Group, Help, StepTitle } from '@/components/design/settings'
import { AlertIcon, PhoneIcon } from '@/components/icons/app'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { settingsStaticProps } from '@/components/settings/settingsStaticProps'
import {
  useErrorToast,
  useSettingsRequest
} from '@/components/settings/useSettingsRequest'
import {
  SHORTCUT_SCREENSHOTS,
  ShortcutScreenshot
} from '@/components/shortcut/ShortcutScreenshot'
import { ShortcutTokenList } from '@/components/shortcut/ShortcutTokenList'
import { TokenStep } from '@/components/shortcut/TokenStep'
import {
  useWalletCategoryLabel,
  WalletCardCategory,
  WalletCardList
} from '@/components/shortcut/WalletCardList'
import { useConfirm } from '@/components/ui/ConfirmSheet'
import { HttpMethod } from '@/enums'
import { useIsIphone } from '@/hooks/useIsIphone'
import { HttpError } from '@/lib/apiService'
import { useApi, useRevalidateApi } from '@/lib/useApi'
import type { CreatedShortcutToken, ShortcutToken } from '@/services/shortcuts'
import type { WalletCard } from '@/services/walletCards'
import { Box, Button, Flex, Text, useToast } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'

// Inlined at build time (NEXT_PUBLIC_*): see .env.example.
const SHORTCUT_ICLOUD_URL = process.env.NEXT_PUBLIC_SHORTCUT_ICLOUD_URL ?? ''

const NO_TOKENS: ShortcutToken[] = []
const NO_CARDS: WalletCard[] = []

/**
 * Atajo de iPhone: set up the Shortcuts "Transaction" automation that
 * records every Apple Wallet payment (token → install → automation), the
 * tokens created so far and the category of each detected Wallet card.
 * Same language as the other screens under Más (docs/diseno-mobile.html).
 */
export default function ShortcutSettingsPage() {
  const { t } = useTranslation('settings')
  const { t: tCommon } = useTranslation('common')
  const toast = useToast()
  const confirm = useConfirm()
  const showError = useErrorToast()
  const request = useSettingsRequest()
  const revalidateApi = useRevalidateApi()
  const categoryLabel = useWalletCategoryLabel()
  const isIphone = useIsIphone()

  const { data: tokensData, error: tokensError } =
    useApi<ShortcutToken[]>('shortcuts/tokens')
  const { data: cardsData, mutate: mutateCards } =
    useApi<WalletCard[]>('wallet-cards')
  const tokens = tokensData ?? NO_TOKENS
  const cards = cardsData ?? NO_CARDS

  const [created, setCreated] = useState<CreatedShortcutToken | null>(null)
  const [revokingId, setRevokingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const onCreated = (token: CreatedShortcutToken) => {
    setCreated(token)
    revalidateApi('shortcuts')
  }

  const onRevoke = async (token: ShortcutToken) => {
    if (
      !(await confirm({
        title: t('shortcut.tokens.confirmRevoke'),
        description: t('shortcut.tokens.confirmRevokeDescription'),
        confirmLabel: t('shortcut.tokens.revokeConfirm'),
        destructive: true
      }))
    )
      return
    setRevokingId(token.id)
    try {
      await request(
        `/proxy/revoke-shortcut-token?id=${token.id}`,
        HttpMethod.POST
      )
      if (created?.id === token.id) setCreated(null)
      await revalidateApi('shortcuts')
      toast({ title: t('shortcut.tokens.revokedToast'), status: 'success' })
    } catch (error) {
      showError(error)
    } finally {
      setRevokingId(null)
    }
  }

  // Optimistic: the choice moves at once and goes back if saving fails.
  const onChangeCategory = async (
    card: WalletCard,
    category: WalletCardCategory
  ) => {
    const next = cards.map(item =>
      item.id === card.id ? { ...item, defaultCategory: category } : item
    )
    try {
      await mutateCards(
        async () => {
          await request(
            `/proxy/update-wallet-card?id=${card.id}`,
            HttpMethod.PATCH,
            { defaultCategory: category }
          )
          return next
        },
        { optimisticData: next, rollbackOnError: true, revalidate: false }
      )
      toast({
        title: t('shortcut.cards.saved', {
          name: card.name,
          category: categoryLabel(category)
        }),
        status: 'success'
      })
    } catch (error) {
      if (error instanceof HttpError && error.status === 409)
        toast({ title: t('shortcut.cards.nameTaken'), status: 'warning' })
      else showError(error)
      if (error instanceof HttpError && error.status === 404) mutateCards()
    }
  }

  const onDeleteCard = async (card: WalletCard) => {
    if (
      !(await confirm({
        title: t('shortcut.cards.confirmDelete', { name: card.name }),
        description: t('shortcut.cards.confirmDeleteDescription'),
        confirmLabel: tCommon('confirmSheet.delete'),
        destructive: true
      }))
    )
      return
    setDeletingId(card.id)
    try {
      await request(
        `/proxy/delete-wallet-card?id=${card.id}`,
        HttpMethod.DELETE
      )
      await mutateCards()
      toast({ title: t('shortcut.cards.deletedToast'), status: 'success' })
    } catch (error) {
      showError(error)
    } finally {
      setDeletingId(null)
    }
  }

  const screenshot = (index: 0 | 1 | 2) => {
    const shot = SHORTCUT_SCREENSHOTS[index]
    return (
      <ShortcutScreenshot
        src={shot.isAvailable ? shot.path : undefined}
        alt={t('shortcut.screenshot', { number: shot.step })}
        placeholder={t('shortcut.screenshotPending', { number: shot.step })}
      />
    )
  }

  return (
    <SettingsLayout
      title={t('shortcut.title')}
      isLoading={tokensData === undefined && !tokensError}
    >
      <Flex layerStyle="statusCard" align="flex-start" gap="12px">
        <Flex
          boxSize="44px"
          flexShrink={0}
          borderRadius="13px"
          bg="brand.subtle"
          color="brand.text"
          align="center"
          justify="center"
          aria-hidden
        >
          <PhoneIcon boxSize="22px" />
        </Flex>
        <Text fontSize="13.5px" color="text.secondary" lineHeight="1.45">
          {t('shortcut.intro')}
        </Text>
      </Flex>

      {isIphone === false && (
        <Flex
          role="note"
          align="flex-start"
          gap="10px"
          p="14px"
          borderRadius="18px"
          bg="status.pendingBg"
          color="status.pending"
          fontSize="13.5px"
          fontWeight={600}
          lineHeight="1.45"
        >
          <AlertIcon boxSize="18px" mt="1px" flexShrink={0} />
          <Text as="span">{t('shortcut.notIphone')}</Text>
        </Flex>
      )}

      <TokenStep created={created} onCreated={onCreated}>
        {screenshot(0)}
      </TokenStep>

      <Box layerStyle="statusCard">
        <StepTitle number={2}>{t('shortcut.step2.title')}</StepTitle>
        <Text textStyle="rowHint" mt="8px">
          {t('shortcut.step2.body')}
        </Text>
        {SHORTCUT_ICLOUD_URL ? (
          <Button
            as="a"
            href={SHORTCUT_ICLOUD_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="brand"
            size="ctaSm"
            w="full"
            mt="12px"
          >
            {t('shortcut.step2.install')}
          </Button>
        ) : (
          <>
            <Button
              variant="brand"
              size="ctaSm"
              w="full"
              mt="12px"
              isDisabled
              aria-describedby="shortcut-link-unavailable"
            >
              {t('shortcut.step2.install')}
            </Button>
            <Text
              id="shortcut-link-unavailable"
              textStyle="help"
              textAlign="center"
              mt="6px"
            >
              {t('shortcut.step2.unavailable')}
            </Text>
          </>
        )}
        {screenshot(1)}
      </Box>

      <Box layerStyle="statusCard">
        <StepTitle number={3}>{t('shortcut.step3.title')}</StepTitle>
        <Text textStyle="rowHint" mt="8px">
          {t('shortcut.step3.body')}
        </Text>
        {screenshot(2)}
      </Box>

      <Group>{t('shortcut.tokens.title')}</Group>
      <ShortcutTokenList
        tokens={tokens}
        revokingId={revokingId}
        onRevoke={onRevoke}
      />

      <Group>{t('shortcut.cards.title')}</Group>
      {cards.length > 0 && <Help>{t('shortcut.cards.hint')}</Help>}
      <WalletCardList
        cards={cards}
        deletingId={deletingId}
        onChangeCategory={onChangeCategory}
        onDelete={onDeleteCard}
      />
    </SettingsLayout>
  )
}

export const getStaticProps = settingsStaticProps
