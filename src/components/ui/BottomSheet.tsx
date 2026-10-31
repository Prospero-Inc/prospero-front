import {
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  type DrawerProps,
  useBreakpointValue
} from '@chakra-ui/react'
import type { ReactNode } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  /** Actions row (buttons); stays at thumb height above the home bar. */
  footer?: ReactNode
  initialFocusRef?: DrawerProps['initialFocusRef']
}

/**
 * Sheet that slides up from the bottom on phones and from the right on
 * desktop — the one container for forms, filters and confirmations
 * (docs/diseno-mobile.html). Rounded top, grab handle, safe-area aware.
 */
export const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  initialFocusRef
}: BottomSheetProps) => {
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
        borderTopRadius={isBottom ? '20px' : undefined}
        maxH={isBottom ? '90dvh' : undefined}
      >
        {isBottom && (
          <Box
            aria-hidden
            w={10}
            h={1}
            borderRadius="full"
            bg="border.subtle"
            mx="auto"
            mt={2}
          />
        )}
        <DrawerCloseButton />
        <DrawerHeader color="text.primary">{title}</DrawerHeader>
        <DrawerBody color="text.primary">{children}</DrawerBody>
        {footer && (
          <DrawerFooter
            gap={3}
            borderTopWidth="1px"
            borderColor="border.subtle"
            pb="calc(var(--chakra-space-4) + env(safe-area-inset-bottom))"
          >
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}
