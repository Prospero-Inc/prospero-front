import { formatMoney } from '@/lib/formatMoney'
import { formatRelativeTime } from '@/lib/formatRelativeTime'
import type { ShortcutStatus } from '@/services/shortcuts'
import { Box, Flex, Text } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'

type LastTransaction = NonNullable<ShortcutStatus['lastTransaction']>

/** design .live: green pulse, "Funcionando" and the last expense received. */
export const ShortcutLive = ({ last }: { last: LastTransaction }) => {
  const { t } = useTranslation('settings')
  const { t: tCommon } = useTranslation('common')
  const locale = useRouter().locale ?? 'es'
  const what = `${
    last.description || tCommon('review.untitledExpense')
  }, ${formatMoney(last.amount, locale)}`
  return (
    <Flex
      role="status"
      align="center"
      gap="10px"
      bg="tint.income"
      borderRadius="14px"
      px="14px"
      py="12px"
    >
      <Box
        boxSize="10px"
        flexShrink={0}
        borderRadius="full"
        bg="money.incomeText"
        boxShadow="0 0 0 4px rgba(10,125,89,.18)"
        aria-hidden
      />
      <Box minW={0}>
        <Text fontSize="14.5px" fontWeight={650} color="text.primary">
          {t('shortcut.live.title')}
        </Text>
        <Text fontSize="12px" color="text.secondary" mt="1px">
          {t('shortcut.live.lastReceived', {
            when: formatRelativeTime(last.createdAt, locale),
            what
          })}
        </Text>
      </Box>
    </Flex>
  )
}
