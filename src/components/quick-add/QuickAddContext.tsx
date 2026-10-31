import { useDisclosure } from '@chakra-ui/react'
import { createContext, type ReactNode, useContext } from 'react'

import { QuickAddSheet } from './QuickAddSheet'

const QuickAddContext = createContext<() => void>(() => undefined)

/** Makes the "+" quick-add sheet openable from anywhere in the app shell. */
export const QuickAddProvider = ({ children }: { children: ReactNode }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <QuickAddContext.Provider value={onOpen}>
      {children}
      <QuickAddSheet isOpen={isOpen} onClose={onClose} />
    </QuickAddContext.Provider>
  )
}

export const useOpenQuickAdd = () => useContext(QuickAddContext)
