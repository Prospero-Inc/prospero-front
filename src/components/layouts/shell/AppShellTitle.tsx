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
   * a round close button back to `closeHref` (sub-screens), or a text
   * action that submits the page's form (`form` is its id). */
  trailing?: TopBarTrailing
  /** "‹ Más": a back link on the left with the title centered (design
   * .navbar), for screens opened from another one. */
  back?: TopBarBack
}

export interface TopBarAction {
  label: string
  /** id of the <form> the action submits. */
  form: string
  isDisabled?: boolean
  isLoading?: boolean
}

export interface TopBarBack {
  href: string
  label: string
}

export type TopBarTrailing =
  | 'avatar'
  | 'none'
  | { closeHref: string }
  | { action: TopBarAction }

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
  trailing: TopBarTrailing = 'avatar',
  back?: TopBarBack
) => {
  const { setValue } = useContext(TitleContext)
  const trailingKey = JSON.stringify(trailing)
  const backKey = JSON.stringify(back ?? null)
  useEffect(
    () =>
      setValue({
        title,
        greeting,
        trailing: JSON.parse(trailingKey),
        back: JSON.parse(backKey) ?? undefined
      }),
    [title, greeting, trailingKey, backKey, setValue]
  )
}
