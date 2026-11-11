import { Group, Help } from '@/components/design/settings'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { settingsStaticProps } from '@/components/settings/settingsStaticProps'
import {
  useErrorToast,
  useSettingsRequest
} from '@/components/settings/useSettingsRequest'
import { ShortcutLive } from '@/components/shortcut/ShortcutLive'
import { ShortcutSetup } from '@/components/shortcut/ShortcutSetup'
import { ShortcutTokens } from '@/components/shortcut/ShortcutTokens'
import { WalletCards } from '@/components/shortcut/WalletCards'
import { WalletCardSheet } from '@/components/shortcut/WalletCardSheet'
import type { WalletCardCategory } from '@/components/shortcut/walletCardStyle'
import { useConfirm } from '@/components/ui/ConfirmSheet'
import { HttpMethod } from '@/enums'
import { HttpError } from '@/lib/apiService'
import { useApi, useRevalidateApi } from '@/lib/useApi'
import type { ShortcutStatus, ShortcutToken } from '@/services/shortcuts'
import type { WalletCard } from '@/services/walletCards'
import { Button, Text, useToast } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'

const NO_TOKENS: ShortcutToken[] = []
const NO_CARDS: WalletCard[] = []

/**
 * Atajo de iPhone (docs/diseno-mobile.html, 18–19). Until the shortcut has
 * sent an expense: the three-step setup on a white screen. Once it has:
 * "Funcionando", the Wallet cards (category per card, in a sheet) and the
 * tokens, with the steps one tap away.
 */
export default function ShortcutSettingsPage() {
  const { t } = useTranslation('settings')
  const toast = useToast()
  const confirm = useConfirm()
  const showError = useErrorToast()
  const request = useSettingsRequest()
  const revalidateApi = useRevalidateApi()

  const { data: status, error: statusError } =
    useApi<ShortcutStatus>('shortcuts/status')
  const { data: tokensData } = useApi<ShortcutToken[]>('shortcuts/tokens')
  const { data: cardsData, mutate: mutateCards } =
    useApi<WalletCard[]>('wallet-cards')
  const tokens = (tokensData ?? NO_TOKENS).filter(token => !token.revokedAt)
  const cards = cardsData ?? NO_CARDS

  const [showSteps, setShowSteps] = useState(false)
  const [revokingId, setRevokingId] = useState<number | null>(null)
  const [openCardId, setOpenCardId] = useState<number | null>(null)
  const [isSavingCard, setIsSavingCard] = useState(false)
  const openCard = cards.find(card => card.id === openCardId) ?? null

  const last = status?.lastTransaction ?? null

  const onRevoke = async (token: ShortcutToken) => {
    if (
      !(await confirm({
        title: t('shortcut.tokens.confirmRevoke'),
        description: t('shortcut.tokens.confirmRevokeDescription'),
        confirmLabel: t('shortcut.tokens.revoke'),
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
      await revalidateApi('shortcuts')
      toast({ title: t('shortcut.tokens.revokedToast'), status: 'success' })
    } catch (error) {
      showError(error)
    } finally {
      setRevokingId(null)
    }
  }

  const onSaveCard = async (card: WalletCard, category: WalletCardCategory) => {
    if (category === card.defaultCategory && !card.isNew) {
      setOpenCardId(null)
      return
    }
    setIsSavingCard(true)
    try {
      await request(
        `/proxy/update-wallet-card?id=${card.id}`,
        HttpMethod.PATCH,
        {
          defaultCategory: category
        }
      )
      await mutateCards()
      setOpenCardId(null)
    } catch (error) {
      if (error instanceof HttpError && error.status === 409)
        toast({ title: t('shortcut.cards.nameTaken'), status: 'warning' })
      else showError(error)
    } finally {
      setIsSavingCard(false)
    }
  }

  const isLive = last !== null

  return (
    <SettingsLayout
      title={t('shortcut.title')}
      isLoading={status === undefined && !statusError}
      surface={status !== undefined && !isLive}
    >
      {!isLive || showSteps ? (
        <ShortcutSetup onCreated={() => revalidateApi('shortcuts')} />
      ) : (
        <ShortcutLive last={last} />
      )}

      {isLive && (
        <>
          {cards.length > 0 && (
            <>
              <Group
                action={
                  <Text fontSize="12px" fontWeight={500} color="text.secondary">
                    {cards.length}
                  </Text>
                }
              >
                {t('shortcut.cards.title')}
              </Group>
              <WalletCards
                cards={cards}
                onOpen={card => setOpenCardId(card.id)}
              />
              <Help>{t('shortcut.cards.hint')}</Help>
            </>
          )}

          {tokens.length > 0 && (
            <>
              <Group>{t('shortcut.tokens.title')}</Group>
              <ShortcutTokens
                tokens={tokens}
                revokingId={revokingId}
                onRevoke={onRevoke}
              />
            </>
          )}

          {!showSteps && (
            <Button
              variant="unstyled"
              h="44px"
              fontSize="13.5px"
              fontWeight={600}
              color="brand.text"
              onClick={() => setShowSteps(true)}
            >
              {t('shortcut.live.showSteps')}
            </Button>
          )}
        </>
      )}

      <WalletCardSheet
        card={openCard}
        isSaving={isSavingCard}
        onClose={() => setOpenCardId(null)}
        onSave={onSaveCard}
      />
    </SettingsLayout>
  )
}

export const getStaticProps = settingsStaticProps
