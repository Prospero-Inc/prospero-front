import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState
} from 'react'

const TitleContext = createContext<{
  title: string
  setTitle: (_title: string) => void
}>({ title: '', setTitle: () => undefined })

/** Holds the current page's title for the shell's top bar. */
export const AppShellTitleProvider = ({
  children
}: {
  children: ReactNode
}) => {
  const [title, setTitle] = useState('')
  return (
    <TitleContext.Provider value={{ title, setTitle }}>
      {children}
    </TitleContext.Provider>
  )
}

export const useAppShellTitle = () => useContext(TitleContext).title

/** Pages (through ProsperoLayout) announce their title to the top bar. */
export const useSetAppShellTitle = (title: string) => {
  const { setTitle } = useContext(TitleContext)
  useEffect(() => setTitle(title), [title, setTitle])
}
