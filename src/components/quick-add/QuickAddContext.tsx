import { useDisclosure } from '@chakra-ui/react'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react'

import { type EditableMovement, QuickAddSheet } from './QuickAddSheet'

interface QuickAddActions {
  /** "+": a new movement. */
  open: () => void
  /** The same sheet, filled in with an existing movement to edit. */
  edit: (_movement: EditableMovement) => void
}

const QuickAddContext = createContext<QuickAddActions>({
  open: () => undefined,
  edit: () => undefined
})

/** Makes the "+" quick-add sheet openable from anywhere in the app shell,
 * empty or with a movement to edit. */
export const QuickAddProvider = ({ children }: { children: ReactNode }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [movement, setMovement] = useState<EditableMovement | null>(null)

  const open = useCallback(() => {
    setMovement(null)
    onOpen()
  }, [onOpen])
  const edit = useCallback(
    (next: EditableMovement) => {
      setMovement(next)
      onOpen()
    },
    [onOpen]
  )
  const actions = useMemo(() => ({ open, edit }), [open, edit])

  return (
    <QuickAddContext.Provider value={actions}>
      {children}
      <QuickAddSheet isOpen={isOpen} onClose={onClose} movement={movement} />
    </QuickAddContext.Provider>
  )
}

export const useOpenQuickAdd = () => useContext(QuickAddContext).open

export const useEditMovement = () => useContext(QuickAddContext).edit
