import { useDisclosure } from '@chakra-ui/react'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react'

import {
  type EditableMovement,
  type QuickAddPreset,
  QuickAddSheet
} from './QuickAddSheet'

interface QuickAddActions {
  /** "+": a new movement (optionally already set to, e.g., a payroll). */
  open: (_preset?: QuickAddPreset) => void
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
  const [preset, setPreset] = useState<QuickAddPreset | null>(null)

  const open = useCallback(
    (next?: QuickAddPreset) => {
      setMovement(null)
      setPreset(next ?? null)
      onOpen()
    },
    [onOpen]
  )
  const edit = useCallback(
    (next: EditableMovement) => {
      setMovement(next)
      setPreset(null)
      onOpen()
    },
    [onOpen]
  )
  const actions = useMemo(() => ({ open, edit }), [open, edit])

  return (
    <QuickAddContext.Provider value={actions}>
      {children}
      <QuickAddSheet
        isOpen={isOpen}
        onClose={onClose}
        movement={movement}
        preset={preset}
      />
    </QuickAddContext.Provider>
  )
}

export const useOpenQuickAdd = () => useContext(QuickAddContext).open

export const useEditMovement = () => useContext(QuickAddContext).edit
