import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState
} from 'react'

interface ShellTitle {
  title: string
  /** Small line above the title (e.g. "Hola, Ana" on Inicio). */
  greeting?: string
}

const TitleContext = createContext<{
  value: ShellTitle
  setValue: (_value: ShellTitle) => void
}>({ value: { title: '' }, setValue: () => undefined })

/** Holds the current page's title for the shell's top bar. */
export const AppShellTitleProvider = ({
  children
}: {
  children: ReactNode
}) => {
  const [value, setValue] = useState<ShellTitle>({ title: '' })
  return (
    <TitleContext.Provider value={{ value, setValue }}>
      {children}
    </TitleContext.Provider>
  )
}

export const useAppShellTitle = () => useContext(TitleContext).value

/** Pages (through ProsperoLayout) announce their title to the top bar. */
export const useSetAppShellTitle = (title: string, greeting?: string) => {
  const { setValue } = useContext(TitleContext)
  useEffect(() => setValue({ title, greeting }), [title, greeting, setValue])
}
