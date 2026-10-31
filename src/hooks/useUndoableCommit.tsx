import { Button, Flex, Text, useToast } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { useCallback, useEffect, useRef } from 'react'

/** How long "Deshacer" stays available before the change is sent. */
export const UNDO_WINDOW_MS = 5000

interface Pending {
  timer: ReturnType<typeof setTimeout>
  commit: () => Promise<void>
}

/**
 * "Deshacer" instead of "¿Seguro?": the item leaves the list at once and
 * the change is only sent to the backend once the undo window passes —
 * so undoing never needs a reverse operation. Anything still pending is
 * sent right away when the screen is left or the app goes to background.
 */
export const useUndoableCommit = () => {
  const toast = useToast()
  const { t } = useTranslation('common')
  const pending = useRef(new Map<string, Pending>())

  const run = useCallback((key: string) => {
    const entry = pending.current.get(key)
    if (!entry) return
    clearTimeout(entry.timer)
    pending.current.delete(key)
    entry.commit().catch(() => undefined) // commit reports its own errors
  }, [])

  const flushAll = useCallback(() => {
    Array.from(pending.current.keys()).forEach(run)
  }, [run])

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushAll()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flushAll)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flushAll)
      flushAll() // leaving the screen: don't lose confirmations
    }
  }, [flushAll])

  /**
   * Schedules `commit`; shows `message` with "Deshacer", which cancels it
   * and calls `onUndo` (e.g. put the item back).
   */
  return useCallback(
    ({
      key,
      message,
      commit,
      onUndo
    }: {
      key: string
      message: string
      commit: () => Promise<void>
      onUndo: () => void
    }) => {
      if (pending.current.has(key)) run(key)
      pending.current.set(key, {
        timer: setTimeout(() => run(key), UNDO_WINDOW_MS),
        commit
      })
      toast({
        id: key,
        duration: UNDO_WINDOW_MS,
        position: 'bottom',
        render: ({ onClose }) => (
          <Flex
            bg="gray.800"
            color="white"
            p={3}
            pl={4}
            borderRadius="lg"
            align="center"
            gap={3}
            boxShadow="lg"
            mb="calc(72px + env(safe-area-inset-bottom))"
          >
            <Text flex={1}>{message}</Text>
            <Button
              size="sm"
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={() => {
                const entry = pending.current.get(key)
                if (entry) {
                  clearTimeout(entry.timer)
                  pending.current.delete(key)
                  onUndo()
                }
                onClose()
              }}
            >
              {t('review.undo')}
            </Button>
          </Flex>
        )
      })
    },
    [run, toast, t]
  )
}
