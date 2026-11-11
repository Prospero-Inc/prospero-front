import { ListCard } from '@/components/design/settings'
import { ChevronRightIcon } from '@/components/icons/app'
import type { WalletCard } from '@/services/walletCards'
import { Box, Flex, Text } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'

import { CATEGORY_PILL, cardArt, categoryKey } from './walletCardStyle'

/** design .art: 46 × 30 card with the design's gradient and a chip. */
const CardArt = ({ id }: { id: number }) => (
  <Box
    w="46px"
    h="30px"
    borderRadius="6px"
    flexShrink={0}
    position="relative"
    bgImage={cardArt(id)}
    aria-hidden
    _after={{
      content: '""',
      position: 'absolute',
      right: '5px',
      bottom: '5px',
      w: '12px',
      h: '8px',
      borderRadius: '2px',
      bg: 'rgba(255,255,255,.55)'
    }}
  />
)

/** "Tus tarjetas de Wallet": each card with its category pill; a tap opens
 * its category sheet. */
export const WalletCards = ({
  cards,
  onOpen
}: {
  cards: WalletCard[]
  onOpen: (_card: WalletCard) => void
}) => {
  const { t } = useTranslation('settings')
  return (
    <ListCard py="2px">
      {cards.map(card => {
        const key = categoryKey(card.defaultCategory)
        const pill = CATEGORY_PILL[key]
        return (
          <Flex
            key={card.id}
            as="button"
            type="button"
            onClick={() => onOpen(card)}
            w="full"
            align="center"
            gap="12px"
            minH="70px"
            py="8px"
            textAlign="left"
            _focusVisible={{ boxShadow: 'outline', outline: 'none' }}
          >
            <CardArt id={card.id} />
            <Box flex={1} minW={0}>
              <Text
                fontSize="14.5px"
                fontWeight={650}
                color="text.primary"
                noOfLines={1}
              >
                {card.name}
                {card.isNew && (
                  <Box
                    as="span"
                    display="inline-flex"
                    alignItems="center"
                    h="18px"
                    px="6px"
                    ml="6px"
                    borderRadius="5px"
                    bg="status.pendingSolid"
                    color="white"
                    fontSize="10px"
                    fontWeight={700}
                    verticalAlign="2px"
                  >
                    {t('shortcut.cards.new')}
                  </Box>
                )}
              </Text>
              <Flex
                as="span"
                display="inline-flex"
                align="center"
                gap="6px"
                h="24px"
                px="10px"
                mt="5px"
                borderRadius="10px"
                fontSize="11.5px"
                fontWeight={700}
                whiteSpace="nowrap"
                bg={pill.bg}
                color={pill.color}
              >
                {pill.mark}
                {t(`shortcut.cards.pill.${key}`)}
              </Flex>
            </Box>
            <ChevronRightIcon
              boxSize="18px"
              color="icon.subtle"
              flexShrink={0}
            />
          </Flex>
        )
      })}
    </ListCard>
  )
}
