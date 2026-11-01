import { Box, Flex } from '@chakra-ui/react'
import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useRef,
  useState
} from 'react'

/** How far the row follows the finger, and how far opens it. */
const MAX_SHIFT = 104
const OPEN_AT = 72

/**
 * A list row that opens with a tap or by swiping it to the left, which
 * uncovers `action` underneath (docs/diseno-mobile.html .swipe: the colored
 * layer below, the row sliding over it with a soft shadow). Vertical drags
 * still scroll the page.
 */
export const SwipeRow = ({
  label,
  action,
  onOpen,
  children
}: {
  /** Accessible name of the row. */
  label: string
  /** What the colored layer says (e.g. "Editar"). */
  action: ReactNode
  onOpen: () => void
  children: ReactNode
}) => {
  const [shift, setShift] = useState(0)
  const start = useRef<{ x: number; y: number } | null>(null)
  const isSwiping = useRef(false)

  const onPointerDown = (event: PointerEvent) => {
    start.current = { x: event.clientX, y: event.clientY }
    isSwiping.current = false
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!start.current) return
    const dx = event.clientX - start.current.x
    const dy = event.clientY - start.current.y
    if (!isSwiping.current) {
      // Mostly vertical: it's a scroll, not a swipe.
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        start.current = null
        return
      }
      if (Math.abs(dx) < 8) return
      isSwiping.current = true
      ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    }
    setShift(Math.max(-MAX_SHIFT, Math.min(0, dx)))
  }

  const finish = () => {
    const opened = isSwiping.current && shift <= -OPEN_AT
    start.current = null
    setShift(0)
    if (opened) onOpen()
  }

  const onClick = () => {
    // A swipe ends with a click too; only a plain tap opens from here.
    if (isSwiping.current) {
      isSwiping.current = false
      return
    }
    onOpen()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen()
    }
  }

  return (
    <Box position="relative" overflow="hidden" mx="-14px">
      <Flex
        aria-hidden
        position="absolute"
        inset={0}
        bg="brand.solid"
        color="white"
        align="center"
        justify="flex-end"
        pr="20px"
        gap="8px"
        fontSize="13px"
        fontWeight="bold"
        opacity={shift < 0 ? 1 : 0}
      >
        {action}
      </Flex>
      <Box
        role="button"
        tabIndex={0}
        aria-label={label}
        position="relative"
        bg="bg.surface"
        px="14px"
        cursor="pointer"
        transform={`translateX(${shift}px)`}
        transition={shift === 0 ? 'transform .2s' : 'none'}
        boxShadow={shift < 0 ? '8px 0 16px -8px rgba(0,0,0,.2)' : 'none'}
        sx={{ touchAction: 'pan-y', userSelect: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        onClick={onClick}
        onKeyDown={onKeyDown}
        _focusVisible={{ boxShadow: 'outline', outline: 'none' }}
      >
        {children}
      </Box>
    </Box>
  )
}
