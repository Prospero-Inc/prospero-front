import { IconBox, ListCard } from '@/components/design/settings'
import { KeyIcon } from '@/components/icons/app'
import { formatRelativeTime } from '@/lib/formatRelativeTime'
import type { ShortcutToken } from '@/services/shortcuts'
import { Box, Button, Flex, Text } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'

/** "Tokens": the live ones as .li rows — key, name, "Creado el 11 nov ·
 * usado hace 2 h" and "Revocar". */
export const ShortcutTokens = ({
  tokens,
  revokingId,
  onRevoke
}: {
  tokens: ShortcutToken[]
  revokingId: number | null
  onRevoke: (_token: ShortcutToken) => void
}) => {
  const { t } = useTranslation('settings')
  const locale = useRouter().locale ?? 'es'
  const day = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(
      new Date(iso)
    )
  return (
    <ListCard>
      {tokens.map(token => (
        <Flex
          key={token.id}
          as="article"
          aria-label={token.name}
          align="center"
          gap="12px"
          h="56px"
        >
          <IconBox icon={<KeyIcon boxSize="18px" />} />
          <Box flex={1} minW={0} lineHeight="1.25">
            <Text
              fontSize="15px"
              fontWeight={550}
              color="text.primary"
              noOfLines={1}
            >
              {token.name}
            </Text>
            <Text
              fontSize="12px"
              fontWeight={500}
              color="text.secondary"
              noOfLines={1}
            >
              {token.lastUsedAt
                ? t('shortcut.tokens.used', {
                    date: day(token.createdAt),
                    when: formatRelativeTime(token.lastUsedAt, locale, {
                      style: 'short'
                    })
                  })
                : t('shortcut.tokens.unused', { date: day(token.createdAt) })}
            </Text>
          </Box>
          <Button
            variant="unstyled"
            h="44px"
            px="8px"
            mr="-8px"
            flexShrink={0}
            color="money.expenseText"
            fontSize="13.5px"
            fontWeight={600}
            aria-label={t('shortcut.tokens.revokeLabel', { name: token.name })}
            isLoading={revokingId === token.id}
            onClick={() => onRevoke(token)}
          >
            {t('shortcut.tokens.revoke')}
          </Button>
        </Flex>
      ))}
    </ListCard>
  )
}
