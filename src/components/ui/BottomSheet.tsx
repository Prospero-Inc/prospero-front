import { CloseIcon } from '@/components/icons/app'
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerOverlay,
  type DrawerProps,
  Flex,
  Text,
  useBreakpointValue
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import type { ReactNode } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  /** Actions (buttons); stay at thumb height above the home bar. */
  footer?: ReactNode
  initialFocusRef?: DrawerProps['initialFocusRef']
}

/**
 * Sheet from the bottom on phones (from the right on desktop), drawn as
 * docs/diseno-mobile.html's .sheet: 28 px top corners, grab handle, 18 px
 * title and a round close button. The one container for forms, filters and
 * confirmations.
 */
export const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  initialFocusRef
}: BottomSheetProps) => {
  const { t } = useTranslation('common')
  const placement =
    useBreakpointValue<'bottom' | 'right'>(
      { base: 'bottom', md: 'right' },
      { fallback: 'md' }
    ) ?? 'right'
  const isBottom = placement === 'bottom'

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      placement={placement}
      size="md"
      initialFocusRef={initialFocusRef}
    >
      <DrawerOverlay />
      <DrawerContent
        bg="bg.surface"
        borderTopRadius={isBottom ? '28px' : undefined}
        maxH={isBottom ? '92dvh' : undefined}
        pt="10px"
      >
        {isBottom && (
          <Box
            aria-hidden
            w="40px"
            h="5px"
            borderRadius="3px"
            bg="border.subtle"
            mx="auto"
            mb="14px"
          />
        )}
        <Flex justify="space-between" align="center" px="18px" mb="14px">
          <Text as="h2" fontSize="18px" fontWeight="bold" color="text.primary">
            {title}
          </Text>
          <Box
            as="button"
            type="button"
            onClick={onClose}
            aria-label={t('confirmSheet.close')}
            w="36px"
            h="36px"
            borderRadius="full"
            bg="button.soft"
            color="text.primary"
            display="grid"
            placeItems="center"
          >
            <CloseIcon boxSize="16px" />
          </Box>
        </Flex>
        <DrawerBody px="18px" pt={0} color="text.primary">
          {children}
        </DrawerBody>
        {footer && (
          <DrawerFooter
            gap={3}
            px="18px"
            pt={2}
            pb="calc(18px + env(safe-area-inset-bottom))"
          >
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}
