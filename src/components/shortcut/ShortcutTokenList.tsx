import { Help, ListCard, StatusPill } from '@/components/design/settings'
import { formatRelativeTime } from '@/lib/formatRelativeTime'
import type { ShortcutToken } from '@/services/shortcuts'
import { Box, Button, Flex, Text } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'

interface ShortcutTokenListProps {
  tokens: ShortcutToken[]
  /** Token being revoked right now. */
  revokingId: number | null
  onRevoke: (_token: ShortcutToken) => void
}

/** Every token created (newest first): when it was made, when it last sent
 * an expense, and "Revocar" while it's still valid. */
export const ShortcutTokenList = ({
  tokens,
  revokingId,
  onRevoke
}: ShortcutTokenListProps) => {
  const { t } = useTranslation('settings')
  const locale = useRouter().locale ?? 'es'
  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
      new Date(iso)
    )

  if (tokens.length === 0) return <Help>{t('shortcut.tokens.empty')}</Help>

  return (
    <ListCard>
      {tokens.map(token => (
        <Flex
          key={token.id}
          as="article"
          aria-label={token.name}
          align="center"
          gap="12px"
          py="12px"
          opacity={token.revokedAt ? 0.7 : 1}
        >
          <Box flex={1} minW={0}>
            <Text textStyle="rowTitle" noOfLines={1}>
              {token.name}
            </Text>
            <Text textStyle="rowHint" mt="2px">
              {t('shortcut.tokens.created', {
                date: formatDate(token.createdAt)
              })}
            </Text>
            <Text textStyle="rowHint">
              {token.lastUsedAt
                ? t('shortcut.tokens.lastUsed', {
                    when: formatRelativeTime(token.lastUsedAt, locale)
                  })
                : t('shortcut.tokens.neverUsed')}
            </Text>
          </Box>
          {token.revokedAt ? (
            <StatusPill isOn={false}>{t('shortcut.tokens.revoked')}</StatusPill>
          ) : (
            <Button
              variant="ghost"
              h="44px"
              px="10px"
              mr="-10px"
              flexShrink={0}
              color="money.expenseText"
              fontSize="14px"
              fontWeight={600}
              aria-label={t('shortcut.tokens.revokeLabel', {
                name: token.name
              })}
              isLoading={revokingId === token.id}
              onClick={() => onRevoke(token)}
            >
              {t('shortcut.tokens.revoke')}
            </Button>
          )}
        </Flex>
      ))}
    </ListCard>
  )
}
