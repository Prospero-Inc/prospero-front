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
  /** Right side of the phone top bar: the avatar menu (default), nothing,
   * or a round close button back to `closeHref` (sub-screens). */
  trailing?: TopBarTrailing
}

export type TopBarTrailing = 'avatar' | 'none' | { closeHref: string }

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
export const useSetAppShellTitle = (
  title: string,
  greeting?: string,
  trailing: TopBarTrailing = 'avatar'
) => {
  const { setValue } = useContext(TitleContext)
  const trailingKey = JSON.stringify(trailing)
  useEffect(
    () => setValue({ title, greeting, trailing: JSON.parse(trailingKey) }),
    [title, greeting, trailingKey, setValue]
  )
}
