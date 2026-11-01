import { TrashIcon } from '@/components/icons/app'
import { Button, Flex, Stack, Text } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState
} from 'react'

import { BottomSheet } from './BottomSheet'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  /** Red confirm button, for deletes and other irreversible actions. */
  destructive?: boolean
}

type Confirm = (_options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<Confirm | null>(null)

/**
 * Replaces `window.confirm`: same "await a yes/no" shape, but as an app
 * sheet (thumb-reachable, translated, styled, works in the installed PWA
 * where native dialogs feel foreign). Mounted once in _app.
 */
export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation('common')
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<((_value: boolean) => void) | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  const confirm = useCallback<Confirm>(
    next =>
      new Promise<boolean>(resolve => {
        resolveRef.current = resolve
        setOptions(next)
      }),
    []
  )

  const settle = (value: boolean) => {
    resolveRef.current?.(value)
    resolveRef.current = null
    setOptions(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {/* docs/diseno-mobile.html 13, "Confirmar borrado (hoja)": icon,
          centered title and what happens, then the action and an equally
          big "Cancelar". */}
      <BottomSheet
        isOpen={options !== null}
        onClose={() => settle(false)}
        title={options?.title ?? ''}
        initialFocusRef={cancelRef}
        hero={
          options?.destructive ? (
            <Flex
              boxSize="64px"
              borderRadius="20px"
              bg="tint.expense"
              color="money.expenseText"
              align="center"
              justify="center"
              aria-hidden
            >
              <TrashIcon boxSize="28px" />
            </Flex>
          ) : undefined
        }
        footer={
          <Stack spacing="10px" w="full">
            <Button
              variant={options?.destructive ? 'dangerSolid' : 'brand'}
              size="cta"
              w="full"
              onClick={() => settle(true)}
            >
              {options?.confirmLabel ?? t('confirmSheet.confirm')}
            </Button>
            <Button
              ref={cancelRef}
              variant="soft"
              size="cta"
              w="full"
              onClick={() => settle(false)}
            >
              {t('confirmSheet.cancel')}
            </Button>
          </Stack>
        }
      >
        {options?.description && (
          <Text
            textAlign="center"
            fontSize="13.5px"
            lineHeight="1.5"
            color="text.secondary"
          >
            {options.description}
          </Text>
        )}
      </BottomSheet>
    </ConfirmContext.Provider>
  )
}

/** `if (!(await confirm({ title, destructive: true }))) return` */
export const useConfirm = (): Confirm => {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm needs <ConfirmProvider> (in _app)')
  return confirm
}
